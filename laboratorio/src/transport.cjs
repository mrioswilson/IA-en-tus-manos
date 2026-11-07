'use strict';
const http = require('node:http');
const {LabError} = require('./science.cjs');
function call(port, secret, path, payload, {timeout = 35000, maxBytes = 8_000_000} = {}) {
  return new Promise((resolve, reject) => {
    const rawBody = payload === undefined ? null : Buffer.from(JSON.stringify(payload));
    let settled = false;
    const fail = error => { if (!settled) { settled = true; reject(error); } };
    const req = http.request({host: '127.0.0.1', port, path, method: rawBody ? 'POST' : 'GET',
      headers: {'Authorization': 'Bearer ' + secret, 'Content-Type': 'application/json', ...(rawBody ? {'Content-Length': rawBody.length} : {})}}, res => {
      const parts = []; let size = 0;
      res.on('data', chunk => { size += chunk.length; if (size > maxBytes) { req.destroy(); fail(new LabError('Respuesta demasiado grande.', 'oversize', 502)); } else parts.push(chunk); });
      res.on('error', () => fail(new LabError('Se interrumpió la respuesta del motor.', 'disconnected', 503)));
      res.on('end', () => {
        if (settled) return;
        if (res.statusCode !== 200) return fail(new LabError('El motor local rechazó la consulta. Reintenta o elige Preparados.', 'engine_error', 503));
        try { const raw = Buffer.concat(parts); const data = JSON.parse(raw.toString('utf8')); settled = true; resolve({data, raw}); }
        catch { fail(new LabError('Respuesta inválida del motor. No se mostrarán esos datos.', 'invalid_response', 502)); }
      });
    });
    const timer = setTimeout(() => req.destroy(new LabError('La IA tardó demasiado. Reintenta o usa Preparados.', 'timeout', 504)), timeout);
    req.on('close', () => clearTimeout(timer));
    req.on('error', error => fail(error instanceof LabError ? error : new LabError('El motor se desconectó. Pulsa Reintentar motor o elige Preparados.', 'disconnected', 503)));
    req.end(rawBody);
  });
}
module.exports = {call};
