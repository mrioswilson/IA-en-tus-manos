'use strict';
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const MODEL = 'qwen3.5:2b-q4_K_M';
const TEMPERATURES = [0, 0.5, 1, 1.5];

class LabError extends Error {
  constructor(message, code = 'invalid', status = 400) {
    super(message); this.code = code; this.status = status;
  }
}
function validate(body, operation) {
  if (!body || Array.isArray(body) || typeof body !== 'object') throw new LabError('Solicitud inválida.');
  const prompt = body.prompt;
  if (typeof prompt !== 'string' || !prompt.trim()) throw new LabError('Escribe primero el inicio de una frase.');
  if (prompt.length > 1200 || Buffer.byteLength(prompt) > 1600) throw new LabError('Acorta el texto: máximo 1200 caracteres y 1600 bytes.');
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/u.test(prompt)) throw new LabError('El texto contiene caracteres de control.');
  const temperature = body.temperature ?? 1, seed = body.seed ?? 42;
  const count = operation === 'generate' ? (body.count ?? 10) : 1;
  if (!TEMPERATURES.includes(temperature)) throw new LabError('Temperatura disponible: 0, 0,5, 1 o 1,5.');
  if (!Number.isInteger(seed) || seed < 0 || seed > 2147483647) throw new LabError('Semilla inválida.');
  if (!Number.isInteger(count) || count < 1 || count > 32) throw new LabError('La continuación admite entre 1 y 32 tokens.');
  const source = body.source ?? 'live';
  if (!['live', 'prepared'].includes(source)) throw new LabError('Fuente de datos inválida.');
  if (body.model !== undefined && body.model !== MODEL) throw new LabError('Este paquete incluye Qwen 3.5 de 2B.');
  return {prompt, temperature, seed, count, source};
}
function visibleToken(text) {
  if (!text) return '∅ (vacío)';
  return Array.from(text, c => c === ' ' ? '·' : c === '\n' ? '↵' : c === '\t' ? '⇥' : c === '\r' ? '␍' :
    c === '·' ? '\\u00b7' : c === '\u00a0' ? '⍽' : /[\p{Cf}\p{Zl}\p{Zp}\p{Mn}\p{Mc}\p{Me}\p{Cc}]/u.test(c) ?
      '\\u' + c.codePointAt(0).toString(16).padStart(4, '0') : c).join('');
}
function tokenInfo(item, post = false, engine = 'llama.cpp') {
  if (!item || typeof item.token !== 'string') throw new LabError('El motor no entregó un token válido.', 'invalid_logprobs', 502);
  let probability, logprob;
  if (post) {
    probability = item.prob;
    if (typeof probability !== 'number' || !Number.isFinite(probability) || probability < 0 || probability > 1)
      throw new LabError('Probabilidad efectiva inválida.', 'invalid_logprobs', 502);
    logprob = probability === 0 ? null : Math.log(probability);
  } else {
    logprob = item.logprob;
    if (typeof logprob !== 'number' || !Number.isFinite(logprob) || logprob > 0)
      throw new LabError('Log-probabilidad inválida.', 'invalid_logprobs', 502);
    probability = Math.exp(logprob);
  }
  const bytes = item.bytes ?? null;
  if (bytes !== null && (!Array.isArray(bytes) || bytes.some(x => !Number.isInteger(x) || x < 0 || x > 255)))
    throw new LabError('Bytes de token inválidos.', 'invalid_logprobs', 502);
  const id = item.id ?? null;
  if (id !== null && (!Number.isInteger(id) || id < 0)) throw new LabError('ID de token inválido.', 'invalid_logprobs', 502);
  const special = /^(<\||\[end|\[END)/u.test(item.token) || ['', '<s>', '</s>', '<unk>', '<pad>', '[UNK]', '[PAD]'].includes(item.token);
  let appendable = !special && !item.token.includes('\ufffd') && !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/u.test(item.token);
  if (bytes !== null) {
    try { appendable = appendable && new TextDecoder('utf-8', {fatal: true}).decode(Uint8Array.from(bytes)) === item.token; }
    catch { appendable = false; }
  }
  return {id, token: item.token, display: visibleToken(item.token), bytes, bytes_origin: engine, probability, logprob, special, appendable};
}
function distribution(first, {post = false, engine = 'llama.cpp', minimum = post ? 1 : 10} = {}) {
  if (!first) throw new LabError('El motor no devolvió probabilidades. Puedes elegir Preparados.', 'missing_logprobs', 502);
  const selected = tokenInfo(first, post, engine), top = first[post ? 'top_probs' : 'top_logprobs'];
  if (!Array.isArray(top) || top.length < minimum || top.length > 100)
    throw new LabError('Faltan candidatos numéricos válidos.', 'missing_logprobs', 502);
  const alternatives = top.map(t => tokenInfo(t, post, engine)).sort((a, b) => b.probability - a.probability);
  const keys = alternatives.map(t => t.id === null ? JSON.stringify([t.token, t.bytes]) : t.id);
  if (new Set(keys).size !== keys.length) throw new LabError('El motor entregó tokens duplicados.', 'ambiguous_tokens', 502);
  const mass = alternatives.reduce((sum, t) => sum + t.probability, 0);
  if (mass > 1 + 1e-5) throw new LabError('Las probabilidades suman más de uno.', 'invalid_mass', 502);
  return {selected, alternatives, top_mass: mass, residual: Math.max(0, 1 - mass), residual_rounding_clamped: mass > 1,
    probability_kind: post ? 'after_temperature_full_vocabulary' : 'base_before_temperature',
    probability_note: post ? 'Probabilidades del motor después de temperatura; denominador sobre todo el vocabulario, sin normalizar el top 10.' :
      'Probabilidades originales anteriores a temperatura; escala absoluta, sin normalizar el top 10.'};
}
function engineRequest(tokens, temperature, seed, count, post) {
  return {prompt: tokens, n_predict: count, temperature, seed, stream: false, n_probs: 10,
    post_sampling_probs: post, samplers: ['temperature'], top_k: 0, top_p: 1, min_p: 0, typical_p: 1,
    repeat_penalty: 1, presence_penalty: 0, frequency_penalty: 0, dry_multiplier: 0,
    dynatemp_range: 0, mirostat: 0, xtc_probability: 0, logit_bias: [], stop: [],
    ignore_eos: false, cache_prompt: false, return_tokens: true};
}
const digest = raw => crypto.createHash('sha256').update(raw).digest('hex');
function capture(request, response, compress = false) {
  if (compress) return {request, raw_response_gzip_base64: zlib.gzipSync(response.raw).toString('base64'),
    raw_sha256: digest(response.raw), raw_bytes: response.raw.length, compression: 'gzip'};
  return {request, raw_response_base64: response.raw.toString('base64'), raw_sha256: digest(response.raw), original: response.data};
}
function resultFromPair(spec, tokenization, baseRequest, base, actualRequest, actual, provenance) {
  const b = base.data, a = actual.data;
  for (const response of [b, a]) {
    if (response.stop !== true || response.truncated !== false || typeof response.content !== 'string' ||
        !Array.isArray(response.completion_probabilities) || !response.completion_probabilities.length)
      throw new LabError('La generación quedó incompleta o perdió contexto. Reintenta con un texto más corto.', 'incomplete', 502);
  }
  // Use the native T=1 sampler over the ENTIRE vocabulary as the base measure.
  // b12128's pre-sampling reporting path sums float32 in an order that loses mass;
  // its actual sampler uses a double accumulator. The raw diagnostic is retained
  // in evidence, but that inaccurate reporting path is not used for product bars.
  const all = b.completion_probabilities[0].top_probs;
  if (!Array.isArray(all) || all.length < 100 || baseRequest.n_probs !== 248320 ||
      baseRequest.temperature !== 1 || b.generation_settings.temperature !== 1 ||
      b.generation_settings.n_probs !== 248320 ||
      b.generation_settings.post_sampling_probs !== true || a.generation_settings.post_sampling_probs !== true ||
      a.generation_settings.temperature !== spec.temperature ||
      a.generation_settings.seed !== spec.seed ||
      JSON.stringify(a.generation_settings.samplers) !== '["temperature"]' ||
      JSON.stringify(b.generation_settings.samplers) !== '["temperature"]' ||
      b.prompt !== spec.prompt || a.prompt !== spec.prompt ||
      !Array.isArray(a.tokens) || a.tokens[0] !== a.completion_probabilities[0].id)
    throw new LabError('El motor no devolvió el vocabulario completo y la configuración esperada.', 'semantics_failed', 502);
  const seen = new Set(); let mass = 0;
  for (const item of all) {
    if (!Number.isInteger(item.id) || item.id < 0 || item.id >= 248320 || seen.has(item.id) ||
        typeof item.prob !== 'number' || !Number.isFinite(item.prob) || item.prob <= 0 || item.prob > 1)
      throw new LabError('Vocabulario de probabilidades inválido.', 'semantics_failed', 502);
    seen.add(item.id); mass += item.prob;
  }
  if (Math.abs(mass - 1) > 1e-5) throw new LabError('Las probabilidades del vocabulario completo no suman uno.', 'semantics_failed', 502);
  const selectedActual = a.completion_probabilities[0];
  const selectedBase = all.find(t => t.id === selectedActual.id);
  if (!selectedBase) throw new LabError('La probabilidad base del token elegido no es representable. No se mostrará como cero exacto.', 'numeric_underflow', 502);
  const originalDist = distribution({...selectedBase, top_probs: all.slice(0, 10)}, {post: true});
  originalDist.probability_kind = 'base_temperature_1_full_vocabulary';
  originalDist.probability_note = 'Probabilidades originales del muestreador nativo a T=1, con todo el vocabulario y sin filtros. No se normaliza el top 10.';
  const adjusted = distribution(a.completion_probabilities[0], {post: true});
  if (JSON.stringify(originalDist.selected.bytes) !== JSON.stringify(adjusted.selected.bytes))
    throw new LabError('Los bytes del token elegido no coincidieron entre mediciones.', 'inconsistent_pair', 502);
  const baseIds = originalDist.alternatives.map(t => t.id), adjustedIds = adjusted.alternatives.map(t => t.id);
  if (spec.temperature === 0) {
    if (adjustedIds.length !== 1 || adjusted.selected.probability !== 1 || adjusted.selected.id !== baseIds[0])
      throw new LabError('El control de temperatura cero no pasó la comprobación.', 'semantics_failed', 502);
  } else if (JSON.stringify(baseIds) !== JSON.stringify(adjustedIds)) {
    throw new LabError('La temperatura alteró inesperadamente el orden de candidatos. No se mostrarán datos inconsistentes.', 'semantics_failed', 502);
  }
  // Independently verify the native temperature output from the full base vector.
  // The displayed values remain the native sampler values, never a top-N softmax.
  let denominator = 1, maximumLog = Math.log(all[0].prob), maximumError = 0;
  if (spec.temperature > 0) {
    denominator = all.reduce((s, t) => s + Math.exp((Math.log(t.prob) - maximumLog) / spec.temperature), 0);
    for (const token of [...adjusted.alternatives, adjusted.selected]) {
      const p0 = all.find(t => t.id === token.id)?.prob;
      const expected = p0 ? Math.exp((Math.log(p0) - maximumLog) / spec.temperature) / denominator : 0;
      maximumError = Math.max(maximumError, Math.abs(expected - token.probability));
    }
    if (maximumError > 2e-6) throw new LabError('La distribución del motor no pasó el control de temperatura sobre todo el vocabulario.', 'semantics_failed', 502);
  }
  const effectiveById = new Map(adjusted.alternatives.map(t => [t.id, t.probability]));
  for (const t of originalDist.alternatives) t.adjusted_probability = spec.temperature === 0 ? (t.id === adjusted.selected.id ? 1 : 0) : effectiveById.get(t.id);
  originalDist.selected.adjusted_probability = adjusted.selected.probability;
  return {source: 'live', engine: 'llama.cpp', model_digest: provenance.model_sha256,
    semantics_verified: true, semantics_scope: 'native full-vocabulary sampler at T=1; actual native sampling at desired T; full-vocabulary temperature identity checked per result',
    distribution: originalDist, adjusted_distribution: adjusted, text: a.content,
    request: {model: MODEL, prompt: spec.prompt, raw: true, options: {temperature: spec.temperature, seed: spec.seed, num_predict: spec.count, num_ctx: 2048}},
    original: a, raw_response_base64: actual.raw.toString('base64'), raw_sha256: digest(actual.raw),
    recorded_at: new Date().toISOString(), engine_provenance: provenance,
    audit: {tokenization, base: capture(baseRequest, base, true), sampled: capture(actualRequest, actual),
      full_vocabulary: {vocabulary_size: 248320, positive_probabilities: all.length, reported_mass: mass,
        missing_ids: 'Only numerical zeros omitted by native post_sampling_probs', temperature_identity_max_absolute_error: maximumError},
      method: 'Base = native T=1 sampler over all 248320 token IDs. Actual = native sampler at requested T, same raw prompt IDs, cache disabled, only temperature sampler. Base probability of the ACTUAL selected ID looked up in the full vector. Full raw base HTTP body preserved losslessly as gzip/base64; SHA-256 hashes the decompressed body.'}};
}
module.exports = {MODEL, TEMPERATURES, LabError, validate, visibleToken, tokenInfo, distribution, engineRequest, digest, resultFromPair};
