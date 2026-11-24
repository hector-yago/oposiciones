// Interfaz de la PWA. Estado de pantalla en memoria; datos del usuario en el almacén (js/store.js).
import { VERSION } from './version.js';
import { createStore, indexedDbAdapter, memoryAdapter } from './store.js';
import { applyAnswer } from './economy.js';
import { pickNext, statusOf } from './scheduler.js';
import { BY_ID, CATALOG, CATEGORIES, LAMPS, ROOMS, SPECIES, STAGE_NAMES, isPet, isPlant, roomOf } from './catalog.js';
import { BOOST_EXTRA, BOOST_MAIN, JOY_TARGET, MOOD_TEXT, attention, boostFor, buy, calmPet, canBuy, cleanMess, coinValue, collectCoin, countOf, growthInfo, isUpset, missingTool, ownedIds, petsOf, renamePet, stageOf } from './shop.js';
import { WEEK, claimDaily, dayOfWeek, openBox } from './daily.js';
import { WRONG_LIMIT } from './economy.js';
import { COOLDOWN_MS, formatRemaining, isAvailable, pickHidden, remainingMs, useJoker } from './joker.js';
import { ACHIEVEMENTS, newlyUnlocked, progressOf, unlock } from './achievements.js';
import { byArticle, lastDays, masteryByGroup, weeklyAccuracy } from './stats.js';
import { isNightHour, sceneSvg } from './art/scene.js';
import { gardenSvg } from './art/garden.js';
import { studySvg } from './art/study.js';
import { buildNotices } from './notifications.js';
import { backupDue, daysSinceBackup, ensureFirstUse, markBackup, reasonLabel } from './backup.js';
import { clearFlags, flaggedReport, toggleFlag } from './review.js';
import { play, setEnabled } from './sound.js';
import { soundLine } from './phrases.js';
import { petThumb } from './art/pets.js';
import * as study from './study.js';
import { ensureMissions } from './missions.js';
import { seasonOf } from './seasons.js';
import { breed, canBreed } from './breed.js';
import { TITLE_INFO } from './minigames.js';
import { SHARE_VARS, VARIANT_FILTERS, decodeCode, encodeCode, inlineSceneStyles } from './share.js';
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
let activeTema = 'ce'; // tema que usan los modos de estudio
let room = 'casa'; // habitación que se ve en Casa: 'casa' (salón) o 'jardin'

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

/** Temporada para la decoración (en localhost se puede forzar con ?fecha=2026-12-24). */
function currentSeason() {
  if (doc().settings.season === 'off') return null;
  if (location.hostname === 'localhost') {
    const f = new URLSearchParams(location.search).get('fecha');
    if (f && /^\d{4}-\d{2}-\d{2}$/.test(f)) {
      const [y, m, d] = f.split('-').map(Number);
      return seasonOf(new Date(y, m - 1, d));
    }
  }
  return seasonOf(new Date());
}

const ICONS = {
  bell: '<path d="M6 17h12l-1.5-2.2V10a4.5 4.5 0 00-9 0v4.8L6 17zM10 20a2 2 0 004 0"/>',
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
  study.init({
    doc,
    get store() {
      return store;
    },
    esc,
    plural,
    toast,
    rerender: () => render(),
    banks: () => banks,
    allQuestions,
    afterChange,
    getTema: (id) => temas.find((t) => t.id === id),
    activeTema: () => activeTema,
  });
  applyTheme();
  render();
  await checkDaily();
  // Ganchos de prueba (e2e): solo en localhost.
  if (location.hostname === 'localhost') {
    window.__store = () => store;
    window.__quiz = () => quiz;
    window.__daily = () => checkDaily();
    window.__houseBlob = () => buildHouseBlob();
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
  document.documentElement.style.fontSize = { normal: '16px', large: '18px', xlarge: '20px' }[doc().settings.fontScale] ?? '16px';
  document.documentElement.classList.toggle('calm', Boolean(doc().settings.calm));
  setEnabled(doc().settings.sound);
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
  play('ach');
  toast(names.length === 1 ? `Logro desbloqueado: ${names[0]}` : `${names.length} logros desbloqueados: ${names.join(', ')}`, 5000);
  return names;
}

/* ---------- Navegación ---------- */
async function go(v) {
  if (!study.canLeave(v)) return;
  study.resetOnEnter(v);
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
  try {
    renderInner();
  } catch (e) {
    console.error(e);
    $app.innerHTML = `<main class="fatal" data-testid="crash"><h1>No se ha podido mostrar la pantalla</h1><p>Tus datos siguen guardados. Prueba a recargar; si vuelve a pasar, restaura una copia automática.</p>
      <div class="actions"><button class="btn primary" data-act="reload">Recargar</button><button class="btn" data-act="list-backups">Copias automáticas</button></div></main>`;
  }
}

function renderInner() {
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
  const titles = { casa: 'Mi casa', tienda: 'Tienda', preguntas: 'Preguntas', quiz: quiz ? quiz.tema.nombre : 'Preguntas', logros: 'Logros', stats: 'Estadísticas', ajustes: 'Ajustes', examen: 'Examen', tarjetas: 'Tarjetas', juegos: 'Minijuegos', armario: 'Armario', avisos: 'Avisos' };
  const body = { casa: viewCasa, tienda: viewTienda, preguntas: viewPreguntas, quiz: viewQuiz, logros: viewLogros, stats: viewStats, ajustes: viewAjustes, examen: study.viewExamen, tarjetas: study.viewTarjetas, juegos: study.viewJuegos, armario: study.viewArmario, avisos: viewAvisos }[view]();
  const active = { quiz: 'preguntas', examen: 'preguntas', tarjetas: 'preguntas', juegos: 'preguntas', armario: 'casa' }[view] ?? view;
  const hint = hintTab();
  const notices = buildNotices(d, Date.now());
  const att = attention(d);
  const careNeeded = att.angry + att.mess + att.coins + att.boxes > 0;
  const tab = (id, label) => `<button data-act="go" data-v="${id}" ${active === id ? 'aria-current="page"' : ''} class="${[hint === id && active !== id ? 'hint' : '', id === 'casa' && active !== 'casa' && careNeeded ? 'dot' : ''].filter(Boolean).join(' ')}">${icon(id)}<span>${label}</span></button>`;
  $app.innerHTML = `
    <header class="top">
      <div class="titles"><h1>${titles[view]}</h1><div class="sub">${esc(d.profile.name)}</div></div>
      <span class="coins" aria-label="${plural(d.coins, 'moneda', 'monedas')}" data-testid="coins">${coinIcon()}<b>${d.coins}</b></span>
      <button class="icon-btn bell" data-act="go" data-v="avisos" data-testid="bell" aria-label="Avisos${notices.length ? ` (${notices.length})` : ''}">${icon('bell')}${notices.length ? `<span class="badge" data-testid="badge">${notices.length}</span>` : ''}</button>
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
    return stageOf(p.itemId, p.xp) === 2 ? `¡Mira qué grande está ${p.name}!` : soundLine(p.itemId, p.name);
  }
  return d.coins ? `Tengo ${plural(d.coins, 'moneda', 'monedas')}. ¡Cada acierto cuenta!` : '¡Cada acierto cuenta!';
}

function stateTags(p) {
  const out = [];
  if (p.variant) out.push(`<span class="tag rare">✨ ${esc({ azul: 'Azul', dorado: 'Dorado', arcoiris: 'Arcoíris' }[p.variant])}</span>`);
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

/** Botones para criar: solo de las especies que ahora pueden. */
function breedButtons() {
  const d = doc();
  const now = Date.now();
  const ready = Object.keys(SPECIES).filter((sp) => petsOf(d).some((p) => p.itemId === sp) && canBreed(d, sp, now).ok);
  if (!ready.length) return '';
  return `<div class="breed"><p class="muted">Tienes mascotas adultas, felices y limpias: pueden tener una cría (a veces con un color especial).</p>${ready.map((sp) => `<button class="btn small" data-act="breed" data-sp="${sp}" data-testid="breed-${sp}">Criar: ${esc(BY_ID[sp].name)}</button>`).join(' ')}</div>`;
}

/** Aviso destacado en Casa: el primer aviso importante (mascotas, examen cercano, copia de seguridad). */
function noticeBanner() {
  const n = buildNotices(doc(), Date.now()).find((x) => x.level === 'warn');
  if (!n) return '';
  return `<div class="banner" data-testid="notice-banner"><span>${esc(n.text)}</span><button class="btn small" data-act="go" data-v="${n.view}">${esc(n.label)}</button></div>`;
}

/** SVG de la habitación actual. */
function roomSvg(opts) {
  return room === 'jardin' ? gardenSvg(opts) : room === 'estudio' ? studySvg(opts) : sceneSvg(opts);
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
        <button class="pet-pic ${p.variant ? `v-${p.variant}` : ''}" data-pet="${p.uid}" aria-label="Acariciar a ${esc(p.name)}">${petThumb(p.itemId, g.stage)}</button>
        <div class="pet-info"><div class="pet-head"><b>${esc(p.name)}</b> <span class="tag">${STAGE_NAMES[g.stage]}</span>${stateTags(p)}</div>
          <span class="bar"><i style="width:${g.pct}%"></i></span>
          <small class="muted">${g.stage === 2 ? 'Ya es adulto · ' : `Faltan ${g.need} aciertos · `}${note}</small></div>
        <button class="btn small" data-act="rename" data-uid="${p.uid}">Renombrar</button></div>`;
    })
    .join('')}${breedButtons()}</section>`;
}

function viewCasa() {
  const d = doc();
  const guide =
    hintTab() === 'tienda' ? (d.inventory.length || !d.flags.introSeen ? 'Toca «Tienda» en el menú de abajo.' : 'Ya tienes monedas: toca «Tienda» para comprar algo.') : hintTab() === 'preguntas' ? 'Toca «Preguntas» para ganar tus primeras monedas.' : '';
  const rooms = ROOMS.filter((r) => !r.req || ownedIds(d).has(r.req));
  if (!rooms.some((r) => r.id === room)) room = 'casa';
  const opts = { gender: d.profile.gender, inventory: d.inventory, hopUid, night: isNight(), lampOff: Boolean(d.flags.lampOff), outfit: d.outfit, season: currentSeason() };
  const tabs = rooms.length > 1 ? `<div class="seg full room-tabs" role="group" aria-label="Habitación">${rooms.map((r) => `<button data-act="room" data-r="${r.id}" aria-pressed="${room === r.id}">${r.name}</button>`).join('')}</div>` : '';
  const tools = '<div class="actions casa-actions"><button class="btn small" data-act="go" data-v="armario" data-testid="open-wardrobe">Armario</button><button class="btn small" data-act="share" data-testid="share">Compartir mi casa</button></div>';
  return `${noticeBanner()}${bubble(houseLine())}${tabs}<div class="scene-wrap">${roomSvg(opts)}</div>${tools}${guide ? `<p class="guide">${guide}</p>` : ''}${study.goalCard(Date.now())}${study.missionsCard()}${petRows()}${dailyCard()}`;
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
      const count = pet ? ` · Tienes ${countOf(d, i.id)}${countOf(d, i.id) <= SPECIES[i.id].max ? `/${SPECIES[i.id].max}` : ''}` : '';
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
  const isBuy = mode === 'buy' || mode === 'breed';
  const pet = isBuy ? null : petsOf(doc()).find((p) => p.uid === ref);
  const item = BY_ID[isBuy ? ref : pet?.itemId];
  if (!item) return;
  const el = document.createElement('div');
  el.className = 'overlay';
  el.innerHTML = `<form class="sheet" id="nameform" data-mode="${mode}" data-ref="${esc(ref)}" autocomplete="off">
    <h2>${mode === 'breed' ? `Ponle nombre a la cría de ${item.name.toLowerCase()}` : isBuy ? `Ponle nombre a tu ${item.name.toLowerCase()}` : `Nuevo nombre para ${esc(pet.name)}`}</h2>
    <div class="field"><label for="pname">Nombre</label><input id="pname" type="text" maxlength="20" required value="${isBuy ? '' : esc(pet.name)}" /></div>
    ${mode === 'buy' ? `<p class="muted">Cuesta ${plural(item.price, 'moneda', 'monedas')}.</p>` : mode === 'breed' ? '<p class="muted">Es gratis, ¡y puede salir con un color especial!</p>' : ''}
    <div class="actions"><button type="button" class="btn grow" data-act="sheet-close">Cancelar</button><button class="btn primary grow">${mode === 'breed' ? 'Criar' : isBuy ? 'Comprar' : 'Guardar'}</button></div></form>`;
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
  play('buy');
  const logros = await afterChange();
  if (isPet(itemId)) {
    houseMsg = `¡Hola, ${name.trim()}! Bienvenid${MOOD_TEXT[item.id]?.f ? 'a' : 'o'} a casa.`;
    hopUid = res.uid;
    room = roomOf(itemId);
    await go('casa');
    setTimeout(() => (hopUid = null), 1200);
  } else {
    toast(item.cat === 'ropa' ? `Has comprado: ${item.name}. Póntela en el Armario (en Casa).` : item.id === 'jardin' ? '¡Jardín desbloqueado! Míralo en Casa.' : item.id === 'estudio' ? '¡Estudio desbloqueado! Míralo en Casa.' : `Has comprado: ${item.name}`);
    void logros;
    render();
  }
}

/** El personaje interactúa con una mascota al tocarla: la calma si está enfadada; si no, le hace caso. */
async function interact(uid) {
  const p = doc().inventory.find((i) => i.uid === uid);
  if (!p) return;
  room = roomOf(p.itemId);
  hopUid = uid;
  if (p.mood === 'angry') {
    await store.update((d) => calmPet(d, uid));
    const now = doc().inventory.find((i) => i.uid === uid);
    houseMsg = isPlant(p.itemId) ? `Cuidas a ${p.name} con mimo: ¡se le ha levantado el ánimo!` : `Acaricias a ${p.name} y le hablas con cariño… ¡ya está contento otra vez!`;
    if (now.mess > 0) houseMsg += ' Aún queda algo por limpiar.';
  } else if (p.mess > 0) houseMsg = `${p.name} ${MOOD_TEXT[p.itemId].mess}. ¡Toca la suciedad para limpiarla!`;
  else houseMsg = soundLine(p.itemId, p.name);
  view = 'casa';
  render();
  setTimeout(() => (hopUid = null), 1200);
  await afterChange();
}

/** El personaje limpia la caca (o suciedad) de una mascota. */
async function cleanUp(uid) {
  const p = doc().inventory.find((i) => i.uid === uid);
  if (!p) return;
  room = roomOf(p.itemId);
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
  room = roomOf(p.itemId);
  const v = await store.update((d) => collectCoin(d, uid));
  if (!v) return;
  play('coin');
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
  play('box');
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
  const titles = temas.flatMap((t) => (t.grupos ?? []).map((g) => g.id));
  await store.update((d) => ensureFirstUse(d, Date.now()));
  const fresh = await store.update((d) => ensureMissions(d, Date.now(), titles.length ? titles : undefined));
  const r = await store.update((d) => claimDaily(d, Date.now()));
  if (!r) {
    if (fresh) render();
    return;
  }
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
      return `<button class="card topic" data-act="quiz" data-t="${esc(t.id)}"><span class="t-name">${esc(t.nombre)}</span><span class="muted">${esc(t.descripcion)}</span><span class="t-info">${info}</span></button>`;
    })
    .join('');
  return `<p class="muted lead">Elige un tema. Cada acierto te da una moneda; con 3 seguidas ganas 1 extra y con 10 seguidas, 2 extra. Además hace crecer a tus mascotas.</p>${cards || '<p class="empty"><b>Sin temas</b>No se han podido cargar los temas.</p>'}${studyModes()}`;
}

function studyModes() {
  const d = doc();
  const tema = temas.find((t) => t.id === activeTema) ?? temas[0];
  const qs = allQuestions().filter((q) => q.tema === tema?.id);
  const failed = qs.filter((q) => (d.progress[q.id]?.ko ?? 0) > 0 && (d.progress[q.id]?.box ?? 0) <= 2).length;
  const last = d.exams.at(-1);
  const grupos = tema?.grupos ?? TITLE_INFO;
  const selector = temas.length > 1 ? `<div class="seg full" role="group" aria-label="Tema de estudio">${temas.map((t) => `<button data-act="tema" data-id="${esc(t.id)}" aria-pressed="${t.id === tema.id}">${esc(t.nombre)}</button>`).join('')}</div>` : '';
  return `<h2 class="section-title">Modos de estudio${temas.length > 1 ? ` · ${esc(tema.nombre)}` : ''}</h2>${selector}
    <button class="card topic" data-act="quiz-failed" data-testid="mode-failed"><span class="t-name">Repasar falladas</span><span class="muted">Solo las preguntas que más se te resisten.</span><span class="t-info">${failed} para repasar</span></button>
    <section class="card"><h3>Estudiar un grupo</h3><div class="field"><select id="titulo-select" aria-label="Grupo">${grupos.map((t) => `<option value="${esc(t.id)}">${esc(t.short)} · ${esc(t.desc)}</option>`).join('')}</select></div><button class="btn block" data-act="quiz-titulo" data-testid="mode-titulo">Empezar</button></section>
    <button class="card topic" data-act="go" data-v="examen" data-testid="mode-exam"><span class="t-name">Modo examen</span><span class="muted">Con tiempo, sin pistas y con nota sobre 10.</span><span class="t-info">${last ? `Último: ${String(last.score).replace('.', ',')} sobre 10` : 'Aún no has hecho ninguno'}</span></button>
    <button class="card topic" data-act="cards-start" data-testid="mode-cards"><span class="t-name">Tarjetas de artículos</span><span class="muted">Lee el texto oficial de los artículos donde más fallas.</span><span class="t-info">Mazo de 10</span></button>
    <button class="card topic" data-act="go" data-v="juegos" data-testid="mode-games"><span class="t-name">Minijuegos</span><span class="muted">Emparejar y verdadero o falso, para descansar.</span><span class="t-info">Con premio hasta 3 veces al día</span></button>`;
}

async function startQuiz(id, filter = null) {
  const tema = temas.find((t) => t.id === id);
  if (!tema) return;
  try {
    banks[id] ??= await (await fetch(tema.archivo)).json();
  } catch {
    toast('No se han podido cargar las preguntas. Comprueba la conexión.');
    return;
  }
  quiz = { tema, bank: banks[id], filter, recent: [], session: { ok: 0, total: 0 }, q: null, order: [], picked: null, result: null, hidden: new Set() };
  if (!nextQuestion()) {
    quiz = null;
    toast(filter?.type === 'failed' ? 'No tienes preguntas falladas pendientes: ¡enhorabuena!' : 'No hay preguntas para ese Título.');
    return;
  }
  view = 'quiz';
  render();
  window.scrollTo(0, 0);
}

/** Preguntas del test en curso (todas, las falladas o las de un Título). */
function quizPool() {
  const f = quiz.filter;
  const d = doc();
  if (!f) return quiz.bank;
  if (f.type === 'titulo') return quiz.bank.filter((q) => q.titulo === f.titulo);
  return quiz.bank.filter((q) => (d.progress[q.id]?.ko ?? 0) > 0 && (d.progress[q.id]?.box ?? 0) <= 2);
}

function nextQuestion() {
  const pool = quizPool();
  if (!pool.length) return false;
  const q = pickNext(pool, doc().progress, { now: Date.now(), seq: doc().stats.answered, recent: quiz.recent });
  quiz.q = q;
  quiz.order = shuffle([0, 1, 2, 3]);
  quiz.picked = null;
  quiz.result = null;
  quiz.hidden = new Set();
  quiz.recent.push(q.id);
  return true;
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
    feedback = `<div class="feedback ${result.correct ? 'ok' : 'ko'}" role="status"><p class="verdict">${result.correct ? '¡Correcto!' : 'Incorrecta'} ${coins}</p><p>${esc(q.explicacion)}</p>${grown}${found}${bad}${result.goalBonus ? `<p class="grown" data-testid="goal-bonus">¡Objetivo del día cumplido! +${plural(result.goalBonus, 'moneda', 'monedas')}</p>` : ''}<div class="actions"><button class="btn small" data-act="flag" data-id="${esc(q.id)}" data-testid="flag" aria-pressed="${Boolean(d.flagged[q.id])}">${d.flagged[q.id] ? '★ Dudosa' : '☆ Dudosa'}</button><button class="btn grow" data-act="article" data-t="${esc(q.tema)}" data-n="${esc(q.articulo.split('.')[0])}" data-testid="see-article">Ver artículo</button><button class="btn primary grow" data-act="next">Siguiente</button></div></div>`;
  }
  const jokerOff = picked !== null || hidden.size > 0 || !isAvailable(d, Date.now());
  return `
    <div class="quiz-bar"><button class="btn small" data-act="go" data-v="preguntas">Salir</button>
      ${quiz.filter ? `<span class="chip-stat">${quiz.filter.type === 'failed' ? 'Falladas' : esc(quiz.filter.titulo)}</span>` : ''}
      <span class="chip-stat" data-testid="streak">Racha <b>${d.streak.current}</b></span>
      <span class="chip-stat">Sesión <b>${quiz.session.ok}/${quiz.session.total}</b></span></div>
    <article class="card question"><p class="ref">${esc(q.titulo)} · Art. ${esc(q.articulo)}</p><h2 data-testid="question">${esc(q.enunciado)}</h2><div class="opts">${opts}</div>
      <button class="btn small joker" data-act="joker" ${jokerOff ? 'disabled' : ''}>${jokerLabel()}</button></article>
    ${feedback}`;
}

async function answer(pos) {
  if (!quiz || quiz.picked !== null) return;
  const current = quiz;
  const orig = quiz.order[pos];
  const correct = orig === quiz.q.correcta;
  quiz.picked = orig;
  const result = await store.update((dd) => applyAnswer(dd, current.q, correct, Date.now()));
  if (quiz !== current) {
    await afterChange(); // saliste del test mientras se guardaba: el acierto ya está guardado
    return;
  }
  quiz.result = result;
  play(correct ? 'right' : 'wrong');
  if (quiz.result.grown.length) setTimeout(() => play('grow'), 400);
  if (quiz.result.found.length) setTimeout(() => play('coin'), 400);
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
    ${d.exams.length ? `<section class="card" data-testid="exam-stats"><h3>Exámenes</h3><div class="kpis"><div><b>${d.exams.length}</b><span>hechos</span></div><div><b>${String(Math.round((d.exams.reduce((a, e) => a + e.score, 0) / d.exams.length) * 100) / 100).replace('.', ',')}</b><span>nota media</span></div><div><b>${String(Math.max(...d.exams.map((e) => e.score))).replace('.', ',')}</b><span>mejor nota</span></div></div></section>` : ''}
    ${examChart(d.exams)}
    ${weeklyChart(weeklyAccuracy(d, Date.now(), 8))}
    <section class="card" data-testid="mastery"><h3>Dominio por Título</h3>${masteryByGroup(d, questions).map((g) => `<div class="bar-row"><span>${esc(g.titulo)} <small>(${g.mastered}/${g.total})</small></span><span class="bar"><i style="width:${g.pct}%"></i></span><b>${g.pct}%</b></div>`).join('')}<p class="muted">Dominada = 5 aciertos seguidos en esa pregunta.</p></section>
    <section class="card"><h3>Dónde fallas más (por Título)</h3>
      ${titles.map((x) => `<div class="bar-row"><span>${esc(x.t)} <small>(${x.n})</small></span><span class="bar"><i style="width:${x.pct}%"></i></span><b>${x.pct}%</b></div>`).join('')}
      <p class="muted">Ordenado de menos a más aciertos.</p></section>
    ${arts.length ? `<section class="card"><h3>Artículos con más fallos</h3>${arts.map((a) => `<button class="line link" data-testid="art-row" data-act="article" data-t="${esc(a.tema)}" data-n="${esc(a.articulo)}"><span><b>Art. ${esc(a.articulo)}</b> <small>${esc(a.titulo)}</small></span><span><b>${a.pct}%</b> <small class="muted">${a.ok} ✓ · ${a.ko} ✗</small></span></button>`).join('')}</section>` : ''}
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
    <section class="card" data-testid="goal-settings"><h3>Objetivo de estudio</h3>
      <div class="field"><label for="exam-date">Fecha de tu examen</label><input id="exam-date" type="date" value="${esc(d.goal.examDate)}" /></div>
      <div class="field"><label for="daily-goal">Preguntas al día</label><input id="daily-goal" type="number" min="1" max="500" value="${d.goal.daily}" inputmode="numeric" /></div>
      <button class="btn" data-act="save-goal">Guardar objetivo</button></section>
    <section class="card"><h3>Accesibilidad y temporadas</h3><div class="field"><span class="lbl">Tamaño del texto</span><div class="seg" role="group" aria-label="Tamaño del texto">
      ${[['normal', 'Normal'], ['large', 'Grande'], ['xlarge', 'Muy grande']].map(([v, l]) => `<button data-act="font" data-v="${v}" aria-pressed="${d.settings.fontScale === v}">${l}</button>`).join('')}</div></div>
      <div class="actions"><button class="btn" data-act="calm" aria-pressed="${d.settings.calm}">Menos movimiento: ${d.settings.calm ? 'sí' : 'no'}</button><button class="btn" data-act="season" aria-pressed="${d.settings.season !== 'off'}">Decoración de temporada: ${d.settings.season === 'off' ? 'no' : 'sí'}</button><button class="btn" data-act="sound" data-testid="sound-toggle" aria-pressed="${d.settings.sound}">Sonidos: ${d.settings.sound ? 'sí' : 'no'}</button></div></section>
    <section class="card"><h3>Copia de seguridad</h3><p>Tus datos solo viven en este dispositivo. Guarda una copia de vez en cuando. Para pasar tu progreso a otro móvil: «Copiar código» aquí, y «Pegar código» allí.</p>
      <p class="muted" data-testid="backup-info">${backupInfoText(d)}</p>
      <div class="actions"><button class="btn" data-act="copy-code" data-testid="copy-code">Copiar código</button><button class="btn" data-act="paste-code" data-testid="paste-code">Pegar código</button><button class="btn" data-act="list-backups" data-testid="list-backups">Copias automáticas</button><button class="btn" data-act="export">Exportar</button><label class="btn file">Importar<input type="file" accept="application/json,.json" data-act="import" hidden /></label></div></section>
    <section class="card" data-testid="flag-settings"><h3>Preguntas dudosas</h3>
      <p>Tienes <b data-testid="flag-count">${Object.keys(d.flagged).length}</b> marcadas. Márcalas con «☆ Dudosa» al responder y envíame el informe para revisarlas contra el texto oficial.</p>
      <div class="actions"><button class="btn" data-act="flag-copy" data-testid="flag-copy">Copiar informe</button><button class="btn" data-act="flag-download">Descargar</button><button class="btn danger" data-act="flag-clear">Vaciar</button></div></section>
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
    if (act === 'cards-start') {
      await go('tarjetas');
      await study.startCards(activeTema);
      return;
    }
    if (await study.onAct(act, el)) return;
    if (act === 'go') await go(el.dataset.v);
    else if (act === 'room') {
      room = el.dataset.r;
      render();
    } else if (act === 'share') await shareHouse();
    else if (act === 'tema') {
      activeTema = el.dataset.id;
      render();
    } else if (act === 'reload') {
      location.reload();
    } else if (act === 'sound') {
      await store.update((d) => {
        d.settings.sound = !d.settings.sound;
      });
      applyTheme();
      play('coin');
      render();
    } else if (act === 'flag') await flagQuestion(el.dataset.id);
    else if (act === 'flag-copy') await copyFlags();
    else if (act === 'flag-download') downloadFlags();
    else if (act === 'flag-clear') {
      await store.update((d) => clearFlags(d));
      toast('Marcas borradas.');
      render();
    } else if (act === 'list-backups') await showBackups();
    else if (act === 'restore-ask') askRestore(el.dataset.key);
    else if (act === 'restore-do') await doRestore(el.dataset.key);
    else if (act === 'breed') askName('breed', el.dataset.sp);
    else if (act === 'quiz-failed') await startQuiz(activeTema, { type: 'failed' });
    else if (act === 'quiz-titulo') await startQuiz(activeTema, { type: 'titulo', titulo: document.getElementById('titulo-select').value });
    else if (act === 'save-goal') {
      const date = document.getElementById('exam-date').value;
      const daily = Math.min(500, Math.max(1, Math.round(Number(document.getElementById('daily-goal').value)) || 20));
      await store.update((d) => {
        d.goal.examDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '';
        d.goal.daily = daily;
      });
      toast('Objetivo guardado.');
      render();
    } else if (act === 'font' || act === 'calm' || act === 'season') {
      await store.update((d) => {
        if (act === 'font') d.settings.fontScale = el.dataset.v;
        else if (act === 'calm') d.settings.calm = !d.settings.calm;
        else d.settings.season = d.settings.season === 'off' ? 'auto' : 'off';
      });
      applyTheme();
      render();
    } else if (act === 'copy-code') await copyCode();
    else if (act === 'paste-code') pasteCodeSheet();
    else if (act === 'do-paste') await doPaste();
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
      if (!nextQuestion()) {
        toast('¡Has repasado todo lo pendiente!');
        await go('preguntas');
        return;
      }
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
    } else if (act === 'export') await exportData();
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
  if (file.size > 5_000_000) {
    toast('El fichero es demasiado grande para ser una copia de Oposiciones.');
    return;
  }
  try {
    await store.importJson(await file.text());
    applyTheme();
    view = 'casa';
    render();
    await checkDaily();
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
    await store.update((d) => ensureFirstUse(d, Date.now()));
    view = 'casa';
    render();
  } else if (e.target.id === 'nameform') {
    e.preventDefault();
    const f = e.target;
    if (f.dataset.busy) return; // evita el doble envío (doble toque / doble Enter)
    f.dataset.busy = '1';
    const name = document.getElementById('pname').value;
    if (f.dataset.mode === 'buy') await buyItem(f.dataset.ref, name);
    else if (f.dataset.mode === 'breed') {
      try {
        const res = await store.update((d) => breed(d, f.dataset.ref, name, Date.now()));
        document.querySelector('.overlay')?.remove();
        room = roomOf(f.dataset.ref);
        hopUid = res.uid;
        houseMsg = res.variant ? `¡Ha nacido ${name.trim()} con un color especial (${{ azul: 'azul', dorado: 'dorado', arcoiris: 'arcoíris' }[res.variant]})! ✨` : `¡Ha nacido ${name.trim()}! Qué ternura.`;
        await go('casa');
        setTimeout(() => (hopUid = null), 1200);
        await afterChange();
      } catch (err) {
        toast(err.message);
      }
    } else {
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

async function exportData() {
  const blob = new Blob([store.exportJson()], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `oposiciones-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  await store.update((d) => markBackup(d, Date.now()));
  toast('Copia guardada.');
  render();
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

/** Dibuja la habitación actual en un canvas y devuelve el PNG (para compartir). */
async function buildHouseBlob() {
  const d = doc();
  const opts = { gender: d.profile.gender, inventory: d.inventory, night: isNight(), lampOff: Boolean(d.flags.lampOff), outfit: d.outfit, season: currentSeason() };
  const svg = roomSvg(opts);
  const cs = getComputedStyle(document.documentElement);
  const vars = Object.fromEntries(SHARE_VARS.map((n) => [n, cs.getPropertyValue(`--${n}`).trim()]));
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject(new Error('No se ha podido dibujar la imagen.'));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(inlineSceneStyles(svg, vars))}`;
  });
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 900;
  const g = canvas.getContext('2d');
  g.drawImage(img, 0, 0, 1080, 900);
  g.fillStyle = 'rgba(0,0,0,0.5)';
  g.fillRect(0, 846, 1080, 54);
  g.fillStyle = '#fff';
  g.font = 'bold 28px sans-serif';
  g.fillText(`Casa de ${d.profile.name} · Oposiciones`, 24, 882);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

async function shareHouse() {
  let blob;
  try {
    blob = await buildHouseBlob();
  } catch (e) {
    toast(e.message);
    return;
  }
  const file = new File([blob], 'mi-casa-oposiciones.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Mi casa en Oposiciones' });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'mi-casa-oposiciones.png';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('Imagen guardada.');
}

async function copyCode() {
  const code = encodeCode(store.exportJson());
  await store.update((d) => markBackup(d, Date.now()));
  try {
    await navigator.clipboard.writeText(code);
    toast('Código copiado. Pégalo en el otro dispositivo (Ajustes → Pegar código).');
  } catch {
    pasteCodeSheet(code); // sin permiso de portapapeles: se muestra para copiarlo a mano
  }
}

function pasteCodeSheet(prefill = '') {
  document.querySelector('.overlay')?.remove();
  const el = document.createElement('div');
  el.className = 'overlay';
  el.innerHTML = `<div class="sheet"><h2>${prefill ? 'Tu código' : 'Pegar código'}</h2><p class="muted">${prefill ? 'Selecciona todo y cópialo.' : 'Pega aquí el código copiado en el otro dispositivo. Sustituirá tus datos actuales (se guarda antes una copia).'}</p>
    <textarea id="code-text" rows="6" spellcheck="false" aria-label="Código">${esc(prefill)}</textarea>
    <div class="actions"><button type="button" class="btn grow" data-act="sheet-close">Cerrar</button>${prefill ? '' : '<button type="button" class="btn primary grow" data-act="do-paste" data-testid="do-paste">Importar</button>'}</div></div>`;
  document.body.append(el);
  el.querySelector('textarea').focus();
}

async function doPaste() {
  try {
    await store.importJson(decodeCode(document.getElementById('code-text').value));
    document.querySelector('.overlay')?.remove();
    applyTheme();
    view = 'casa';
    render();
    await checkDaily();
    toast('Datos importados desde el código.');
  } catch (e) {
    toast(e.message);
  }
}

/* ---------- Avisos dentro de la app ---------- */
function viewAvisos() {
  const list = buildNotices(doc(), Date.now());
  if (!list.length) return '<p class="empty" data-testid="no-notices"><b>Todo al día</b>No tienes nada pendiente. ¡Buen trabajo!</p>';
  return `<ul class="notices" data-testid="notices">${list.map((n) => `<li class="notice ${n.level}" data-testid="notice-${n.id}"><span>${esc(n.text)}</span><button class="btn small ${n.level === 'warn' ? 'primary' : ''}" data-act="go" data-v="${n.view}">${esc(n.label)}</button></li>`).join('')}</ul>
    <p class="muted center">Los avisos se calculan al abrir la app; no se envían notificaciones del sistema.</p>`;
}

/* ---------- Gráficos de estadísticas ---------- */
function examChart(exams) {
  if (exams.length < 2) return '';
  const pts = exams.slice(-10);
  const W = 300;
  const H = 110;
  const pad = 10;
  const x = (i) => pad + (i * (W - 2 * pad)) / (pts.length - 1);
  const y = (score) => H - pad - (score / 10) * (H - 2 * pad);
  const line = pts.map((e, i) => `${x(i).toFixed(1)},${y(e.score).toFixed(1)}`).join(' ');
  const dots = pts.map((e, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(e.score).toFixed(1)}" r="3.6" class="dot ${e.score >= 5 ? 'pass' : 'fail'}"><title>${String(e.score).replace('.', ',')}</title></circle>`).join('');
  return `<section class="card" data-testid="exam-chart"><h3>Evolución de tus exámenes</h3><svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Notas de tus últimos exámenes"><line x1="${pad}" x2="${W - pad}" y1="${y(5)}" y2="${y(5)}" class="pass-line"/><polyline points="${line}" class="chart-line"/>${dots}</svg>
    <p class="muted">La línea discontinua es el aprobado (5). Últimos ${pts.length} exámenes.</p></section>`;
}

function weeklyChart(weeks) {
  if (!weeks.some((w) => w.n)) return '';
  return `<section class="card" data-testid="weekly-chart"><h3>Precisión por semana</h3><div class="weekbars">${weeks
    .map((w) => `<div class="wk"><span class="col"><i style="height:${w.pct ?? 0}%"></i></span><b>${w.pct === null ? '–' : `${w.pct}%`}</b><small>${w.start.slice(8)}/${w.start.slice(5, 7)}</small></div>`)
    .join('')}</div><p class="muted">Porcentaje de aciertos de cada semana (se indica el lunes en que empieza).</p></section>`;
}

/* ---------- Copias de seguridad ---------- */
function backupInfoText(d) {
  const days = daysSinceBackup(d, Date.now());
  if (days === null) return 'Aún no has guardado ninguna copia.';
  const base = d.meta.lastExport ? `Última copia guardada hace ${plural(days, 'día', 'días')}.` : `Llevas ${plural(days, 'día', 'días')} sin guardar una copia.`;
  return backupDue(d, Date.now()) ? `${base} ¡Toca guardar una!` : base;
}

async function showBackups() {
  const list = await store.listBackups();
  document.querySelector('.overlay')?.remove();
  const el = document.createElement('div');
  el.className = 'overlay';
  el.innerHTML = `<div class="sheet" data-testid="backups"><h2>Copias automáticas</h2>
    <p class="muted">Se guardan en este dispositivo (las últimas 7). Restaurar sustituye tus datos actuales; antes se guarda otra copia por si te arrepientes.</p>
    ${list.length ? `<ul class="backups">${list.map((b) => `<li class="line" data-testid="backup-row"><span>${esc(new Date(b.createdAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }))}<br><small class="muted">${esc(reasonLabel(b.reason))} · ${plural(b.coins, 'moneda', 'monedas')}</small></span><button class="btn small" data-act="restore-ask" data-key="${esc(b.key)}">Restaurar</button></li>`).join('')}</ul>` : '<p class="empty">Todavía no hay copias automáticas.</p>'}
    <button class="btn block" data-act="sheet-close">Cerrar</button></div>`;
  document.body.append(el);
}

function askRestore(key) {
  document.querySelector('.overlay')?.remove();
  const el = document.createElement('div');
  el.className = 'overlay';
  el.innerHTML = `<div class="sheet" data-testid="restore-confirm"><h2>¿Restaurar esta copia?</h2><p>Tus datos actuales se sustituirán por los de esa copia. Antes se guarda otra copia de lo actual.</p>
    <div class="actions"><button class="btn grow" data-act="sheet-close">Cancelar</button><button class="btn danger grow" data-act="restore-do" data-key="${esc(key)}" data-testid="restore-do">Sí, restaurar</button></div></div>`;
  document.body.append(el);
}

async function doRestore(key) {
  try {
    await store.restoreBackup(key);
  } catch (e) {
    toast(e.message);
    return;
  }
  document.querySelector('.overlay')?.remove();
  applyTheme();
  view = 'casa';
  render();
  await checkDaily();
  toast('Copia restaurada.');
}

/* ---------- Preguntas dudosas ---------- */
async function flagQuestion(id) {
  let on = false;
  await store.update((d) => {
    on = toggleFlag(d, id, Date.now());
  });
  toast(on ? 'Pregunta marcada como dudosa.' : 'Marca quitada.');
  render();
}

async function copyFlags() {
  const text = flaggedReport(doc(), allQuestions());
  try {
    await navigator.clipboard.writeText(text);
    toast('Informe copiado. Pégalo donde quieras enviármelo.');
  } catch {
    document.querySelector('.overlay')?.remove();
    const el = document.createElement('div');
    el.className = 'overlay';
    el.innerHTML = `<div class="sheet"><h2>Informe de preguntas dudosas</h2><p class="muted">Selecciona todo y cópialo.</p><textarea id="code-text" rows="10" spellcheck="false" aria-label="Informe">${esc(text)}</textarea><button class="btn block" data-act="sheet-close">Cerrar</button></div>`;
    document.body.append(el);
    el.querySelector('textarea').focus();
  }
}

function downloadFlags() {
  const blob = new Blob([flaggedReport(doc(), allQuestions())], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'preguntas-dudosas.txt';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------- Diálogos accesibles: rol, Escape y devolución del foco ---------- */
let lastFocus = null;
new MutationObserver((mutations) => {
  for (const m of mutations) {
    for (const node of m.addedNodes) {
      if (node.nodeType !== 1 || !node.classList?.contains('overlay')) continue;
      lastFocus = document.activeElement;
      const sheet = node.querySelector('.sheet') ?? node;
      sheet.setAttribute('role', 'dialog');
      sheet.setAttribute('aria-modal', 'true');
      const title = sheet.querySelector('h2');
      if (title) sheet.setAttribute('aria-label', title.textContent);
    }
    for (const node of m.removedNodes) {
      if (node.nodeType === 1 && node.classList?.contains('overlay') && !document.querySelector('.overlay') && lastFocus?.isConnected) lastFocus.focus?.();
    }
  }
}).observe(document.body, { childList: true });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') document.querySelector('.overlay')?.remove();
});

boot();
