'use strict';
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const {spawn} = require('node:child_process');
const readline = require('node:readline');
const {call} = require('./transport.cjs');
const {PreparedStore} = require('./prepared.cjs');
const {MODEL, LabError, validate, engineRequest, resultFromPair} = require('./science.cjs');

async function hashFile(file) {
  const h = crypto.createHash('sha256');
  for await (const chunk of fs.createReadStream(file)) h.update(chunk);
  return h.digest('hex');
}
class Runtime {
  constructor({appRoot, resourcesRoot, nodeExecutable = process.execPath, supervisorEnv = {}, requireManifest = true, testOfflineGuard = null}) {
    this.root = appRoot; this.resourcesRoot = resourcesRoot; this.nodeExecutable = nodeExecutable; this.supervisorEnv = supervisorEnv;
    this.requireManifest = requireManifest; this.prepared = new PreparedStore(appRoot);
    this.testOfflineGuard = testOfflineGuard;
    try { this.model = JSON.parse(fs.readFileSync(path.join(resourcesRoot, 'models/model-manifest.json'), 'utf8')); }
    catch { this.model = {file: 'Qwen3.5-2B-Q4_K_M.gguf', name: MODEL, bytes: 1274396992,
      sha256: '20cb277f0967ace47b0b5d5658e5e494a88937f7378b74b5a266496400938f4c', quantization: 'Q4_K_M'}; }
    this.lock = JSON.parse(fs.readFileSync(path.join(appRoot, 'build-lock.json'), 'utf8'));
    this.state = {phase: 'starting', message: 'Preparando el laboratorio…', connected: false};
    this.provenance = {engine: 'llama.cpp', build: this.lock.llama_tag, commit: this.lock.llama_commit,
      model_sha256: this.model.sha256, quantization: 'Q4_K_M', ollama_manifest_digest: this.model.ollama_manifest_digest,
      platform: process.platform, arch: process.arch, os_release: os.release(), node_version: process.versions.node,
      acceleration: 'CPU', context: 2048, threads: 2, prompt_cache: false};
    this.secret = crypto.randomBytes(32).toString('hex'); this.busy = false; this.starting = null; this.closed = false;
    this.supervisor = null; this.port = null; this.verifiedFiles = false;
  }
  status() {
    return {...this.state, models: this.state.connected ? [{name: MODEL, digest: this.model.sha256, size: this.model.bytes}] : [],
      preferred: MODEL, prepared: this.prepared.public(), version: this.lock.llama_tag,
      max_prompt: 1200, engine: 'llama.cpp', environment: this.provenance, semantics_verified: this.state.connected,
      message: this.state.message};
  }
  start() {
    if (this.closed) return Promise.resolve();
    if (this.starting) return this.starting;
    this.starting = this._start().catch(async error => {
      await this.stopEngine();
      this.state = {phase: 'failed', connected: false, message: error instanceof LabError ? error.message :
        'No se pudo iniciar la IA incluida. Puedes reintentar el motor o continuar con resultados preparados.'};
    }).finally(() => { this.starting = null; });
    return this.starting;
  }
  async verify() {
    this.state = {phase: 'verifying', connected: false, message: 'Comprobando la integridad del modelo y los componentes incluidos…'};
    const manifestFile = path.join(this.root, 'runtime-manifest.json');
    let modelVerified = false;
    if (fs.existsSync(manifestFile)) {
      const manifestRaw = await fsp.readFile(manifestFile);
      this.provenance.runtime_manifest_sha256 = crypto.createHash('sha256').update(manifestRaw).digest('hex');
      const manifest = JSON.parse(manifestRaw.toString('utf8'));
      if (manifest.platform !== process.platform || manifest.arch !== process.arch)
        throw new LabError('Este paquete corresponde a otro sistema o arquitectura. Abre el paquete adecuado.', 'architecture', 503);
      for (const record of manifest.files) {
        if (record.path.includes('..') || path.isAbsolute(record.path)) throw new LabError('Manifiesto inválido.', 'integrity', 503);
        const file = path.join(this.resourcesRoot, record.path);
        if (record.symlink !== undefined) {
          const target = await fsp.readlink(file);
          const relative = path.relative(this.resourcesRoot, path.resolve(path.dirname(file), target));
          if (target !== record.symlink || relative.startsWith('..') || path.isAbsolute(relative))
            throw new LabError('Un enlace del paquete no coincide con el original. Extrae de nuevo el ZIP.', 'integrity', 503);
          continue;
        }
        if ((await fsp.stat(file)).size !== record.bytes || await hashFile(file) !== record.sha256)
          throw new LabError('Un archivo del paquete está dañado o incompleto. Extrae nuevamente el ZIP completo. Puedes usar Preparados si está intacto.', 'integrity', 503);
        if (record.path === 'models/' + this.model.file && record.sha256 === this.model.sha256) modelVerified = true;
        if (this.closed) return;
      }
    } else if (this.requireManifest) throw new LabError('Falta el manifiesto del paquete. Extrae de nuevo el ZIP completo.', 'integrity', 503);
    const modelFile = path.join(this.resourcesRoot, 'models', this.model.file);
    if (this.model.sha256 !== '20cb277f0967ace47b0b5d5658e5e494a88937f7378b74b5a266496400938f4c' ||
        (!modelVerified && await hashFile(modelFile) !== this.model.sha256))
      throw new LabError('Los pesos del modelo no coinciden con el original verificado. Puedes continuar con Preparados.', 'integrity', 503);
    this.verifiedFiles = true;
  }
  async _start() {
    await this.stopEngine();
    if (!this.verifiedFiles) await this.verify();
    if (this.closed) return;
    const executable = path.join(this.resourcesRoot, 'engine', process.platform === 'win32' ? 'llama-server.exe' : 'llama-server');
    this.state = {phase: 'loading', connected: false, message: 'Cargando Qwen 3.5 de 2B en este computador…'};
    const child = spawn(this.nodeExecutable, [path.join(this.root, 'src/supervisor.cjs')],
      {env: {...process.env, ...this.supervisorEnv}, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe']});
    this.supervisor = child;
    child.stderr.on('data', () => {});
    await new Promise((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => finish(new LabError('La carga superó 100 segundos. Reintenta o abre Preparados.', 'timeout', 504)), 100000);
      const finish = error => { if (settled) return; settled = true; clearTimeout(timer); error ? reject(error) : resolve(); };
      child.once('error', () => finish(new LabError('No se pudo abrir el motor incluido.', 'engine_start_failed', 503)));
      child.once('exit', () => {
        this.state = {phase: 'failed', connected: false, message: 'El motor se cerró. Pulsa Reintentar motor o elige Preparados.'};
        finish(new LabError(this.state.message, 'engine_start_failed', 503));
      });
      const lines = readline.createInterface({input: child.stdout});
      lines.on('line', line => {
        try {
          const message = JSON.parse(line);
          if (message.type === 'ready') { this.port = message.port; this.nativePid = message.pid; this.provenance.launch_args = message.args; finish(); }
          else if (['failed', 'crashed'].includes(message.type)) {
            this.state = {phase: 'failed', connected: false, message: 'El motor de IA falló. Puedes reintentarlo o continuar con Preparados.'};
            finish(new LabError(this.state.message, 'engine_start_failed', 503));
          }
        } catch { /* Ignore non-protocol output; never expose credentials. */ }
      });
      child.stdin.on('error', () => {});
      child.stdin.write(JSON.stringify({type: 'init', executable, model: path.join(this.resourcesRoot, 'models', this.model.file), secret: this.secret,
        offlineGuard: this.testOfflineGuard}) + '\n');
    });
    if (this.closed) return;
    this.state = {phase: 'checking', connected: false, message: 'Verificando probabilidades reales y temperatura…'};
    const props = await call(this.port, this.secret, '/props');
    this.provenance.engine_build_info = props.data.build_info;
    if (!JSON.stringify(props.data.build_info).includes(this.lock.llama_commit.slice(0, 9)))
      throw new LabError('La versión del motor no coincide con la incluida.', 'engine_version', 503);
    const reference = await this.infer({prompt: 'El gato duerme sobre la', temperature: 1, seed: 42, count: 1});
    const greedy = await this.infer({prompt: 'El gato duerme sobre la', temperature: 0, seed: 42, count: 1});
    for (const [i, t] of reference.distribution.alternatives.entries()) {
      const effective = reference.adjusted_distribution.alternatives[i];
      if (t.id !== effective.id || Math.abs(t.probability - effective.probability) > 1e-5)
        throw new LabError('El motor no pasó la comprobación de probabilidades a T=1.', 'semantics_failed', 503);
    }
    this.provenance.startup_self_check = {checked_at: new Date().toISOString(), t1_max_error:
      Math.max(...reference.distribution.alternatives.map((t, i) => Math.abs(t.probability - reference.adjusted_distribution.alternatives[i].probability))),
      greedy_token_id: greedy.distribution.selected.id, greedy_effective_probability: greedy.adjusted_distribution.selected.probability};
    this.state = {phase: 'ready', connected: true, message: 'IA local preparada. Todo funciona sin Internet.'};
  }
  async infer(spec) {
    const began = performance.now();
    const tokenReq = {content: spec.prompt, add_special: false, parse_special: false, with_pieces: false};
    const tokenResponse = await call(this.port, this.secret, '/tokenize', tokenReq);
    const tokens = tokenResponse.data.tokens;
    if (!Array.isArray(tokens) || !tokens.length || tokens.length + spec.count > 2048 || tokens.some(t => !Number.isInteger(t) || t < 0))
      throw new LabError('El texto no cabe completo en el contexto del modelo.', 'context_limit', 400);
    const baseRequest = {...engineRequest(tokens, 1, spec.seed, 1, true), n_probs: 248320};
    const actualRequest = engineRequest(tokens, spec.temperature, spec.seed, spec.count, true);
    const base = await call(this.port, this.secret, '/completion', baseRequest, {maxBytes: 70_000_000});
    const actual = await call(this.port, this.secret, '/completion', actualRequest);
    const out = resultFromPair(spec, {request: tokenReq, token_ids: tokens}, baseRequest, base, actualRequest, actual, this.provenance);
    out.elapsed_s = (performance.now() - began) / 1000;
    return out;
  }
  async perform(operation, body) {
    const spec = validate(body, operation);
    const second = operation === 'compare' ? validate({...body, prompt: body.prompt_b}, 'distribution') : null;
    if (spec.source === 'prepared') {
      const a = this.prepared.replay(spec);
      return second ? {a, b: this.prepared.replay(second)} : a;
    }
    if (!this.state.connected) throw new LabError(this.state.message + ' Usa Reintentar motor o selecciona Preparados.', 'disconnected', 503);
    if (this.busy) throw new LabError('La IA está atendiendo otra consulta. Espera un momento.', 'busy', 429);
    this.busy = true;
    try { const a = await this.infer(spec); return second ? {a, b: await this.infer(second)} : a; }
    catch (error) {
      if (['disconnected', 'timeout', 'engine_error'].includes(error.code)) {
        this.state = {phase: 'failed', connected: false, message: 'Se interrumpió el motor. Pulsa Reintentar motor o elige Preparados.'};
        await this.stopEngine();
      }
      throw error;
    } finally { this.busy = false; }
  }
  async stopEngine() {
    const child = this.supervisor; this.supervisor = null; this.port = null;
    if (!child || child.exitCode !== null || child.signalCode !== null) return;
    await new Promise(resolve => {
      let done = false;
      const finish = () => { if (!done) { done = true; clearTimeout(timer); resolve(); } };
      const timer = setTimeout(() => { child.stdin.destroy(); child.kill('SIGTERM'); }, 5000);
      child.once('exit', finish);
      child.stdin.end(JSON.stringify({type: 'stop'}) + '\n');
      setTimeout(finish, 7500).unref();
    });
  }
  async close() { this.closed = true; this.state.connected = false; await this.stopEngine(); }
}
module.exports = {Runtime, hashFile};
