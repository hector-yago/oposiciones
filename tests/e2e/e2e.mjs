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

  // ===== Fase 2: tienda, mascotas, cuidados =====
  const tap = (sel) => evaluate(`document.querySelector(${JSON.stringify(sel)}).dispatchEvent(new MouseEvent('click', { bubbles: true }))`);
  const st = (expr) => evaluate(`(() => { const s = window.__store().state; return ${expr}; })()`);
  const buyPet = async (id, name) => {
    await click('nav.tabs [data-v=tienda]');
    await click('[data-act=cat][data-c=vivos]');
    await click(`[data-testid=item-${id}] [data-act=buy]`);
    assert.equal(await evaluate('!!document.querySelector("#nameform")'), true, `no pide nombre para ${id}`);
    await evaluate(`(() => { document.getElementById('pname').value = ${JSON.stringify(name)}; document.getElementById('nameform').requestSubmit(); })()`);
    await sleep(300);
  };
  const buyThing = async (cat, id) => {
    await click('nav.tabs [data-v=tienda]');
    await click(`[data-act=cat][data-c=${cat}]`);
    await click(`[data-testid=item-${id}] [data-act=buy]`);
    await sleep(150);
  };

  await evaluate('window.__store().update((d) => { d.coins = 300; })');
  await buyPet('cactus', 'Pin');
  assert.match(await text(), /¡Hola, Pin!/);
  assert.equal(await coins(), 299);
  assert.equal(await evaluate('document.querySelectorAll("g.pet").length'), 1);
  await buyThing('herramientas', 'regadera');
  assert.equal(await st('s.inventory.some((i) => i.itemId === "regadera")'), true);
  assert.equal(await evaluate('document.querySelector("[data-testid=item-regadera] button").disabled'), true, 'no se puede comprar dos veces');
  await buyPet('gato', 'Michi');
  await buyThing('herramientas', 'pecera');
  await buyPet('pez', 'Nemo');
  await buyThing('herramientas', 'cuenco-agua');
  await buyThing('accesorios', 'sofa');
  await buyThing('accesorios', 'tele');
  await buyThing('accesorios', 'alfombra');
  await click('nav.tabs [data-v=casa]');
  assert.equal(await evaluate('document.querySelectorAll("g.pet").length'), 3);
  assert.equal(await evaluate('document.querySelectorAll("[data-testid=pet-row]").length'), 3);
  await shot('10-casa-con-mascotas');
  // comprar sin monedas: botón desactivado
  await evaluate('window.__store().update((d) => { d.coins = 0; })');
  await click('nav.tabs [data-v=tienda]');
  await click('[data-act=cat][data-c=vivos]');
  assert.equal(await evaluate('document.querySelector("[data-testid=item-perro] button").disabled'), true);
  await shot('11-tienda-con-compras');

  // ===== Fase 3: castigos (3 fallos seguidos) =====
  await click('nav.tabs [data-v=preguntas]');
  await click('[data-act=quiz]');
  await sleep(300);
  await answerCurrent(false);
  await click('[data-act=next]');
  await answerCurrent(false);
  assert.match(await text(), /Un fallo más y tus mascotas se enfadarán/);
  await click('[data-act=next]');
  await answerCurrent(false);
  assert.equal(await evaluate('!!document.querySelector("[data-testid=mischief]")'), true, 'falta el aviso de castigo');
  assert.equal(await st('s.inventory.filter((i) => i.mood === "angry").length'), 3);
  await shot('12-castigo');
  await click('nav.tabs [data-v=casa]');
  assert.equal(await evaluate('document.querySelectorAll("g.pet.angry").length'), 3);
  assert.equal(await evaluate('document.querySelectorAll("[data-poop]").length'), 2, 'gato y pez ensucian; el cactus no');
  assert.equal(await evaluate('document.querySelector("nav.tabs button.dot, nav.tabs button[aria-current]") !== null'), true);
  await shot('13-mascotas-enfadadas');
  // el personaje limpia y calma
  await tap('[data-poop]');
  await sleep(150);
  await tap('[data-poop]');
  await sleep(150);
  assert.equal(await evaluate('document.querySelectorAll("[data-poop]").length'), 0);
  assert.equal(await st('s.stats.care.cleaned'), 2);
  for (const uid of await st('s.inventory.filter((i) => ["cactus","gato","pez"].includes(i.itemId)).map((i) => i.uid)')) {
    await tap(`g.pet[data-pet="${uid}"]`);
    await sleep(120);
  }
  assert.equal(await st('s.inventory.filter((i) => i.mood === "angry").length'), 0);
  assert.equal(await st('s.stats.care.calmed'), 3);
  assert.equal(await evaluate('document.querySelectorAll("g.pet.angry").length'), 0);

  // ===== Mascota feliz → moneda =====
  await evaluate(`window.__store().update((d) => { d.inventory.find((i) => i.itemId === 'cactus').joy = 11; })`);
  await click('nav.tabs [data-v=preguntas]');
  await click('[data-act=quiz]');
  await sleep(300);
  await answerCurrent(true);
  assert.equal(await st('s.inventory.find((i) => i.itemId === "cactus").coin'), true, 'el cactus debería haber encontrado una moneda');
  assert.match(await text(), /ha encontrado una moneda/);
  const before = await coins();
  await click('nav.tabs [data-v=casa]');
  assert.equal(await evaluate('document.querySelectorAll("[data-petcoin]").length'), 1);
  await shot('14-moneda-de-mascota');
  await tap('[data-petcoin]');
  await sleep(200);
  assert.ok((await coins()) > before, 'no se cobró la moneda de la mascota');
  assert.equal(await evaluate('document.querySelectorAll("[data-petcoin]").length'), 0);
  assert.equal(await st('s.stats.care.coins'), 1);

  // ===== Comodín 50 % =====
  await click('nav.tabs [data-v=preguntas]');
  await click('[data-act=quiz]');
  await sleep(300);
  assert.equal(await evaluate('document.querySelector("[data-act=joker]").disabled'), false);
  await click('[data-act=joker]');
  await sleep(150);
  assert.equal(await evaluate('document.querySelectorAll(".opt.gone").length'), 2);
  assert.equal(await evaluate('document.querySelector("[data-act=joker]").disabled'), true);
  assert.match(await evaluate('document.querySelector("[data-act=joker]").textContent'), /Comodín en/);
  assert.equal(await st('s.joker.uses'), 1);
  await shot('15-comodin');
  await answerCurrent(true); // la correcta nunca se oculta

  // ===== Entrada diaria y caja misteriosa =====
  await evaluate(`window.__store().update((d) => {
    const y = new Date(); y.setDate(y.getDate() - 1);
    const k = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0');
    d.daily = { last: k, streak: 6, boxes: 0, opened: 0 };
  })`);
  const c0 = await coins();
  await evaluate('window.__daily()');
  await sleep(300);
  assert.equal(await coins(), c0 + 1, 'bonus diario');
  assert.equal(await st('s.daily.boxes'), 1);
  assert.equal(await st('s.daily.streak'), 7);
  await click('nav.tabs [data-v=casa]');
  await shot('16-caja-misteriosa');
  await click('[data-testid=open-box]');
  await sleep(200);
  assert.equal(await evaluate('!!document.querySelector("[data-testid=reveal]")'), true);
  await shot('17-caja-abierta');
  await click('[data-act=sheet-close-render]');
  assert.equal(await st('s.inventory.filter((i) => ["guirnalda","bandera","mapa","globos","libro-ce"].includes(i.itemId)).length'), 1);
  assert.equal(await st('s.daily.boxes'), 0);
  await evaluate('window.__daily()');
  assert.equal(await coins(), c0 + 1, 'solo un bonus por día');

  // ===== Logros y estadísticas finales =====
  await click('nav.tabs [data-v=logros]');
  t = await text();
  assert.match(t, /\d+ de \d+ logros/);
  assert.equal(await evaluate('document.querySelector("[data-testid=ach-first_pet]").classList.contains("got")'), true);
  assert.equal(await evaluate('document.querySelector("[data-testid=ach-has_perro]").classList.contains("locked")'), true);
  assert.equal(await evaluate('document.querySelector("[data-testid=ach-clean_1]").classList.contains("got")'), true);
  assert.equal(await evaluate('document.querySelector("[data-testid=ach-joker_first]").classList.contains("got")'), true);
  await shot('18-logros');
  await click('nav.tabs [data-v=stats]');
  assert.match(await text(), /Últimos 7 días/);
  assert.equal(await evaluate('document.querySelectorAll("[data-testid=week] .day").length'), 7);
  assert.equal(await evaluate('document.querySelectorAll("[data-testid=art-row]").length > 0'), true);
  await shot('19-estadisticas-final');
  await click('nav.tabs [data-v=casa]');
  await shot('20-casa-final-oscuro');

  // ===== Más tienda, modo noche y lámparas (la hora se fuerza con ?hora= solo en localhost) =====
  await evaluate('window.__store().update((d) => { d.coins = 800; })');
  await buyThing('accesorios', 'lampara');
  await buyThing('accesorios', 'lampara-pie');
  await buyThing('accesorios', 'pizarra');
  await buyThing('accesorios', 'monstera');
  await buyPet('margarita', 'Daisy');
  await buyPet('hamster', 'Bolita');
  await buyThing('herramientas', 'rueda');
  await buyPet('tortuga', 'Lenta');
  await buyThing('herramientas', 'terrario');
  await buyPet('conejo', 'Saltarín');
  await buyThing('herramientas', 'conejera');
  await buyPet('loro', 'Paco');
  await buyThing('herramientas', 'percha');
  await buyPet('bonsai', 'Zen');
  assert.equal(await st('["margarita","hamster","tortuga","conejo","loro","bonsai"].every((sp) => s.inventory.some((i) => i.itemId === sp))'), true, 'especies nuevas compradas');

  await goto(`${base}?hora=12`);
  assert.equal(await evaluate('document.querySelector("svg.scene").classList.contains("day")'), true, 'a las 12 es de día');
  assert.equal(await evaluate('document.querySelectorAll(".star").length'), 0);
  await shot('21-dia-con-mas-cosas');

  await goto(`${base}?hora=22`);
  assert.equal(await evaluate('document.querySelector("svg.scene").classList.contains("night")'), true, 'a las 22 es de noche');
  assert.ok((await evaluate('document.querySelectorAll(".star").length')) >= 8, 'faltan estrellas');
  assert.equal(await evaluate('document.querySelectorAll("svg.scene .glow").length'), 2, 'dos lámparas encendidas');
  await shot('22-noche-lamparas-encendidas');
  await tap('g.lamp[data-lamp]');
  await sleep(150);
  assert.equal(await st('s.flags.lampOff'), true);
  assert.equal(await evaluate('document.querySelectorAll("svg.scene .glow").length'), 0, 'lámparas apagadas');
  await shot('23-noche-lamparas-apagadas');
  await tap('g.lamp[data-lamp]');
  await sleep(150);
  assert.equal(await evaluate('document.querySelectorAll("svg.scene .glow").length'), 2);

  await goto(`${base}?hora=5`);
  assert.equal(await evaluate('document.querySelector("svg.scene").classList.contains("night")'), true, 'a las 5 aún es de noche');
  await goto(`${base}?hora=6`);
  assert.equal(await evaluate('document.querySelector("svg.scene").classList.contains("day")'), true, 'a las 6 ya es de día');
  await goto(`${base}?hora=18`);
  assert.equal(await evaluate('document.querySelector("svg.scene").classList.contains("night")'), true, 'a las 18 ya es de noche');

  // Ajuste manual: forzar día aunque sea de noche
  await click('nav.tabs [data-v=casa]');
  await evaluate('document.querySelector("[data-act=go][data-v=ajustes]").click()');
  await click('[data-act=scene][data-v=day]');
  await click('nav.tabs [data-v=casa]');
  assert.equal(await evaluate('document.querySelector("svg.scene").classList.contains("day")'), true, 'forzado a día');
  await evaluate('document.querySelector("[data-act=go][data-v=ajustes]").click()');
  await click('[data-act=scene][data-v=auto]');
  await click('nav.tabs [data-v=casa]');
  assert.equal(await evaluate('document.querySelector("svg.scene").classList.contains("night")'), true, 'automático a las 18 = noche');

  // Tienda ampliada
  await click('nav.tabs [data-v=tienda]');
  await click('[data-act=cat][data-c=vivos]');
  assert.ok((await evaluate('document.querySelectorAll("li.item").length')) >= 11);
  await click('[data-act=cat][data-c=herramientas]');
  assert.ok((await evaluate('document.querySelectorAll("li.item").length')) >= 14);
  await click('[data-act=cat][data-c=accesorios]');
  assert.ok((await evaluate('document.querySelectorAll("li.item").length')) >= 17);
  await shot('24-tienda-accesorios');
  await click('nav.tabs [data-v=casa]');
  await shot('25-casa-noche-completa');

  // Datos íntegros al recargar
  await goto(base);
  assert.equal(await st('s.inventory.filter((i) => ["cactus","gato","pez"].includes(i.itemId)).length'), 3);
  assert.equal(await st('s.schemaVersion'), 2);
  assert.equal(await st('s.settings.sceneMode'), 'auto');

  assert.deepEqual(errors, [], `errores de JS: ${errors.join(' | ')}`);
  console.log('E2E correcto');
} finally {
  cleanup();
}
process.exit(0);
