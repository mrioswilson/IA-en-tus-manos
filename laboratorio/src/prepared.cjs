'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {LabError, distribution, digest} = require('./science.cjs');
class PreparedStore {
  constructor(root) { this.root = root; this.manifest = JSON.parse(fs.readFileSync(path.join(root, 'prepared/manifest.json'), 'utf8')); }
  find(prompt, temperature, seed) { return this.manifest.records.find(r => r.prompt === prompt && r.temperature === temperature && r.seed === seed); }
  public() { const m = this.manifest; return {model: m.model, recorded_on: m.recorded_on, prompts: m.prompts, story_start: m.story_start, record_count: m.records.length}; }
  replay(spec) {
    const record = this.find(spec.prompt, spec.temperature, spec.seed);
    if (!record) throw new LabError('No hay un resultado preparado para ese texto, temperatura y semilla. Elige un ejemplo guardado.', 'not_prepared', 404);
    if (!/^experiments\/raw\/[^/]+\/response\.json$/u.test(record.path)) throw new LabError('Ruta de respaldo inválida.', 'corrupt_prepared', 500);
    const file = path.join(this.root, record.path), raw = fs.readFileSync(file);
    if (digest(raw) !== record.sha256) throw new LabError('El respaldo no coincide con su hash. No se mostrarán datos.', 'corrupt_prepared', 500);
    const original = JSON.parse(raw.toString('utf8')), request = JSON.parse(fs.readFileSync(path.join(path.dirname(file), 'request.json'), 'utf8'));
    const dist = distribution(original.logprobs?.[0], {engine: 'Ollama 0.40.14', minimum: 5});
    for (const t of dist.alternatives) t.prepared_next = Boolean(this.find(spec.prompt + t.token, spec.temperature, spec.seed));
    return {source: 'prepared', engine: 'Ollama 0.40.14 (grabación)', semantics_verified: true, distribution: dist, adjusted_distribution: null,
      request, text: original.response, original, raw_response_base64: raw.toString('base64'), raw_sha256: record.sha256,
      recorded_at: original.created_at, elapsed_s: record.elapsed_s, source_path: record.path,
      model_digest: this.manifest.model_digest ?? '1e2d21a4f03ab9e4a9c1976a4b7e88f21de61d65f2c5485d8fde8942be73f1e7',
      replay_note: 'Consulta auténtica de Ollama guardada. Su longitud es la de request original; no es una nueva generación. Solo incluye probabilidades base. No se reconstruye temperatura con un top 10 incompleto.'};
  }
}
module.exports = {PreparedStore};
