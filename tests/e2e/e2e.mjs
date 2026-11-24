// Prueba de extremo a extremo en Edge/Chrome headless (sin dependencias: CDP por WebSocket de Node 22).
// Uso: node tests/e2e/e2e.mjs [--shots=carpeta]   (por defecto no guarda capturas)
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const BROWSERS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
];
const browser = BROWSERS.find((p) => existsSync(p));
if (!browser) throw new Error('No hay Edge ni Chrome instalados.');
const shots = process.argv.find((a) => a.startsWith('--shots='))?.slice(8);
if (shots) mkdirSync(shots, { recursive: true });

const PORT = 8198;
const CDP = 9334;
const profile = mkdtempSync(join(tmpdir(), 'op-e2e-'));
const server = spawn(process.execPath, ['serve.mjs', String(PORT)], { stdio: 'ignore' });
const proc = spawn(browser, [`--remote-debugging-port=${CDP}`, `--user-data-dir=${profile}`, '--headless=new', '--no-first-run', '--disable-gpu', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cleanup = () => {
  proc.kill();
  server.kill();
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* en uso */ }
};
process.on('exit', cleanup);

async function connect() {
  for (let i = 0; i < 60; i++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${CDP}/json`)).json();
      const page = targets.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* aún arrancando */ }
    await sleep(250);
  }
  throw new Error('No se pudo conectar con el navegador.');
}

const ws = new WebSocket(await connect());
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const i = ++id;
  pending.set(i, (msg) => (msg.error ? reject(new Error(`${method}: ${msg.error.message}`)) : resolve(msg.result)));
  ws.send(JSON.stringify({ id: i, method, params }));
});
const evaluate = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
  return r.result.value;
};
const goto = async (url) => { await send('Page.navigate', { url }); await sleep(1200); };
const shot = async (name) => {
  if (!shots) return;
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(shots, `${name}.png`), Buffer.from(data, 'base64'));
};
const click = (sel) => evaluate(`document.querySelector(${JSON.stringify(sel)}).click()`);
const text = () => evaluate('document.body.innerText');
const coins = () => evaluate('window.__store().state.coins');

/** Responde la pregunta actual: bien (true) o mal (false). */
async function answerCurrent(correct) {
  const pos = await evaluate(`(() => { const q = window.__quiz(); const right = q.order.indexOf(q.q.correcta); return ${correct} ? right : (right + 1) % 4; })()`);
  await click(`[data-act=answer][data-p="${pos}"]`);
  await sleep(150);
}

try {
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  const base = `http://localhost:${PORT}/`;
  const errors = [];
  await send('Runtime.enable');
  ws.addEventListener('message', (m) => {
    const msg = JSON.parse(m.data);
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text);
  });

  // 1. Onboarding
  await goto(base);
  assert.match(await text(), /¿Cómo te llamas\?/);
  assert.equal(await evaluate('document.getElementById("start").disabled'), true, 'Empezar debe estar desactivado sin datos');
  await shot('01-onboarding');
  await evaluate(`(() => { const i = document.getElementById('name'); i.value = 'Ana'; i.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  assert.equal(await evaluate('document.getElementById("start").disabled'), true, 'falta elegir personaje');
  await click('[data-g=chica]');
  assert.equal(await evaluate('document.getElementById("start").disabled'), false);
  await evaluate(`document.getElementById('onboard').requestSubmit()`);
  await sleep(300);

  // 2. Casa vacía con diálogo; la pestaña Tienda se resalta
  let t = await text();
  assert.match(t, /Qué vacío está esto/);
  assert.equal(await evaluate('!!document.querySelector("svg.scene")'), true, 'falta la escena');
  assert.equal(await evaluate('document.querySelector("nav.tabs button.hint")?.innerText.trim()'), 'Tienda');
  await shot('02-casa-vacia');

  // 3. Tienda sin monedas: guion y resalte de Preguntas
  await click('nav.tabs [data-v=tienda]');
  await sleep(200);
  t = await text();
  assert.match(t, /¿Qué desea comprar\?/);
  assert.match(t, /Vaya, no tengo monedas/);
  assert.match(t, /Cactus/);
  assert.equal(await evaluate('document.querySelector("nav.tabs button.hint")?.innerText.trim()'), 'Preguntas');
  await shot('03-tienda');
  await click('[data-act=cat][data-c=accesorios]');
  assert.match(await text(), /Trofeo de estudio/);

  // 4. Preguntas: tres aciertos seguidos = 1 + 1 + (1+1) = 4 monedas
  await click('nav.tabs [data-v=preguntas]');
  assert.match(await text(), /Constitución Española/);
  await click('[data-act=quiz]');
  await sleep(400);
  assert.equal(await evaluate('!!document.querySelector("[data-testid=question]")'), true);
  await shot('04-pregunta');
  await answerCurrent(true);
  assert.equal(await coins(), 1);
  assert.match(await text(), /¡Correcto!/);
  await shot('05-acierto');
  await click('[data-act=next]');
  await answerCurrent(true);
  await click('[data-act=next]');
  await answerCurrent(true);
  assert.equal(await coins(), 4, 'bonus de racha 3');
  assert.match(await text(), /racha de 3/);
  await click('[data-act=next]');

  // 5. Fallo: se marca la correcta, no hay monedas y se corta la racha
  await answerCurrent(false);
  assert.equal(await coins(), 4);
  assert.equal(await evaluate('document.querySelectorAll(".opt.right").length'), 1);
  assert.equal(await evaluate('document.querySelectorAll(".opt.wrong").length'), 1);
  assert.equal(await evaluate('window.__store().state.streak.current'), 0);
  await shot('06-fallo');
  // no se puede contestar dos veces
  await evaluate(`document.querySelector('.opt:not(.right):not(.wrong)').click()`);
  assert.equal(await evaluate('window.__store().state.stats.answered'), 4);

  // 6. Persistencia tras recargar y casa ya con dialogo de monedas
  await goto(base);
  assert.equal(await coins(), 4);
  t = await text();
  assert.match(t, /Ana/);
  assert.match(t, /Tengo 4 monedas/);
  await shot('07-casa-con-monedas');

  // 7. Estadísticas y ajustes (tema oscuro)
  await click('nav.tabs [data-v=stats]');
  await sleep(150);
  t = await text();
  assert.match(t, /respondidas/);
  assert.match(t, /Dónde fallas más/);
  assert.match(t, /Preguntas más falladas/);
  await shot('08-estadisticas');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
  await click('nav.tabs [data-v=casa]');
  await sleep(150);
  await shot('09-casa-oscuro');

  // 8. Exportar y service worker
  const exported = JSON.parse(await evaluate('window.__store().exportJson()'));
  assert.equal(exported.app, 'oposiciones');
  assert.equal(exported.data.coins, 4);
  assert.equal(await evaluate(`navigator.serviceWorker.ready.then(r => !!r.active)`), true, 'el service worker no se activó');

  // 9. Una repetición espaciada básica: la pregunta fallada no sale en las 8 siguientes
  await click('nav.tabs [data-v=preguntas]');
  await click('[data-act=quiz]');
  await sleep(300);
  const failedId = await evaluate(`Object.entries(window.__store().state.progress).find(([, p]) => p.box === 0)[0]`);
  for (let i = 0; i < 7; i++) {
    assert.notEqual(await evaluate('window.__quiz().q.id'), failedId, 'la fallada volvió demasiado pronto');
    await answerCurrent(true);
    await click('[data-act=next]');
  }

  assert.deepEqual(errors, [], `errores de JS: ${errors.join(' | ')}`);
  console.log('E2E correcto');
} finally {
  cleanup();
}
process.exit(0);
