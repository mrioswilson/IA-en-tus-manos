'use strict';
// This process owns only its own llama-server. Parent pipe EOF also stops it after
// an abnormal application exit. It never looks for, stops or configures Ollama.
const {spawn} = require('node:child_process');
const net = require('node:net');
const readline = require('node:readline');
const path = require('node:path');
const {call} = require('./transport.cjs');
let native = null, stopping = false, initialized = false, exited = false;
function report(data) { if (!process.stdout.destroyed) process.stdout.write(JSON.stringify(data) + '\n'); }
async function stop() {
  if (stopping) return; stopping = true;
  if (native && native.exitCode === null && native.signalCode === null) {
    const p = native;
    await new Promise(resolve => {
      let done = false;
      const finish = () => { if (!done) { done = true; clearTimeout(timer); resolve(); } };
      const timer = setTimeout(() => { p.kill('SIGKILL'); }, 2500);
      p.once('exit', finish); p.kill('SIGTERM');
      setTimeout(finish, 4500).unref();
    });
  }
  report({type: 'stopped'}); process.exit(0);
}
function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer(); s.once('error', reject);
    s.listen(0, '127.0.0.1', () => { const port = s.address().port; s.close(error => error ? reject(error) : resolve(port)); });
  });
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function start(config) {
  for (let attempt = 0; attempt < 3 && !stopping; attempt++) {
    const port = await freePort();
    const args = ['-m', config.model, '-c', '2048', '-t', '2', '-tb', '2', '-b', '512', '-ub', '512',
      '-ngl', '0', '--device', 'none', '--no-op-offload', '--no-kv-offload', '--parallel', '1', '--host', '127.0.0.1', '--port', String(port), '--api-key', config.secret,
      '--no-webui', '--offline', '--fit', 'off', '--no-cache-prompt', '--cache-ram', '0', '--log-disable'];
    const env = {};
    for (const key of ['SystemRoot', 'SYSTEMROOT', 'WINDIR', 'TEMP', 'TMP', 'HOME', 'USERPROFILE', 'LOCALAPPDATA', 'LANG', 'LC_ALL'])
      if (process.env[key]) env[key] = process.env[key];
    env.PATH = path.dirname(config.executable);
    if (process.platform === 'linux') env.LD_LIBRARY_PATH = path.dirname(config.executable);
    // An optional test harness adds an external-connection denial layer. The
    // desktop entry point never sets this; no renderer input can set it.
    if (process.platform === 'linux' && config.offlineGuard) {
      env.LD_PRELOAD = config.offlineGuard;
      if (process.env.IA_LAB_OFFLINE_LOG) env.IA_LAB_OFFLINE_LOG = process.env.IA_LAB_OFFLINE_LOG;
    }
    native = spawn(config.executable, args, {cwd: path.dirname(config.executable), env, windowsHide: true, stdio: ['ignore', 'ignore', 'pipe']});
    const p = native; let spawnError = null;
    p.on('error', error => { spawnError = error; });
    // Drain diagnostics without persisting student text or an API credential.
    p.stderr.on('data', () => {});
    p.once('exit', (code, signal) => {
      if (exited && !stopping) report({type: 'crashed', code, signal});
    });
    const deadline = Date.now() + 90000;
    while (Date.now() < deadline && !stopping) {
      if (spawnError || p.exitCode !== null || p.signalCode !== null) break;
      try {
        const health = await call(port, config.secret, '/health', undefined, {timeout: 1500});
        if (health.data.status === 'ok') {
          exited = true;
          report({type: 'ready', port, pid: p.pid, args: args.map((value, i) => args[i - 1] === '--api-key' ? '[private local credential]' : value)});
          return;
        }
      } catch { /* startup can return 503 while the model loads */ }
      await delay(200);
    }
    if (stopping) return;
    if (p.exitCode === null && p.signalCode === null) {
      p.kill('SIGKILL'); await new Promise(resolve => p.once('exit', resolve));
    }
    if (attempt === 2) throw new Error(spawnError?.code || 'engine_start_failed');
  }
}
const input = readline.createInterface({input: process.stdin});
input.on('line', line => {
  try {
    const message = JSON.parse(line);
    if (message.type === 'stop') { void stop(); return; }
    if (message.type !== 'init' || initialized) return;
    initialized = true;
    void start(message).catch(() => { report({type: 'failed'}); void stop(); });
  } catch { report({type: 'failed'}); void stop(); }
});
input.on('close', () => void stop());
process.on('SIGTERM', () => void stop());
process.on('SIGINT', () => void stop());
process.stdout.on('error', () => void stop());
