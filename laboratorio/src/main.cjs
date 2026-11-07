'use strict';
const {app, BrowserWindow, protocol, session, dialog} = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const {Runtime} = require('./runtime.cjs');
const {LabError} = require('./science.cjs');

protocol.registerSchemesAsPrivileged([{scheme: 'lab', privileges: {standard: true, secure: true, supportFetchAPI: true, corsEnabled: true}}]);
app.setName('IA en tus manos');
app.enableSandbox();
app.commandLine.appendSwitch('disable-background-networking');
app.commandLine.appendSwitch('no-proxy-server');
const primaryInstance = app.requestSingleInstanceLock();
if (!primaryInstance) app.quit();
// No updater, extension store, external content, cloud inference or first-run downloads.
const BASE = 'lab://laboratorio';
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'; form-action 'self'";
const types = {'.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml'};
let runtime, mainWindow, quitting = false;
app.on('second-instance', () => { if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); } });
const safeUrl = url => { try { const u = new URL(url); return u.protocol === 'lab:' && u.host === 'laboratorio'; } catch { return false; } };
function json(data, status = 200) { return new Response(JSON.stringify(data), {status, headers: {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Security-Policy': CSP}}); }

function configureWindow(window) {
  window.webContents.setWindowOpenHandler(({url}) => {
    if (safeUrl(url) && ['/cards.html', '/guide.html'].includes(new URL(url).pathname)) {
      const child = new BrowserWindow({width: 1000, height: 800, parent: mainWindow, autoHideMenuBar: true,
        webPreferences: {sandbox: true, contextIsolation: true, nodeIntegration: false, webSecurity: true}});
      configureWindow(child); void child.loadURL(url);
    }
    return {action: 'deny'};
  });
  window.webContents.on('will-navigate', (event, url) => { if (!safeUrl(url)) event.preventDefault(); });
}
async function handle(request) {
  const url = new URL(request.url);
  if (!safeUrl(request.url)) return json({error: 'Origen no admitido.'}, 403);
  const origin = request.headers.get('origin');
  if (origin && origin !== BASE) return json({error: 'Origen no admitido.'}, 403);
  try {
    if (url.pathname === '/api/status' && request.method === 'GET') return json(runtime.status());
    if (url.pathname === '/api/prepared' && request.method === 'GET') return json(runtime.prepared.public());
    if (url.pathname === '/api/retry' && request.method === 'POST') {
      if (runtime.busy) throw new LabError('Espera a que termine la consulta.', 'busy', 429);
      void runtime.start(); return json({accepted: true});
    }
    const operation = {'/api/distribution': 'distribution', '/api/compare': 'compare', '/api/generate': 'generate'}[url.pathname];
    if (operation && request.method === 'POST') {
      if (!request.headers.get('content-type')?.startsWith('application/json')) return json({error: 'Usa JSON.'}, 415);
      const body = await request.text();
      if (Buffer.byteLength(body) > 20000) throw new LabError('Solicitud demasiado grande.');
      let data;
      try { data = JSON.parse(body); } catch { throw new LabError('Solicitud JSON inválida.'); }
      return json(await runtime.perform(operation, data));
    }
    if (request.method !== 'GET') return json({error: 'Operación no admitida.'}, 405);
    const allowed = {'/': 'index.html', '/index.html': 'index.html', '/app.js': 'app.js', '/style.css': 'style.css',
      '/cards.html': 'cards.html', '/guide.html': 'guide.html', '/print.css': 'print.css', '/favicon.svg': 'favicon.svg',
      '/splash.html': 'splash.html', '/splash.js': 'splash.js'};
    const name = allowed[url.pathname];
    if (!name) return json({error: 'Archivo no encontrado.'}, 404);
    return new Response(await fs.promises.readFile(path.join(app.getAppPath(), 'static', name)),
      {headers: {'Content-Type': types[path.extname(name)], 'Content-Security-Policy': CSP, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store'}});
  } catch (error) {
    return json({error: error instanceof LabError ? error.message : 'No se pudo leer el paquete. Extrae el ZIP completo o abre la copia anterior.',
      code: error.code ?? 'internal'}, error.status ?? 500);
  }
}

app.on('before-quit', event => {
  if (quitting || !runtime) return;
  event.preventDefault(); quitting = true;
  void runtime.close().finally(() => app.quit());
});
app.on('window-all-closed', () => app.quit());
app.on('child-process-gone', (_event, details) => {
  if (details.type === 'Utility' && details.reason === 'crashed') { /* No network recovery or downloads. */ }
});
process.on('SIGINT', () => app.quit());
process.on('SIGTERM', () => app.quit());

void app.whenReady().then(async () => {
  if (!primaryInstance) return;
  if (app.commandLine.hasSwitch('no-sandbox') || app.commandLine.hasSwitch('disable-web-security')) {
    dialog.showErrorBox('Arranque inseguro rechazado', 'Abre la aplicación sin opciones que desactiven el sandbox o la seguridad web.'); app.quit(); return;
  }
  const ses = session.defaultSession;
  ses.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  ses.setPermissionCheckHandler(() => false);
  ses.webRequest.onBeforeRequest((details, callback) => {
    const allowed = safeUrl(details.url) || details.url.startsWith('blob:' + BASE + '/');
    callback({cancel: !allowed});
  });
  // Download dialog is supplied by the included browser. Never open arbitrary URLs.
  ses.on('will-download', (_event, item) => {
    if (!item.getURL().startsWith('blob:' + BASE + '/')) { item.cancel(); return; }
    item.setSaveDialogOptions({title: 'Guardar el experimento', defaultPath: path.join(app.getPath('documents'), item.getFilename())});
  });
  const appRoot = app.getAppPath();
  const resourcesRoot = app.isPackaged ? process.resourcesPath :
    path.resolve(appRoot, '../.runtime/portable/dev-resources');
  try {
    runtime = new Runtime({appRoot, resourcesRoot, supervisorEnv: {ELECTRON_RUN_AS_NODE: '1'}, requireManifest: app.isPackaged});
  } catch {
    dialog.showErrorBox('Paquete incompleto', 'Extrae de nuevo el ZIP completo. No se encuentran los recursos o los resultados preparados.'); app.quit(); return;
  }
  protocol.handle('lab', handle);
  mainWindow = new BrowserWindow({title: 'IA en tus manos', width: 1370, height: 860, minWidth: 960, minHeight: 650,
    backgroundColor: '#132c35', autoHideMenuBar: true,
    webPreferences: {sandbox: true, contextIsolation: true, nodeIntegration: false, webSecurity: true, spellcheck: false}});
  configureWindow(mainWindow);
  mainWindow.on('closed', () => app.quit());
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    if (details.reason !== 'clean-exit' && !quitting) {
      dialog.showMessageBox(mainWindow, {type: 'error', title: 'La ventana se interrumpió',
        message: 'Puedes volver a abrir el laboratorio. Los experimentos sin guardar se perdieron.', buttons: ['Reabrir', 'Cerrar']})
        .then(({response}) => response === 0 ? mainWindow.loadURL(BASE + '/splash.html') : app.quit());
    }
  });
  await mainWindow.loadURL(BASE + '/splash.html');
  void runtime.start();
}).catch(() => { dialog.showErrorBox('No se pudo abrir la aplicación', 'Comprueba que extrajiste el paquete completo y que corresponde a tu sistema. Consulta LEEME.txt.'); app.quit(); });
