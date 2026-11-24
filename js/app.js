// Interfaz de la PWA. Estado de pantalla en memoria; datos del usuario en el almacén (js/store.js).
import { VERSION } from './version.js';
import { createStore, indexedDbAdapter, memoryAdapter } from './store.js';
import { applyAnswer } from './economy.js';
import { pickNext, statusOf } from './scheduler.js';
import { BY_ID, CATALOG, CATEGORIES, LAMPS, SPECIES, STAGE_NAMES, isPet, isPlant } from './catalog.js';
import { BOOST_EXTRA, BOOST_MAIN, JOY_TARGET, MOOD_TEXT, attention, boostFor, buy, calmPet, canBuy, cleanMess, coinValue, collectCoin, countOf, growthInfo, isUpset, missingTool, ownedIds, petsOf, renamePet, stageOf } from './shop.js';
import { WEEK, claimDaily, dayOfWeek, openBox } from './daily.js';
import { WRONG_LIMIT } from './economy.js';
import { COOLDOWN_MS, formatRemaining, isAvailable, pickHidden, remainingMs, useJoker } from './joker.js';
import { ACHIEVEMENTS, newlyUnlocked, progressOf, unlock } from './achievements.js';
import { byArticle, lastDays } from './stats.js';
import { isNightHour, sceneSvg } from './art/scene.js';
import { petThumb } from './art/pets.js';
import { itemThumb } from './art/items.js';

const $app = document.getElementById('app');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

let store;
let temas = [];
const banks = {};
let view = 'casa';
let shopCat = 'vivos';
let shopFirst = false;
let quiz = null;
let toastTimer = null;
let hopUid = null;
let houseMsg = null; // frase puntual del personaje (compra, caricias…)
let jokerTimer = null;
let nightTimer = null;
let lastNight = false;

/** Hora local (en localhost se puede forzar con ?hora=22 para probar). */
function currentHour() {
  if (location.hostname === 'localhost') {
    const h = new URLSearchParams(location.search).get('hora');
    if (h !== null && /^\d{1,2}$/.test(h)) return Number(h) % 24;
  }
  return new Date().getHours();
}

/** Escena de noche: automático (18:00-06:00) o forzado desde Ajustes. */
function isNight() {
  const mode = doc().settings.sceneMode;
  return mode === 'night' ? true : mode === 'day' ? false : isNightHour(currentHour());
}

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
const allQuestions = () => Object.values(banks).flat();
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
  await checkDaily();
  // Ganchos de prueba (e2e): solo en localhost.
  if (location.hostname === 'localhost') {
    window.__store = () => store;
    window.__quiz = () => quiz;
    window.__daily = () => checkDaily();
  }
  if (!persistent) toast('Tu navegador no permite guardar datos: el progreso se perderá al cerrar.');
  store.autoBackup().catch(() => {});
  navigator.storage?.persist?.().catch(() => {});
  afterChange().catch(() => {});
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

function toast(msg, ms = 4000) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = msg;
  document.body.append(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), ms);
}

/** Tras cualquier cambio: registra logros nuevos y avisa. Devuelve los nombres. */
async function afterChange() {
  if (!doc().profile) return [];
  const ids = newlyUnlocked({ doc: doc(), questions: allQuestions(), now: Date.now() });
  if (!ids.length) return [];
  await store.update((d) => unlock(d, ids, Date.now()));
  const names = ids.map((id) => ACHIEVEMENTS.find((a) => a.id === id).name);
  toast(names.length === 1 ? `Logro desbloqueado: ${names[0]}` : `${names.length} logros desbloqueados: ${names.join(', ')}`, 5000);
  return names;
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
  if (v === 'preguntas') quiz = null;
  if (v !== 'casa') houseMsg = null;
  view = v;
  render();
  window.scrollTo(0, 0);
}

/** Pestaña que se resalta para guiar los primeros pasos. */
function hintTab() {
  const d = doc();
  if (!d.flags.introSeen) return 'tienda';
  if (d.stats.answered === 0) return 'preguntas';
  if (!d.inventory.length && d.coins >= 1) return 'tienda';
  return null;
}

/* ---------- Pantallas ---------- */
function render() {
  clearInterval(jokerTimer);
  clearInterval(nightTimer);
  if (view === 'casa') {
    lastNight = isNight();
    nightTimer = setInterval(() => {
      if (isNight() !== lastNight && !document.querySelector('.overlay')) render();
    }, 30000);
  }
  const d = doc();
  if (!d.profile) return renderOnboarding();
  const titles = { casa: 'Mi casa', tienda: 'Tienda', preguntas: 'Preguntas', quiz: quiz ? quiz.tema.nombre : 'Preguntas', logros: 'Logros', stats: 'Estadísticas', ajustes: 'Ajustes' };
  const body = { casa: viewCasa, tienda: viewTienda, preguntas: viewPreguntas, quiz: viewQuiz, logros: viewLogros, stats: viewStats, ajustes: viewAjustes }[view]();
  const active = view === 'quiz' ? 'preguntas' : view;
  const hint = hintTab();
  const att = attention(d);
  const careNeeded = att.angry + att.mess + att.coins + att.boxes > 0;
  const tab = (id, label) => `<button data-act="go" data-v="${id}" ${active === id ? 'aria-current="page"' : ''} class="${[hint === id && active !== id ? 'hint' : '', id === 'casa' && active !== 'casa' && careNeeded ? 'dot' : ''].filter(Boolean).join(' ')}">${icon(id)}<span>${label}</span></button>`;
  $app.innerHTML = `
    <header class="top">
      <div class="titles"><h1>${titles[view]}</h1><div class="sub">${esc(d.profile.name)}</div></div>
      <span class="coins" aria-label="${plural(d.coins, 'moneda', 'monedas')}" data-testid="coins">${coinIcon()}<b>${d.coins}</b></span>
      <button class="icon-btn" data-act="go" data-v="ajustes" aria-label="Ajustes">${icon('gear')}</button>
    </header>
    <main>${body}</main>
    <nav class="tabs"><div class="inner">${tab('casa', 'Casa')}${tab('tienda', 'Tienda')}${tab('preguntas', 'Preguntas')}${tab('logros', 'Logros')}${tab('stats', 'Estadísticas')}</div></nav>`;
  if (view === 'quiz') jokerTimer = setInterval(updateJokerButton, 20000);
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

function bubble(text) {
  return `<div class="bubble" data-testid="bubble"><p>${esc(text)}</p></div>`;
}

const SOUNDS = {
  cactus: (n) => `Le echo un vistazo a ${n}… ¡con cuidado, que pincha!`,
  pez: (n) => `${n} nada feliz de un lado a otro.`,
  canario: (n) => `${n} canta una melodía solo para ti.`,
  gato: (n) => `${n} ronronea mientras lo acaricias.`,
  perro: (n) => `¡${n} mueve la cola como loco!`,
  margarita: (n) => `${n} se mece con la brisa y presume de pétalos.`,
  hamster: (n) => `${n} corre y corre sin parar.`,
  tortuga: (n) => `${n} asoma la cabeza muy despacito.`,
  bonsai: (n) => `Le das un toque de tijera a ${n}: ¡qué elegante!`,
  conejo: (n) => `${n} mueve la nariz y da un salto de alegría.`,
  loro: (n) => `${n} repite una frase que acaba de oír… ¡«artículo catorce»!`,
};

function houseLine() {
  const d = doc();
  if (houseMsg) return houseMsg;
  const upset = petsOf(d).find((p) => isUpset(p));
  if (upset) {
    const t = MOOD_TEXT[upset.itemId];
    const lo = t.f ? 'la' : 'lo';
    return upset.mood === 'angry' ? `¡${upset.name} ${t.angry}! Tóca${lo} para ${isPlant(upset.itemId) ? 'cuidar' : 'calmar'}${lo}.` : `${upset.name} ${t.mess}. ¡Toca para limpiar!`;
  }
  const rich = petsOf(d).find((p) => p.coin);
  if (rich) return `¡${rich.name} ha encontrado una moneda! Tócala para cogerla.`;
  if (d.daily.boxes > 0) return '¡Tienes una caja misteriosa! Ábrela aquí abajo.';
  if (!d.flags.introSeen) return '¡Qué vacío está esto! Voy a ir de compras…';
  if (d.stats.answered === 0) return 'Sigo sin nada en casa… ¡Necesito monedas!';
  if (isNight() && Math.random() < 0.5) {
    if (!LAMPS.some((id) => ownedIds(d).has(id))) return 'Está oscuro… me vendría bien una lámpara.';
    if (d.flags.lampOff) return 'Qué oscuro está. Toca la lámpara para encenderla.';
    return 'Qué a gusto se estudia con esta luz.';
  }
  const pets = petsOf(d);
  if (!d.inventory.length) return d.coins >= 1 ? `Tengo ${plural(d.coins, 'moneda', 'monedas')}. ¿Nos vamos de compras?` : 'Ya no me quedan monedas. ¡Otra ronda de preguntas!';
  const needy = pets.find((p) => missingTool(d, p.itemId));
  if (needy && Math.random() < 0.6) return `${needy.name} crecería más deprisa con ${BY_ID[missingTool(d, needy.itemId)].name.toLowerCase()}.`;
  if (pets.length && Math.random() < 0.6) {
    const p = pick(pets);
    return stageOf(p.itemId, p.xp) === 2 ? `¡Mira qué grande está ${p.name}!` : SOUNDS[p.itemId](p.name);
  }
  return d.coins ? `Tengo ${plural(d.coins, 'moneda', 'monedas')}. ¡Cada acierto cuenta!` : '¡Cada acierto cuenta!';
}

function stateTags(p) {
  const out = [];
  if (p.mood === 'angry') out.push(`<span class="tag bad">${esc(MOOD_TEXT[p.itemId].angry.replace('está ', '').replace(/^./, (c) => c.toUpperCase()))}</span>`);
  if (p.mess > 0) out.push(`<span class="tag bad">Sucio ×${p.mess}</span>`);
  if (p.coin) out.push(`<span class="tag ok">¡Tiene ${plural(coinValue(p), 'moneda', 'monedas')}!</span>`);
  else if (!isUpset(p)) out.push(`<span class="tag joy" title="Aciertos para que encuentre una moneda">♥ ${p.joy}/${JOY_TARGET}</span>`);
  return out.join(' ');
}

function dailyCard() {
  const d = doc();
  const day = dayOfWeek(d.daily.streak);
  const dots = Array.from({ length: WEEK }, (_, i) => `<i class="${i < day ? 'on' : ''}"></i>`).join('');
  const box = d.daily.boxes > 0 ? `<button class="btn primary block" data-act="open-box" data-testid="open-box">Abrir caja misteriosa${d.daily.boxes > 1 ? ` (${d.daily.boxes})` : ''}</button>` : '';
  return `<section class="card daily" data-testid="daily"><h3>Entrada diaria</h3><div class="dots" aria-label="Día ${day} de ${WEEK}">${dots}</div>
    <p class="muted">Día ${day} de ${WEEK}. Cada día que entras ganas 1 moneda; al 7.º día seguido llega una caja misteriosa con un objeto exclusivo.</p>${box}</section>`;
}

function petRows() {
  const d = doc();
  const pets = petsOf(d);
  if (!pets.length) return '';
  return `<section class="card pets"><h3>Tus mascotas</h3>${pets
    .map((p) => {
      const g = growthInfo(p.itemId, p.xp);
      const boost = boostFor(d, p.itemId);
      const tool = missingTool(d, p.itemId);
      const note = tool ? `Necesita ${BY_ID[tool].name.toLowerCase()} para crecer más rápido` : `Crece ×${String(boost).replace('.', ',')}`;
      return `<div class="pet-row" data-testid="pet-row">
        <button class="pet-pic" data-pet="${p.uid}" aria-label="Acariciar a ${esc(p.name)}">${petThumb(p.itemId, g.stage)}</button>
        <div class="pet-info"><div class="pet-head"><b>${esc(p.name)}</b> <span class="tag">${STAGE_NAMES[g.stage]}</span>${stateTags(p)}</div>
          <span class="bar"><i style="width:${g.pct}%"></i></span>
          <small class="muted">${g.stage === 2 ? 'Ya es adulto · ' : `Faltan ${g.need} aciertos · `}${note}</small></div>
        <button class="btn small" data-act="rename" data-uid="${p.uid}">Renombrar</button></div>`;
    })
    .join('')}</section>`;
}

function viewCasa() {
  const d = doc();
  const guide =
    hintTab() === 'tienda' ? (d.inventory.length || !d.flags.introSeen ? 'Toca «Tienda» en el menú de abajo.' : 'Ya tienes monedas: toca «Tienda» para comprar algo.') : hintTab() === 'preguntas' ? 'Toca «Preguntas» para ganar tus primeras monedas.' : '';
  return `${bubble(houseLine())}<div class="scene-wrap">${sceneSvg({ gender: d.profile.gender, inventory: d.inventory, hopUid, night: isNight(), lampOff: Boolean(d.flags.lampOff) })}</div>${guide ? `<p class="guide">${guide}</p>` : ''}${petRows()}${dailyCard()}`;
}

function thumbFor(id) {
  return isPet(id) ? petThumb(id, 2) : itemThumb(id);
}

function viewTienda() {
  const d = doc();
  const owned = ownedIds(d);
  const items = CATALOG.filter((i) => i.cat === shopCat)
    .map((i) => {
      const chk = canBuy(d, i.id);
      const pet = isPet(i.id);
      const count = pet ? ` · Tienes ${countOf(d, i.id)}/${SPECIES[i.id].max}` : '';
      const label = chk.ok ? 'Comprar' : chk.code === 'owned' ? 'Ya lo tienes' : chk.code === 'max' ? 'Máximo' : chk.reason;
      return `<li class="row item" data-testid="item-${i.id}">
        <span class="thumb-wrap">${thumbFor(i.id)}</span>
        <span class="body"><span class="title">${esc(i.name)}</span><span class="meta">${esc(i.desc)}${count}</span></span>
        <span class="price">${coinIcon()}<b>${i.price}</b></span>
        <button class="btn small ${chk.ok ? 'primary' : ''}" data-act="buy" data-id="${i.id}" ${chk.ok ? '' : 'disabled'}>${label}</button>
      </li>`;
    })
    .join('');
  void owned;
  const msg = shopFirst && d.coins === 0 && !d.inventory.length ? 'Vaya, no tengo monedas… Tal vez si respondo algunas preguntas bien…' : d.coins === 0 ? 'Sin monedas no puedo comprar nada. ¡A responder preguntas!' : `Tengo ${plural(d.coins, 'moneda', 'monedas')}. ¿Qué me llevo?`;
  return `
    <section class="card shop-head"><h2>¿Qué desea comprar?</h2><p class="muted">Tienes <b>${plural(d.coins, 'moneda', 'monedas')}</b>.</p></section>
    <div class="seg full" role="group" aria-label="Categoría">${CATEGORIES.map((c) => `<button data-act="cat" data-c="${c.id}" aria-pressed="${shopCat === c.id}">${c.name}</button>`).join('')}</div>
    <ul class="list shop-list">${items}</ul>
    ${bubble(msg)}`;
}

/* ---------- Compra y nombres de mascota ---------- */
function askName(mode, ref) {
  document.querySelector('.overlay')?.remove();
  const isBuy = mode === 'buy';
  const pet = isBuy ? null : petsOf(doc()).find((p) => p.uid === ref);
  const item = BY_ID[isBuy ? ref : pet?.itemId];
  if (!item) return;
  const el = document.createElement('div');
  el.className = 'overlay';
  el.innerHTML = `<form class="sheet" id="nameform" data-mode="${mode}" data-ref="${ref}" autocomplete="off">
    <h2>${isBuy ? `Ponle nombre a tu ${item.name.toLowerCase()}` : `Nuevo nombre para ${esc(pet.name)}`}</h2>
    <div class="field"><label for="pname">Nombre</label><input id="pname" type="text" maxlength="20" required value="${isBuy ? '' : esc(pet.name)}" /></div>
    ${isBuy ? `<p class="muted">Cuesta ${plural(item.price, 'moneda', 'monedas')}.</p>` : ''}
    <div class="actions"><button type="button" class="btn grow" data-act="sheet-close">Cancelar</button><button class="btn primary grow">${isBuy ? 'Comprar' : 'Guardar'}</button></div></form>`;
  document.body.append(el);
  el.querySelector('input').focus();
}

async function buyItem(itemId, name) {
  const item = BY_ID[itemId];
  let res;
  try {
    res = await store.update((d) => buy(d, itemId, name, Date.now()));
  } catch (e) {
    toast(e.message);
    return;
  }
  document.querySelector('.overlay')?.remove();
  const logros = await afterChange();
  if (isPet(itemId)) {
    houseMsg = `¡Hola, ${name.trim()}! Bienvenid${item.id === 'cactus' ? 'o' : 'o'} a casa.`;
    hopUid = res.uid;
    await go('casa');
    setTimeout(() => (hopUid = null), 1200);
  } else {
    toast(`Has comprado: ${item.name}${logros.length ? '' : ''}`);
    render();
  }
}

/** El personaje interactúa con una mascota al tocarla: la calma si está enfadada; si no, le hace caso. */
async function interact(uid) {
  const p = doc().inventory.find((i) => i.uid === uid);
  if (!p) return;
  hopUid = uid;
  if (p.mood === 'angry') {
    await store.update((d) => calmPet(d, uid));
    const now = doc().inventory.find((i) => i.uid === uid);
    houseMsg = isPlant(p.itemId) ? `Cuidas a ${p.name} con mimo: ¡se le ha levantado el ánimo!` : `Acaricias a ${p.name} y le hablas con cariño… ¡ya está contento otra vez!`;
    if (now.mess > 0) houseMsg += ' Aún queda algo por limpiar.';
  } else if (p.mess > 0) houseMsg = `${p.name} ${MOOD_TEXT[p.itemId].mess}. ¡Toca la suciedad para limpiarla!`;
  else houseMsg = SOUNDS[p.itemId](p.name);
  view = 'casa';
  render();
  setTimeout(() => (hopUid = null), 1200);
  await afterChange();
}

/** El personaje limpia la caca (o suciedad) de una mascota. */
async function cleanUp(uid) {
  const p = doc().inventory.find((i) => i.uid === uid);
  if (!p) return;
  await store.update((d) => cleanMess(d, uid));
  houseMsg = doc().inventory.find((i) => i.uid === uid).mess > 0 ? '¡Puaj! Una menos… queda más por limpiar.' : `¡Todo limpio! ${p.name} te lo agradece.`;
  view = 'casa';
  render();
  await afterChange();
}

/** Coge la moneda que ha encontrado (o que le ha crecido) una mascota feliz. */
async function takeCoin(uid) {
  const p = doc().inventory.find((i) => i.uid === uid);
  if (!p) return;
  const v = await store.update((d) => collectCoin(d, uid));
  if (!v) return;
  houseMsg = `¡Has cogido ${plural(v, 'moneda', 'monedas')} que ${p.name} te ha traído!`;
  view = 'casa';
  render();
  await afterChange();
}

/** Abre la caja misteriosa semanal y enseña lo que ha tocado. */
async function openMysteryBox() {
  let res;
  try {
    res = await store.update((d) => openBox(d, Date.now()));
  } catch (e) {
    toast(e.message);
    return;
  }
  const item = res.itemId ? BY_ID[res.itemId] : null;
  document.querySelector('.overlay')?.remove();
  const el = document.createElement('div');
  el.className = 'overlay';
  el.innerHTML = `<div class="sheet reveal" data-testid="reveal"><h2>¡Caja misteriosa!</h2>
    <div class="reveal-art">${item ? itemThumb(item.id, 'thumb big') : coinIcon()}</div>
    <p><b>${item ? esc(item.name) : plural(res.coins, 'moneda', 'monedas')}</b></p>
    <p class="muted">${item ? 'Objeto exclusivo: ya está en tu casa.' : 'Ya tienes todos los objetos exclusivos: ¡toma monedas!'}</p>
    <button class="btn primary block" data-act="sheet-close-render">¡Genial!</button></div>`;
  document.body.append(el);
  await afterChange();
}

/** Bonus diario: 1 moneda por entrar cada día y una caja misteriosa al 7.º día seguido. */
async function checkDaily() {
  if (!store || !doc().profile) return;
  const r = await store.update((d) => claimDaily(d, Date.now()));
  if (!r) return;
  render();
  if (!r.first) toast(`¡Bonus diario! +${plural(r.coins, 'moneda', 'monedas')} · día ${dayOfWeek(r.streak)} de ${WEEK}${r.box ? ' · ¡Te llega una caja misteriosa!' : ''}`, 6000);
  await afterChange();
}

/* ---------- Preguntas ---------- */
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
  return `<p class="muted lead">Elige un tema. Cada acierto te da una moneda; con 3 seguidas ganas 1 extra y con 10 seguidas, 2 extra. Además hace crecer a tus mascotas.</p>${cards || '<p class="empty"><b>Sin temas</b>No se han podido cargar los temas.</p>'}`;
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
  quiz = { tema, bank: banks[id], recent: [], session: { ok: 0, total: 0 }, q: null, order: [], picked: null, result: null, hidden: new Set() };
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
  quiz.hidden = new Set();
  quiz.recent.push(q.id);
}

function jokerLabel() {
  const left = remainingMs(doc(), Date.now());
  return left ? `Comodín en ${formatRemaining(left)}` : 'Comodín 50 %';
}

function updateJokerButton() {
  const b = document.querySelector('[data-act=joker]');
  if (!b) return;
  b.textContent = jokerLabel();
  b.disabled = !isAvailable(doc(), Date.now()) || quiz?.picked !== null || quiz?.hidden.size > 0;
}

function viewQuiz() {
  if (!quiz) return viewPreguntas();
  const { q, order, picked, result, hidden } = quiz;
  const d = doc();
  const opts = order
    .map((orig, pos) => {
      if (hidden.has(orig) && picked === null) return `<button class="opt gone" disabled aria-hidden="true"><span class="letter">${'ABCD'[pos]}</span><span>—</span></button>`;
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
    const grown = result.grown.map((g) => `<p class="grown" data-testid="grown">¡${esc(g.name)} ha crecido! Ahora es ${STAGE_NAMES[g.stage].toLowerCase()}.</p>`).join('');
    const pets = petsOf(d).length;
    const found = result.found.map((g) => `<p class="grown" data-testid="found">¡${esc(g.name)} ha encontrado una moneda! Cógela en Casa.</p>`).join('');
    const bad = result.mischief.length
      ? `<p class="mischief" data-testid="mischief">¡${result.wrong} fallos seguidos! Tus mascotas se han portado mal: míralas en Casa.</p>`
      : pets && !result.correct && result.wrong % WRONG_LIMIT === WRONG_LIMIT - 1
        ? '<p class="mischief warn">Un fallo más y tus mascotas se enfadarán…</p>'
        : '';
    feedback = `<div class="feedback ${result.correct ? 'ok' : 'ko'}" role="status"><p class="verdict">${result.correct ? '¡Correcto!' : 'Incorrecta'} ${coins}</p><p>${esc(q.explicacion)}</p>${grown}${found}${bad}<button class="btn primary block" data-act="next">Siguiente</button></div>`;
  }
  const jokerOff = picked !== null || hidden.size > 0 || !isAvailable(d, Date.now());
  return `
    <div class="quiz-bar"><button class="btn small" data-act="go" data-v="preguntas">Salir</button>
      <span class="chip-stat" data-testid="streak">Racha <b>${d.streak.current}</b></span>
      <span class="chip-stat">Sesión <b>${quiz.session.ok}/${quiz.session.total}</b></span></div>
    <article class="card question"><p class="ref">${esc(q.titulo)} · Art. ${esc(q.articulo)}</p><h2 data-testid="question">${esc(q.enunciado)}</h2><div class="opts">${opts}</div>
      <button class="btn small joker" data-act="joker" ${jokerOff ? 'disabled' : ''}>${jokerLabel()}</button></article>
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
  await afterChange();
}

async function playJoker() {
  if (!quiz || quiz.picked !== null || quiz.hidden.size) return;
  try {
    await store.update((d) => useJoker(d, Date.now()));
  } catch (e) {
    toast(e.message);
    return;
  }
  quiz.hidden = new Set(pickHidden(quiz.q.correcta));
  render();
  await afterChange();
}

/* ---------- Logros ---------- */
function medal(art, done) {
  const inner = art.pet ? petThumb(art.pet, 2, 'medal-art') : art.item ? itemThumb(art.item, 'medal-art') : `<svg class="medal-art" viewBox="0 0 60 60" aria-hidden="true"><text x="30" y="37" text-anchor="middle" font-size="${String(art.txt).length > 2 ? 17 : 22}" font-weight="800" fill="currentColor">${esc(art.txt ?? '★')}</text></svg>`;
  return `<span class="medal ${done ? 'done' : ''}">${inner}</span>`;
}

function viewLogros() {
  const d = doc();
  const ctx = { doc: d, questions: allQuestions(), now: Date.now() };
  const done = ACHIEVEMENTS.filter((a) => d.achievements[a.id]).length;
  const groups = [...new Set(ACHIEVEMENTS.map((a) => a.group))];
  return `<section class="card"><h3 data-testid="ach-count">${done} de ${ACHIEVEMENTS.length} logros</h3><span class="bar"><i style="width:${Math.round((done / ACHIEVEMENTS.length) * 100)}%"></i></span></section>
  ${groups
    .map(
      (g) => `<section class="group"><h2>${g}</h2><ul class="list">${ACHIEVEMENTS.filter((a) => a.group === g)
        .map((a) => {
          const got = Boolean(d.achievements[a.id]);
          const cur = got ? a.target : progressOf(a, ctx);
          const bar = a.target > 1 && !got ? `<span class="bar"><i style="width:${Math.round((cur / a.target) * 100)}%"></i></span><small class="muted">${Math.floor(cur)} / ${a.target}</small>` : '';
          return `<li class="row ach ${got ? 'got' : 'locked'}" data-testid="ach-${a.id}">${medal(a.art, got)}<span class="body"><span class="title">${esc(a.name)}</span><span class="meta">${esc(a.desc)}</span>${bar}</span>${got ? '<span class="tag ok">Conseguido</span>' : ''}</li>`;
        })
        .join('')}</ul></section>`,
    )
    .join('')}`;
}

/* ---------- Estadísticas ---------- */
const WEEKDAY = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

function viewStats() {
  const d = doc();
  const s = d.stats;
  if (!s.answered) return '<p class="empty"><b>Aún no hay estadísticas</b>Responde algunas preguntas y verás aquí en qué fallas más.</p>';
  const questions = allQuestions();
  const pct = Math.round((s.correct / s.answered) * 100);
  const counts = { new: 0, failed: 0, learning: 0, mastered: 0 };
  for (const q of questions) counts[statusOf(d.progress[q.id])]++;
  const titles = Object.entries(s.byTitle)
    .map(([t, v]) => ({ t, n: v.ok + v.ko, pct: Math.round((v.ok / (v.ok + v.ko)) * 100) }))
    .filter((x) => x.n > 0)
    .sort((a, b) => a.pct - b.pct);
  const days = lastDays(d, Date.now(), 7);
  const max = Math.max(1, ...days.map((x) => x.n));
  const arts = byArticle(d, questions);
  const byId = Object.fromEntries(questions.map((q) => [q.id, q]));
  const worst = Object.entries(d.progress)
    .filter(([id, p]) => p.ko > 0 && byId[id])
    .sort((a, b) => b[1].ko - a[1].ko)
    .slice(0, 5);
  return `
    <section class="card"><h3>Resumen</h3>
      <div class="kpis"><div><b>${s.answered}</b><span>respondidas</span></div><div><b>${pct}%</b><span>aciertos</span></div><div><b>${d.streak.best}</b><span>mejor racha</span></div></div></section>
    <section class="card"><h3>Últimos 7 días</h3>
      <div class="week" data-testid="week">${days.map((x) => `<div class="day"><span class="col"><i class="n" style="height:${(x.n / max) * 100}%"><i class="ok" style="height:${x.n ? (x.ok / x.n) * 100 : 0}%"></i></i></span><b>${x.n}</b><small>${WEEKDAY[new Date(`${x.key}T12:00:00`).getDay()]}</small></div>`).join('')}</div>
      <p class="muted">Respondidas por día (la parte oscura son los aciertos).</p></section>
    <section class="card"><h3>Dónde fallas más (por Título)</h3>
      ${titles.map((x) => `<div class="bar-row"><span>${esc(x.t)} <small>(${x.n})</small></span><span class="bar"><i style="width:${x.pct}%"></i></span><b>${x.pct}%</b></div>`).join('')}
      <p class="muted">Ordenado de menos a más aciertos.</p></section>
    ${arts.length ? `<section class="card"><h3>Artículos con más fallos</h3>${arts.map((a) => `<div class="line" data-testid="art-row"><span><b>Art. ${a.articulo}</b> <small>${esc(a.titulo)}</small></span><span><b>${a.pct}%</b> <small class="muted">${a.ok} ✓ · ${a.ko} ✗</small></span></div>`).join('')}</section>` : ''}
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
    <section class="card"><h3>Escena de la casa</h3><div class="seg" role="group" aria-label="Escena">
      ${[['auto', 'Automática'], ['day', 'Día'], ['night', 'Noche']].map(([v, l]) => `<button data-act="scene" data-v="${v}" aria-pressed="${(d.settings.sceneMode ?? 'auto') === v}">${l}</button>`).join('')}</div>
      <p class="muted">Automática: de 6:00 a 18:00 es de día y el resto, de noche (con luna y estrellas). De noche puedes encender las lámparas tocándolas.</p></section>
    <section class="card"><h3>Copia de seguridad</h3><p>Tus datos solo viven en este dispositivo. Guarda una copia de vez en cuando.</p>
      <div class="actions"><button class="btn" data-act="export">Exportar</button><label class="btn file">Importar<input type="file" accept="application/json,.json" data-act="import" hidden /></label></div></section>
    <section class="card"><h3>Reiniciar</h3><p>Borra monedas, progreso, mascotas y perfil de este dispositivo. Se guarda antes una copia automática.</p>
      <button class="btn danger" data-act="reset">Empezar de cero</button></section>
    <p class="muted center">Oposiciones v${VERSION} · comodín cada ${COOLDOWN_MS / 3600000} h · bonus ×${1 + BOOST_MAIN} con herramienta (+${BOOST_EXTRA * 100} % por extra)</p>`;
}

/* ---------- Eventos ---------- */
document.addEventListener('click', async (e) => {
  const lampEl = e.target.closest('[data-lamp]');
  if (lampEl) {
    await store.update((d) => {
      d.flags.lampOff = !d.flags.lampOff;
    });
    houseMsg = doc().flags.lampOff ? 'Apagas la luz.' : '¡Qué luz tan acogedora!';
    render();
    return;
  }
  const poopEl = e.target.closest('[data-poop]');
  if (poopEl) {
    await cleanUp(Number(poopEl.dataset.poop));
    return;
  }
  const coinEl = e.target.closest('[data-petcoin]');
  if (coinEl) {
    await takeCoin(Number(coinEl.dataset.petcoin));
    return;
  }
  const petEl = e.target.closest('[data-pet]');
  if (petEl && !e.target.closest('[data-act]')) {
    await interact(Number(petEl.dataset.pet));
    return;
  }
  const el = e.target.closest('[data-act]');
  if (!el || el.tagName === 'INPUT') return;
  const act = el.dataset.act;
  try {
    if (act === 'go') await go(el.dataset.v);
    else if (act === 'cat') {
      shopCat = el.dataset.c;
      render();
    } else if (act === 'buy') {
      const id = el.dataset.id;
      if (isPet(id)) askName('buy', id);
      else await buyItem(id, '');
    } else if (act === 'rename') askName('rename', Number(el.dataset.uid));
    else if (act === 'sheet-close') document.querySelector('.overlay')?.remove();
    else if (act === 'sheet-close-render') {
      document.querySelector('.overlay')?.remove();
      render();
    } else if (act === 'open-box') await openMysteryBox();
    else if (act === 'quiz') await startQuiz(el.dataset.t);
    else if (act === 'answer') await answer(Number(el.dataset.p));
    else if (act === 'joker') await playJoker();
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
    } else if (act === 'scene') {
      await store.update((d) => {
        d.settings.sceneMode = el.dataset.v;
      });
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
  if (e.target.id === 'onboard') {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const gender = document.querySelector('[data-act="gender"][aria-pressed="true"]')?.dataset.g;
    if (!name || !gender) return;
    await store.update((d) => {
      d.profile = { name, gender };
    });
    await store.update((d) => claimDaily(d, Date.now()));
    view = 'casa';
    render();
  } else if (e.target.id === 'nameform') {
    e.preventDefault();
    const f = e.target;
    const name = document.getElementById('pname').value;
    if (f.dataset.mode === 'buy') await buyItem(f.dataset.ref, name);
    else {
      try {
        await store.update((d) => renamePet(d, Number(f.dataset.ref), name));
        document.querySelector('.overlay')?.remove();
        render();
      } catch (err) {
        toast(err.message);
      }
    }
  }
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
  if (!confirm('¿Seguro? Se borrarán tus monedas, tu progreso, tus mascotas y tu perfil en este dispositivo.')) return;
  await store.resetAll();
  quiz = null;
  houseMsg = null;
  view = 'casa';
  render();
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') checkDaily().catch(() => {});
});

boot();
