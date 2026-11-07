'use strict';
let timer;
const status = document.getElementById('startup-status'), retry = document.getElementById('startup-retry');
async function poll() {
  try {
    const data = await (await fetch('/api/status')).json(); status.textContent = data.message;
    retry.hidden = data.phase !== 'failed';
    document.getElementById('startup-progress').classList.toggle('stopped', data.phase === 'failed');
    if (data.connected) { location.replace('/'); return; }
  } catch { status.textContent = 'No se pudo preparar el laboratorio. Puedes abrir el respaldo o cerrar y volver a intentar.'; retry.hidden = false; }
  timer = setTimeout(poll, 500);
}
retry.addEventListener('click', async () => { retry.hidden = true; status.textContent = 'Reintentando…'; await fetch('/api/retry', {method: 'POST'}); });
document.getElementById('startup-prepared').addEventListener('click', () => { clearTimeout(timer); location.replace('/?source=prepared'); });
void poll();
