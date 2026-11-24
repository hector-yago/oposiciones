// Interfaz de la PWA. Estado de pantalla en memoria; datos del usuario en el almacén (js/store.js).
import { VERSION } from './version.js';
import { createStore, indexedDbAdapter, memoryAdapter } from './store.js';
import { applyAnswer } from './economy.js';
import { pickNext, statusOf } from './scheduler.js';
import { CATALOG, CATEGORIES } from './catalog.js';
import { sceneSvg } from './art/scene.js';

const $app = document.getElementById('app');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

let store;
let temas = [];
const banks = {};
let view = 'casa';
let shopCat = 'vivos';
let shopFirst = false;
let quiz = null;
let toastTimer = null;

const ICONS = {
  casa: '<path d="M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6"/>',
  tienda: '<path d="M5 8h14l-1 12H6L5 8zM9 8V6a3 3 0 016 0v2"/>',
  preguntas: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1.2-1.5 2.3M12 17.2v.1"/>',
  logros: '<path d="M7 4h10v5a5 5 0 01-10 0V4zM7 6H4v1a3 3 0 003 3M17 6h3v1a3 3 0 01-3 3M12 14v4M8 21h8"/>',
  stats: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
};
const icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;
const coinIcon = () =>
  '<svg class="coin" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#f5b301"/><circle cx="12" cy="12" r="7.2" fill="none" stroke="#c78a00" stroke-width="1.6"/><path d="M12 7.5v9M9.6 10c0-1.2 1-1.9 2.4-1.9s2.4.7 2.4 1.9-1 1.6-2.4 1.9-2.4.7-2.4 1.9 1 1.9 2.4 1.9 2.4-.7 2.4-1.9" fill="none" stroke="#c78a00" stroke-width="1.5" stroke-linecap="round"/></svg>';

const doc = () => store.state;
const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* ---------- Arranque ---------- */
async function boot() {
  let adapter = memoryAdapter();
  let persistent = false;
  try {
    const idb = indexedDbAdapter();
    await idb.keys();
    adapter = idb;
    persistent = true;
  } catch {
    /* sin IndexedDB: se juega igualmente, pero sin guardar */
  }
  store = createStore(adapter);
  try {
    await store.load();
  } catch (e) {
    $app.innerHTML = `<main class="fatal"><h1>No se pueden abrir los datos</h1><p>${esc(e.message)}</p></main>`;
    return;
  }
  try {
    temas = await (await fetch('data/temas.json')).json();
  } catch {
    temas = [];
  }
  await Promise.all(
    temas.map(async (t) => {
      try {
        banks[t.id] = await (await fetch(t.archivo)).json();
      } catch {
        /* se reintenta al empezar el test */
      }
    }),
  );
  applyTheme();
  render();
  // Ganchos de prueba (e2e): solo en localhost.
  if (location.hostname === 'localhost') {
    window.__store = () => store;
    window.__quiz = () => quiz;
  }
  if (!persistent) toast('Tu navegador no permite guardar datos: el progreso se perderá al cerrar.');
  store.autoBackup().catch(() => {});
  navigator.storage?.persist?.().catch(() => {});
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
}

function applyTheme() {
  const t = doc().settings.theme;
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
  try {
    t === 'system' ? localStorage.removeItem('op-theme') : localStorage.setItem('op-theme', t);
  } catch {
    /* sin localStorage */
  }
}

function toast(msg) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = msg;
  document.body.append(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 4000);
}

/* ---------- Navegación ---------- */
async function go(v) {
  if (v === 'tienda') {
    shopFirst = !doc().flags.shopSeen;
    if (!doc().flags.introSeen || !doc().flags.shopSeen) {
      await store.update((d) => {
        d.flags.introSeen = true;
        d.flags.shopSeen = true;
      });
    }
  }
  if (v !== 'quiz') quiz = quiz && v === 'preguntas' ? null : quiz;
  view = v;
  render();
  window.scrollTo(0, 0);
}

/** Pestaña que se resalta para guiar los primeros pasos. */
function hintTab() {
  const d = doc();
  if (!d.flags.introSeen) return 'tienda';
  if (d.stats.answered === 0) return 'preguntas';
  return null;
}

/* ---------- Pantallas ---------- */
function render() {
  const d = doc();
  if (!d.profile) return renderOnboarding();
  const titles = { casa: 'Mi casa', tienda: 'Tienda', preguntas: 'Preguntas', quiz: quiz ? quiz.tema.nombre : 'Preguntas', logros: 'Logros', stats: 'Estadísticas', ajustes: 'Ajustes' };
  const body = { casa: viewCasa, tienda: viewTienda, preguntas: viewPreguntas, quiz: viewQuiz, logros: viewLogros, stats: viewStats, ajustes: viewAjustes }[view]();
  const active = view === 'quiz' ? 'preguntas' : view;
  const hint = hintTab();
  const tab = (id, label) => `<button data-act="go" data-v="${id}" ${active === id ? 'aria-current="page"' : ''} class="${hint === id && active !== id ? 'hint' : ''}">${icon(id)}<span>${label}</span></button>`;
  $app.innerHTML = `
    <header class="top">
      <div class="titles"><h1>${titles[view]}</h1><div class="sub">${esc(d.profile.name)}</div></div>
      <span class="coins" aria-label="${plural(d.coins, 'moneda', 'monedas')}" data-testid="coins">${coinIcon()}<b>${d.coins}</b></span>
      <button class="icon-btn" data-act="go" data-v="ajustes" aria-label="Ajustes">${icon('gear')}</button>
    </header>
    <main>${body}</main>
    <nav class="tabs"><div class="inner">${tab('casa', 'Casa')}${tab('tienda', 'Tienda')}${tab('preguntas', 'Preguntas')}${tab('logros', 'Logros')}${tab('stats', 'Estadísticas')}</div></nav>`;
}

function renderOnboarding() {
  $app.innerHTML = `
    <main class="onboard">
      <img src="icons/icon.svg" alt="" width="84" height="84" />
      <h1>¡Bienvenido a Oposiciones!</h1>
      <p class="muted">Estudia jugando: responde preguntas, gana monedas y monta tu casa.</p>
      <form id="onboard" class="card" autocomplete="off">
        <div class="field"><label for="name">¿Cómo te llamas?</label><input id="name" type="text" maxlength="30" placeholder="Tu nombre" required /></div>
        <div class="field"><span class="lbl">Tu personaje</span>
          <div class="seg" role="group" aria-label="Personaje">
            <button type="button" data-act="gender" data-g="chico" aria-pressed="false">Chico</button>
            <button type="button" data-act="gender" data-g="chica" aria-pressed="false">Chica</button>
          </div></div>
        <button class="btn primary block" id="start" disabled>Empezar</button>
      </form>
    </main>`;
}

function bubble(text, who = true) {
  return `<div class="bubble ${who ? '' : 'plain'}" data-testid="bubble"><p>${esc(text)}</p></div>`;
}

function viewCasa() {
  const d = doc();
  let text;
  if (!d.flags.introSeen) text = '¡Qué vacío está esto! Voy a ir de compras…';
  else if (d.stats.answered === 0) text = 'Sigo sin nada en casa… ¡Necesito monedas!';
  else if (d.coins === 0) text = 'Ya no me quedan monedas. ¡Otra ronda de preguntas!';
  else text = `Tengo ${plural(d.coins, 'moneda', 'monedas')}. ¡Cada acierto cuenta!`;
  const guide = hintTab() === 'tienda' ? 'Toca «Tienda» en el menú de abajo.' : hintTab() === 'preguntas' ? 'Toca «Preguntas» para ganar tus primeras monedas.' : '';
  return `${bubble(text)}<div class="scene-wrap">${sceneSvg({ gender: d.profile.gender })}</div>${guide ? `<p class="guide">${guide}</p>` : ''}`;
}

function viewTienda() {
  const d = doc();
  const items = CATALOG.filter((i) => i.cat === shopCat)
    .map(
      (i) => `<li class="row item">
        <span class="emoji" aria-hidden="true">${i.icon}</span>
        <span class="body"><span class="title">${esc(i.name)}</span><span class="meta">${esc(i.desc)}</span></span>
        <span class="price">${coinIcon()}<b>${i.price}</b></span>
        <button class="btn small" disabled title="La compra llega en la siguiente fase">Pronto</button>
      </li>`,
    )
    .join('');
  const msg = shopFirst && d.coins === 0 ? 'Vaya, no tengo monedas… Tal vez si respondo algunas preguntas bien…' : d.coins === 0 ? 'Sin monedas no puedo comprar nada. ¡A responder preguntas!' : `Tengo ${plural(d.coins, 'moneda', 'monedas')}. Muy pronto podré comprar aquí.`;
  return `
    <section class="card shop-head"><h2>¿Qué desea comprar?</h2><p class="muted">Tienes <b>${plural(d.coins, 'moneda', 'monedas')}</b>.</p></section>
    <div class="seg full" role="group" aria-label="Categoría">${CATEGORIES.map((c) => `<button data-act="cat" data-c="${c.id}" aria-pressed="${shopCat === c.id}">${c.name}</button>`).join('')}</div>
    <ul class="list shop-list">${items}</ul>
    ${bubble(msg)}`;
}

function viewPreguntas() {
  const d = doc();
  const cards = temas
    .map((t) => {
      const bank = banks[t.id];
      const total = bank?.length;
      const mastered = bank ? bank.filter((q) => statusOf(d.progress[q.id]) === 'mastered').length : 0;
      const seen = bank ? bank.filter((q) => statusOf(d.progress[q.id]) !== 'new').length : 0;
      const info = bank ? `${seen} de ${total} vistas · ${mastered} dominadas` : 'Pulsa para empezar';
      return `<button class="card topic" data-act="quiz" data-t="${t.id}"><span class="t-name">${esc(t.nombre)}</span><span class="muted">${esc(t.descripcion)}</span><span class="t-info">${info}</span></button>`;
    })
    .join('');
  return `<p class="muted lead">Elige un tema. Cada acierto te da una moneda; con 3 seguidas ganas 1 extra y con 10 seguidas, 2 extra.</p>${cards || '<p class="empty"><b>Sin temas</b>No se han podido cargar los temas.</p>'}`;
}

async function startQuiz(id) {
  const tema = temas.find((t) => t.id === id);
  if (!tema) return;
  try {
    banks[id] ??= await (await fetch(tema.archivo)).json();
  } catch {
    toast('No se han podido cargar las preguntas. Comprueba la conexión.');
    return;
  }
  quiz = { tema, bank: banks[id], recent: [], session: { ok: 0, total: 0 }, q: null, order: [], picked: null, result: null };
  nextQuestion();
  view = 'quiz';
  render();
  window.scrollTo(0, 0);
}

function nextQuestion() {
  const q = pickNext(quiz.bank, doc().progress, { now: Date.now(), seq: doc().stats.answered, recent: quiz.recent });
  quiz.q = q;
  quiz.order = shuffle([0, 1, 2, 3]);
  quiz.picked = null;
  quiz.result = null;
  quiz.recent.push(q.id);
}

function viewQuiz() {
  if (!quiz) return viewPreguntas();
  const { q, order, picked, result } = quiz;
  const d = doc();
  const opts = order
    .map((orig, pos) => {
      let cls = 'opt';
      if (picked !== null) {
        if (orig === q.correcta) cls += ' right';
        else if (orig === picked) cls += ' wrong';
        else cls += ' dim';
      }
      return `<button class="${cls}" data-act="answer" data-p="${pos}" ${picked !== null ? 'disabled' : ''}><span class="letter">${'ABCD'[pos]}</span><span>${esc(q.opciones[orig])}</span></button>`;
    })
    .join('');
  let feedback = '';
  if (result) {
    const coins = result.correct
      ? `<b class="gain" data-testid="gain">+${result.coins}</b> ${result.coins === 1 ? 'moneda' : 'monedas'}${result.bonus ? ` · ¡racha de ${result.streak}!` : ''}`
      : '';
    feedback = `<div class="feedback ${result.correct ? 'ok' : 'ko'}" role="status"><p class="verdict">${result.correct ? '¡Correcto!' : 'Incorrecta'} ${coins}</p><p>${esc(q.explicacion)}</p><button class="btn primary block" data-act="next">Siguiente</button></div>`;
  }
  return `
    <div class="quiz-bar"><button class="btn small" data-act="go" data-v="preguntas">Salir</button>
      <span class="chip-stat" data-testid="streak">Racha <b>${d.streak.current}</b></span>
      <span class="chip-stat">Sesión <b>${quiz.session.ok}/${quiz.session.total}</b></span></div>
    <article class="card question"><p class="ref">${esc(q.titulo)} · Art. ${esc(q.articulo)}</p><h2 data-testid="question">${esc(q.enunciado)}</h2><div class="opts">${opts}</div></article>
    ${feedback}`;
}

async function answer(pos) {
  if (!quiz || quiz.picked !== null) return;
  const orig = quiz.order[pos];
  const correct = orig === quiz.q.correcta;
  quiz.picked = orig;
  quiz.result = await store.update((dd) => applyAnswer(dd, quiz.q, correct, Date.now()));
  quiz.session.total += 1;
  if (correct) quiz.session.ok += 1;
  render();
  document.querySelector('.feedback')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function viewLogros() {
  return '<p class="empty"><b>Logros</b>Aquí aparecerán tus logros: tu primera mascota, tu primera racha de 10, decorar tu casa… Llegan en una próxima versión.</p>';
}

function viewStats() {
  const d = doc();
  const s = d.stats;
  if (!s.answered) return '<p class="empty"><b>Aún no hay estadísticas</b>Responde algunas preguntas y verás aquí en qué fallas más.</p>';
  const pct = Math.round((s.correct / s.answered) * 100);
  const counts = { new: 0, failed: 0, learning: 0, mastered: 0 };
  const total = Object.values(banks).reduce((n, b) => n + b.length, 0);
  for (const p of Object.values(d.progress)) counts[statusOf(p)]++;
  counts.new = Math.max(0, total - Object.keys(d.progress).length);
  const titles = Object.entries(s.byTitle)
    .map(([t, v]) => ({ t, n: v.ok + v.ko, pct: Math.round((v.ok / (v.ok + v.ko)) * 100) }))
    .filter((x) => x.n > 0)
    .sort((a, b) => a.pct - b.pct);
  const byId = Object.fromEntries(Object.values(banks).flat().map((q) => [q.id, q]));
  const worst = Object.entries(d.progress)
    .filter(([id, p]) => p.ko > 0 && byId[id])
    .sort((a, b) => b[1].ko - a[1].ko)
    .slice(0, 5);
  return `
    <section class="card"><h3>Resumen</h3>
      <div class="kpis"><div><b>${s.answered}</b><span>respondidas</span></div><div><b>${pct}%</b><span>aciertos</span></div><div><b>${d.streak.best}</b><span>mejor racha</span></div></div></section>
    <section class="card"><h3>Dónde fallas más</h3>
      ${titles.map((x) => `<div class="bar-row"><span>${esc(x.t)} <small>(${x.n})</small></span><span class="bar"><i style="width:${x.pct}%"></i></span><b>${x.pct}%</b></div>`).join('')}
      <p class="muted">Ordenado de menos a más aciertos.</p></section>
    ${worst.length ? `<section class="card"><h3>Preguntas más falladas</h3>${worst.map(([id, p]) => `<div class="line"><span><small>${esc(byId[id].titulo)} · Art. ${esc(byId[id].articulo)}</small><br>${esc(byId[id].enunciado)}</span><b>${p.ko}×</b></div>`).join('')}</section>` : ''}
    <section class="card"><h3>Tu avance</h3><div class="kpis four">
      <div><b>${counts.new}</b><span>nuevas</span></div><div><b>${counts.failed}</b><span>falladas</span></div><div><b>${counts.learning}</b><span>aprendiendo</span></div><div><b>${counts.mastered}</b><span>dominadas</span></div></div></section>`;
}

function viewAjustes() {
  const d = doc();
  const th = d.settings.theme;
  return `
    <section class="card"><h3>Aspecto</h3><div class="seg" role="group" aria-label="Tema">
      ${[['system', 'Sistema'], ['light', 'Claro'], ['dark', 'Oscuro']].map(([v, l]) => `<button data-act="theme" data-v="${v}" aria-pressed="${th === v}">${l}</button>`).join('')}</div></section>
    <section class="card"><h3>Copia de seguridad</h3><p>Tus datos solo viven en este dispositivo. Guarda una copia de vez en cuando.</p>
      <div class="actions"><button class="btn" data-act="export">Exportar</button><label class="btn file">Importar<input type="file" accept="application/json,.json" data-act="import" hidden /></label></div></section>
    <section class="card"><h3>Reiniciar</h3><p>Borra monedas, progreso y perfil de este dispositivo. Se guarda antes una copia automática.</p>
      <button class="btn danger" data-act="reset">Empezar de cero</button></section>
    <p class="muted center">Oposiciones v${VERSION}</p>`;
}

/* ---------- Eventos ---------- */
document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.tagName === 'INPUT') return;
  const act = el.dataset.act;
  try {
    if (act === 'go') await go(el.dataset.v);
    else if (act === 'cat') {
      shopCat = el.dataset.c;
      render();
    } else if (act === 'quiz') await startQuiz(el.dataset.t);
    else if (act === 'answer') await answer(Number(el.dataset.p));
    else if (act === 'next') {
      nextQuestion();
      render();
      window.scrollTo(0, 0);
    } else if (act === 'theme') {
      await store.update((d) => {
        d.settings.theme = el.dataset.v;
      });
      applyTheme();
      render();
    } else if (act === 'gender') {
      document.querySelectorAll('[data-act="gender"]').forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
      validateOnboarding();
    } else if (act === 'export') exportData();
    else if (act === 'reset') await resetAll();
  } catch (err) {
    toast(`Algo ha fallado: ${err.message}`);
  }
});

document.addEventListener('input', (e) => {
  if (e.target.id === 'name') validateOnboarding();
});

document.addEventListener('change', async (e) => {
  if (e.target.dataset?.act !== 'import') return;
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    await store.importJson(await file.text());
    applyTheme();
    view = 'casa';
    render();
    toast('Copia importada.');
  } catch (err) {
    toast(err.message);
  }
});

document.addEventListener('submit', async (e) => {
  if (e.target.id !== 'onboard') return;
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const gender = document.querySelector('[data-act="gender"][aria-pressed="true"]')?.dataset.g;
  if (!name || !gender) return;
  await store.update((d) => {
    d.profile = { name, gender };
  });
  view = 'casa';
  render();
});

function validateOnboarding() {
  const ok = document.getElementById('name').value.trim() && document.querySelector('[data-act="gender"][aria-pressed="true"]');
  document.getElementById('start').disabled = !ok;
}

function exportData() {
  const blob = new Blob([store.exportJson()], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `oposiciones-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function resetAll() {
  if (!confirm('¿Seguro? Se borrarán tus monedas, tu progreso y tu perfil en este dispositivo.')) return;
  await store.resetAll();
  quiz = null;
  view = 'casa';
  render();
}

boot();
