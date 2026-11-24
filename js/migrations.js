// Versionado del esquema de datos. REGLAS (ver docs/datos-y-migraciones.md):
//  - Nunca se edita una migración ya publicada; se añade una nueva (N → N+1) y se sube CURRENT_SCHEMA.
//  - Cada migración es pura e idempotente y NO elimina datos del usuario.
//  - Antes de migrar, el almacén guarda una copia del documento original (store.js).
//  - Cada versión publicada deja un fixture en tests/fixtures/ y un test que lo migra a la actual.
import { BY_ID } from './catalog.js';

export const CURRENT_SCHEMA = 4;
// Topes de tamaño al sanear (protegen de ficheros importados enormes o mal formados)
export const LIMITS = { inventory: 500, progress: 5000, byTitle: 200, achievements: 500, flags: 200, breed: 100, key: 80 };
export const MAX_FLAGGED = 500; // preguntas dudosas que se conservan
export const APP_ID = 'oposiciones';
export const MAX_DAYS = 120; // días de historial que se conservan
export const MAX_EXAMS = 30; // exámenes que se conservan
export const NAME_MAX = 20;
export const MAX_MESS = 3; // cacas/suciedad máxima acumulada por mascota
export const VARIANTS = ['azul', 'dorado', 'arcoiris']; // variantes raras de las crías
export const MISSION_TYPES = ['answer', 'correct', 'streak', 'titulo', 'care', 'game', 'exam', 'days'];
export const OUTFIT_SLOTS = ['hat', 'face', 'neck', 'top'];

export const DEFAULT_SETTINGS = Object.freeze({
  theme: 'system', // 'system' | 'light' | 'dark'
  sceneMode: 'auto', // 'auto' | 'day' | 'night'
  fontScale: 'normal', // 'normal' | 'large' | 'xlarge'
  calm: false, // reduce animaciones
  season: 'auto', // 'auto' (decoración de temporada) | 'off'
  sound: true, // efectos de sonido
});

export function emptyDoc() {
  return {
    schemaVersion: CURRENT_SCHEMA,
    profile: null, // { name, gender: 'chico' | 'chica' }
    coins: 0,
    streak: { current: 0, best: 0, tens: 0, wrong: 0 }, // tens = rachas de 10 completadas; wrong = fallos seguidos
    progress: {}, // [questionId]: { box, ok, ko, last, due, failedSeq }
    stats: { answered: 0, correct: 0, earned: 0, byTitle: {}, byDay: {}, care: { cleaned: 0, calmed: 0, coins: 0 }, games: 0, missions: 0 }, // byDay[AAAA-MM-DD] = { n, ok }
    inventory: [], // [{ uid, itemId, name, xp, boughtAt, mood, mess, joy, coin, variant }]  (mascotas con nombre, xp y estado; objetos sin xp)
    nextUid: 1,
    joker: { lastUsed: 0, uses: 0 }, // comodín 50 %: 1 uso cada 4 h
    daily: { last: '', streak: 0, boxes: 0, opened: 0 }, // bonus diario: día de la última entrada, racha de días, cajas sin abrir
    achievements: {}, // [id]: timestamp de desbloqueo
    exams: [], // [{ at, n, ok, ko, blank, score, secs }]
    missions: { day: '', daily: [], week: '', weekly: [] }, // [{ id, type, target, titulo, progress, reward, claimed }]
    outfit: { hat: '', face: '', neck: '', top: '' }, // ropa puesta (ids de objetos comprados)
    goal: { examDate: '', daily: 20, bonusDay: '' }, // fecha de examen, preguntas al día y último día con bonus
    minigames: { day: '', plays: 0 }, // partidas con premio hoy
    breed: {}, // [especie]: último momento de cría
    flagged: {}, // [questionId]: momento en que la marcaste como dudosa (para revisarla)
    flags: {}, // introSeen, shopSeen…
    settings: { ...DEFAULT_SETTINGS },
    meta: {},
  };
}

// Cada clave N convierte un documento de versión N en versión N+1.
const steps = {
  // 0 → 1: documento sin versión (p. ej. importado a mano). La normalización final hace el trabajo.
  0: (doc) => ({ ...doc, schemaVersion: 1 }),
  // 1 → 2: tienda, comodín, logros y estadísticas por día. Lo ya ganado cuenta como «ganado» (cota inferior).
  1: (doc) => ({
    ...doc,
    schemaVersion: 2,
    stats: { ...(doc.stats ?? {}), earned: Math.max(Number(doc.stats?.earned) || 0, Number(doc.coins) || 0), byDay: doc.stats?.byDay ?? {}, care: doc.stats?.care ?? {} },
    inventory: Array.isArray(doc.inventory) ? doc.inventory : [],
    nextUid: Number.isInteger(doc.nextUid) ? doc.nextUid : 1,
    joker: doc.joker ?? { lastUsed: 0, uses: 0 },
    daily: doc.daily ?? {},
    achievements: doc.achievements ?? {},
  }),
  // 2 → 3: exámenes, misiones, ropa, objetivo de estudio, minijuegos, crías y ajustes de accesibilidad (todo con valores por defecto).
  2: (doc) => ({
    ...doc,
    schemaVersion: 3,
    exams: Array.isArray(doc.exams) ? doc.exams : [],
    missions: doc.missions ?? {},
    outfit: doc.outfit ?? {},
    goal: doc.goal ?? {},
    minigames: doc.minigames ?? {},
    breed: doc.breed ?? {},
  }),
  // 3 → 4: preguntas dudosas, primer uso (recordatorio de copia) y ajuste de sonido (con valores por defecto).
  3: (doc) => ({ ...doc, schemaVersion: 4, flagged: doc.flagged ?? {} }),
};

export function migrate(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('El documento de datos no es válido.');
  let doc = { ...input };
  const from = Number.isInteger(doc.schemaVersion) ? doc.schemaVersion : 0;
  if (from > CURRENT_SCHEMA) {
    throw new Error(`Los datos son de una versión más nueva de la app (esquema ${from}). Actualiza la app antes de abrirlos.`);
  }
  doc.schemaVersion = from;
  for (let v = from; v < CURRENT_SCHEMA; v++) {
    if (!steps[v]) throw new Error(`Falta la migración del esquema ${v} al ${v + 1}.`);
    doc = steps[v](doc);
  }
  return { doc: sanitize(doc), from, to: CURRENT_SCHEMA };
}

const nat = (n) => (Number.isInteger(n) && n >= 0 ? n : 0);
const time = (n) => (Number.isFinite(n) && n >= 0 ? n : 0);
const num = (n) => (Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0);
const isDay = (k) => {
  if (typeof k !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(k)) return false;
  const [y, m, d] = k.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d; // fechas reales (no 2026-13-45)
};
const obj = (o) => (o && typeof o === 'object' && !Array.isArray(o) ? o : {});
/** Entradas de un objeto usado como mapa: sin `__proto__` y con claves de longitud razonable, hasta `max`. */
const entries = (o, max) => Object.entries(obj(o)).filter(([k]) => k && k !== '__proto__' && k.length <= LIMITS.key).slice(0, max);
const str = (s, max) => String(s ?? '').slice(0, max);

function sanitizeMissions(list) {
  const out = [];
  for (const m of Array.isArray(list) ? list.slice(0, 6) : []) {
    if (!m || typeof m.id !== 'string' || !MISSION_TYPES.includes(m.type)) continue;
    out.push({
      id: str(m.id, 40),
      type: m.type,
      target: Math.max(1, nat(m.target)),
      titulo: str(m.titulo, 40),
      progress: nat(m.progress),
      reward: nat(m.reward),
      claimed: Boolean(m.claimed),
    });
  }
  return out;
}

/** Normaliza y descarta lo irrecuperable, sin tocar lo válido. Se aplica también a las importaciones. */
export function sanitize(doc) {
  const name = String(doc.profile?.name ?? '').trim().slice(0, 30);
  const gender = doc.profile?.gender === 'chica' ? 'chica' : doc.profile?.gender === 'chico' ? 'chico' : null;
  const profile = name && gender ? { name, gender } : null;

  const progress = {};
  for (const [id, p] of entries(doc.progress, LIMITS.progress)) {
    if (!id || !p || typeof p !== 'object') continue;
    progress[id] = { box: Math.min(5, nat(p.box)), ok: nat(p.ok), ko: nat(p.ko), last: time(p.last), due: time(p.due), failedSeq: nat(p.failedSeq) };
  }

  const byTitle = {};
  for (const [t, v] of entries(doc.stats?.byTitle, LIMITS.byTitle)) byTitle[t] = { ok: nat(v?.ok), ko: nat(v?.ko) };
  const byDay = {};
  for (const [k, v] of entries(doc.stats?.byDay, MAX_DAYS * 3)) if (isDay(k)) byDay[k] = { n: nat(v?.n), ok: Math.min(nat(v?.ok), nat(v?.n)) };
  for (const k of Object.keys(byDay).sort().slice(0, -MAX_DAYS)) delete byDay[k];

  const seen = new Set();
  const inventory = [];
  let maxUid = 0;
  for (const it of (Array.isArray(doc.inventory) ? doc.inventory : []).slice(0, LIMITS.inventory)) {
    if (!it || typeof it.itemId !== 'string' || !Object.hasOwn(BY_ID, it.itemId) || !Number.isInteger(it.uid) || it.uid < 1 || seen.has(it.uid)) continue;
    seen.add(it.uid);
    maxUid = Math.max(maxUid, it.uid);
    inventory.push({
      uid: it.uid,
      itemId: it.itemId,
      name: String(it.name ?? '').trim().slice(0, NAME_MAX),
      xp: num(it.xp),
      boughtAt: time(it.boughtAt),
      mood: it.mood === 'angry' ? 'angry' : 'ok',
      mess: Math.min(MAX_MESS, nat(it.mess)),
      joy: Math.min(99, nat(it.joy)),
      coin: Boolean(it.coin),
      variant: VARIANTS.includes(it.variant) ? it.variant : '',
    });
  }

  const flags = {};
  for (const [k, v] of entries(doc.flags, LIMITS.flags)) flags[k] = Boolean(v);
  const achievements = {};
  for (const [k, v] of entries(doc.achievements, LIMITS.achievements)) if (Number.isFinite(v)) achievements[k] = v;

  const exams = [];
  for (const e of Array.isArray(doc.exams) ? doc.exams : []) {
    if (!e || !Number.isFinite(e.at) || nat(e.n) < 1) continue;
    exams.push({ at: e.at, n: nat(e.n), ok: nat(e.ok), ko: nat(e.ko), blank: nat(e.blank), score: Number.isFinite(e.score) ? Math.max(0, Math.min(10, Math.round(e.score * 100) / 100)) : 0, secs: nat(e.secs) });
  }

  const missions = obj(doc.missions);
  const ownedIds = new Set(inventory.map((i) => i.itemId));
  const outfit = {};
  for (const slot of OUTFIT_SLOTS) {
    const id = typeof doc.outfit?.[slot] === 'string' ? doc.outfit[slot] : '';
    outfit[slot] = ownedIds.has(id) ? id : ''; // solo ropa que realmente tienes
  }

  const settings = { ...DEFAULT_SETTINGS, ...obj(doc.settings) };
  if (!['system', 'light', 'dark'].includes(settings.theme)) settings.theme = 'system';
  if (!['auto', 'day', 'night'].includes(settings.sceneMode)) settings.sceneMode = 'auto';
  if (!['normal', 'large', 'xlarge'].includes(settings.fontScale)) settings.fontScale = 'normal';
  settings.calm = Boolean(settings.calm);
  settings.sound = settings.sound !== false;
  if (!['auto', 'off'].includes(settings.season)) settings.season = 'auto';
  const meta = {};
  for (const k of ['lastExport', 'lastAutoBackup', 'firstUse']) if (Number.isFinite(doc.meta?.[k])) meta[k] = doc.meta[k];

  const flagged = {};
  for (const [k, v] of entries(doc.flagged, MAX_FLAGGED * 2)) if (k.length <= 40 && Number.isFinite(v) && v > 0) flagged[k] = v;
  for (const k of Object.keys(flagged).sort((a, b) => flagged[a] - flagged[b]).slice(0, -MAX_FLAGGED)) delete flagged[k];
  const breed = {};
  for (const [k, v] of entries(doc.breed, LIMITS.breed)) if (Number.isFinite(v) && v >= 0) breed[k] = v;

  const current = nat(doc.streak?.current);
  const coins = nat(doc.coins);
  return {
    schemaVersion: CURRENT_SCHEMA,
    profile,
    coins,
    streak: { current, best: Math.max(current, nat(doc.streak?.best)), tens: nat(doc.streak?.tens), wrong: nat(doc.streak?.wrong) },
    progress,
    stats: {
      answered: nat(doc.stats?.answered),
      correct: nat(doc.stats?.correct),
      earned: Math.max(nat(doc.stats?.earned), coins),
      byTitle,
      byDay,
      care: { cleaned: nat(doc.stats?.care?.cleaned), calmed: nat(doc.stats?.care?.calmed), coins: nat(doc.stats?.care?.coins) },
      games: nat(doc.stats?.games),
      missions: nat(doc.stats?.missions),
    },
    inventory,
    nextUid: Math.max(nat(doc.nextUid), maxUid + 1, 1),
    joker: { lastUsed: time(doc.joker?.lastUsed), uses: nat(doc.joker?.uses) },
    daily: {
      last: isDay(doc.daily?.last) ? doc.daily.last : '',
      streak: nat(doc.daily?.streak),
      boxes: nat(doc.daily?.boxes),
      opened: nat(doc.daily?.opened),
    },
    achievements,
    exams: exams.slice(-MAX_EXAMS),
    missions: {
      day: isDay(missions.day) ? missions.day : '',
      daily: sanitizeMissions(missions.daily),
      week: typeof missions.week === 'string' && /^\d{4}-W\d{2}$/.test(missions.week) ? missions.week : '',
      weekly: sanitizeMissions(missions.weekly),
    },
    outfit,
    goal: {
      examDate: isDay(doc.goal?.examDate) ? doc.goal.examDate : '',
      daily: Math.min(500, Math.max(1, nat(Math.round(Number(doc.goal?.daily))) || 20)),
      bonusDay: isDay(doc.goal?.bonusDay) ? doc.goal.bonusDay : '',
    },
    minigames: { day: isDay(doc.minigames?.day) ? doc.minigames.day : '', plays: nat(doc.minigames?.plays) },
    breed,
    flagged,
    flags,
    settings,
    meta,
  };
}
