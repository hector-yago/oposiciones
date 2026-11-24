// Versionado del esquema de datos. REGLAS (ver docs/datos-y-migraciones.md):
//  - Nunca se edita una migración ya publicada; se añade una nueva (N → N+1) y se sube CURRENT_SCHEMA.
//  - Cada migración es pura e idempotente y NO elimina datos del usuario.
//  - Antes de migrar, el almacén guarda una copia del documento original (store.js).
//  - Cada versión publicada deja un fixture en tests/fixtures/ y un test que lo migra a la actual.
export const CURRENT_SCHEMA = 2;
export const APP_ID = 'oposiciones';
export const MAX_DAYS = 120; // días de historial que se conservan
export const NAME_MAX = 20;
export const MAX_MESS = 3; // cacas/suciedad máxima acumulada por mascota

export const DEFAULT_SETTINGS = Object.freeze({ theme: 'system', sceneMode: 'auto' }); // theme: 'system' | 'light' | 'dark'; sceneMode: 'auto' | 'day' | 'night'

export function emptyDoc() {
  return {
    schemaVersion: CURRENT_SCHEMA,
    profile: null, // { name, gender: 'chico' | 'chica' }
    coins: 0,
    streak: { current: 0, best: 0, tens: 0, wrong: 0 }, // tens = rachas de 10 completadas; wrong = fallos seguidos
    progress: {}, // [questionId]: { box, ok, ko, last, due, failedSeq }
    stats: { answered: 0, correct: 0, earned: 0, byTitle: {}, byDay: {}, care: { cleaned: 0, calmed: 0, coins: 0 } }, // byDay[AAAA-MM-DD] = { n, ok }
    inventory: [], // [{ uid, itemId, name, xp, boughtAt, mood, mess, joy, coin }]  (mascotas con nombre, xp y estado; objetos sin xp)
    nextUid: 1,
    joker: { lastUsed: 0, uses: 0 }, // comodín 50 %: 1 uso cada 4 h
    daily: { last: '', streak: 0, boxes: 0, opened: 0 }, // bonus diario: día de la última entrada, racha de días, cajas sin abrir
    achievements: {}, // [id]: timestamp de desbloqueo
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
const isDay = (k) => /^\d{4}-\d{2}-\d{2}$/.test(k);
const obj = (o) => (o && typeof o === 'object' && !Array.isArray(o) ? o : {});

/** Normaliza y descarta lo irrecuperable, sin tocar lo válido. Se aplica también a las importaciones. */
export function sanitize(doc) {
  const name = String(doc.profile?.name ?? '').trim().slice(0, 30);
  const gender = doc.profile?.gender === 'chica' ? 'chica' : doc.profile?.gender === 'chico' ? 'chico' : null;
  const profile = name && gender ? { name, gender } : null;

  const progress = {};
  for (const [id, p] of Object.entries(obj(doc.progress))) {
    if (!id || !p || typeof p !== 'object') continue;
    progress[id] = { box: Math.min(5, nat(p.box)), ok: nat(p.ok), ko: nat(p.ko), last: time(p.last), due: time(p.due), failedSeq: nat(p.failedSeq) };
  }

  const byTitle = {};
  for (const [t, v] of Object.entries(obj(doc.stats?.byTitle))) byTitle[t] = { ok: nat(v?.ok), ko: nat(v?.ko) };
  const byDay = {};
  for (const [k, v] of Object.entries(obj(doc.stats?.byDay))) if (isDay(k)) byDay[k] = { n: nat(v?.n), ok: Math.min(nat(v?.ok), nat(v?.n)) };
  for (const k of Object.keys(byDay).sort().slice(0, -MAX_DAYS)) delete byDay[k];

  const seen = new Set();
  const inventory = [];
  let maxUid = 0;
  for (const it of Array.isArray(doc.inventory) ? doc.inventory : []) {
    if (!it || typeof it.itemId !== 'string' || !Number.isInteger(it.uid) || it.uid < 1 || seen.has(it.uid)) continue;
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
    });
  }

  const flags = {};
  for (const [k, v] of Object.entries(obj(doc.flags))) flags[k] = Boolean(v);
  const achievements = {};
  for (const [k, v] of Object.entries(obj(doc.achievements))) if (Number.isFinite(v)) achievements[k] = v;

  const settings = { ...DEFAULT_SETTINGS, ...obj(doc.settings) };
  if (!['system', 'light', 'dark'].includes(settings.theme)) settings.theme = 'system';
  if (!['auto', 'day', 'night'].includes(settings.sceneMode)) settings.sceneMode = 'auto';
  const meta = {};
  for (const k of ['lastExport', 'lastAutoBackup']) if (Number.isFinite(doc.meta?.[k])) meta[k] = doc.meta[k];

  const current = nat(doc.streak?.current);
  const coins = nat(doc.coins);
  return {
    schemaVersion: CURRENT_SCHEMA,
    profile,
    coins,
    streak: { current, best: Math.max(current, nat(doc.streak?.best)), tens: nat(doc.streak?.tens), wrong: nat(doc.streak?.wrong) },
    progress,
    stats: { answered: nat(doc.stats?.answered), correct: nat(doc.stats?.correct), earned: Math.max(nat(doc.stats?.earned), coins),
      byTitle,
      byDay,
      care: { cleaned: nat(doc.stats?.care?.cleaned), calmed: nat(doc.stats?.care?.calmed), coins: nat(doc.stats?.care?.coins) },
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
    flags,
    settings,
    meta,
  };
}
