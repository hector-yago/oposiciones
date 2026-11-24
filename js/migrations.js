// Versionado del esquema de datos. REGLAS (ver docs/datos-y-migraciones.md):
//  - Nunca se edita una migración ya publicada; se añade una nueva (N → N+1) y se sube CURRENT_SCHEMA.
//  - Cada migración es pura e idempotente y NO elimina datos del usuario.
//  - Antes de migrar, el almacén guarda una copia del documento original (store.js).
//  - Cada versión publicada deja un fixture en tests/fixtures/ y un test que lo migra a la actual.
export const CURRENT_SCHEMA = 1;
export const APP_ID = 'oposiciones';

export const DEFAULT_SETTINGS = Object.freeze({ theme: 'system' }); // 'system' | 'light' | 'dark'

export function emptyDoc() {
  return {
    schemaVersion: CURRENT_SCHEMA,
    profile: null, // { name, gender: 'chico' | 'chica' }
    coins: 0,
    streak: { current: 0, best: 0 },
    progress: {}, // [questionId]: { box, ok, ko, last, due, failedSeq }
    stats: { answered: 0, correct: 0, byTitle: {} }, // byTitle[titulo] = { ok, ko }
    flags: {}, // introSeen, shopSeen…
    settings: { ...DEFAULT_SETTINGS },
    meta: {},
  };
}

// Cada clave N convierte un documento de versión N en versión N+1.
const steps = {
  // 0 → 1: documento sin versión (p. ej. importado a mano). La normalización final hace el trabajo.
  0: (doc) => ({ ...doc, schemaVersion: 1 }),
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

/** Normaliza y descarta lo irrecuperable, sin tocar lo válido. Se aplica también a las importaciones. */
export function sanitize(doc) {
  const name = String(doc.profile?.name ?? '').trim().slice(0, 30);
  const gender = doc.profile?.gender === 'chica' ? 'chica' : doc.profile?.gender === 'chico' ? 'chico' : null;
  const profile = name && gender ? { name, gender } : null;

  const progress = {};
  for (const [id, p] of Object.entries(doc.progress && typeof doc.progress === 'object' ? doc.progress : {})) {
    if (!id || !p || typeof p !== 'object') continue;
    progress[id] = {
      box: Math.min(5, nat(p.box)),
      ok: nat(p.ok),
      ko: nat(p.ko),
      last: time(p.last),
      due: time(p.due),
      failedSeq: nat(p.failedSeq),
    };
  }

  const byTitle = {};
  for (const [t, v] of Object.entries(doc.stats?.byTitle && typeof doc.stats.byTitle === 'object' ? doc.stats.byTitle : {})) {
    byTitle[t] = { ok: nat(v?.ok), ko: nat(v?.ko) };
  }
  const flags = {};
  for (const [k, v] of Object.entries(doc.flags && typeof doc.flags === 'object' ? doc.flags : {})) flags[k] = Boolean(v);

  const settings = { ...DEFAULT_SETTINGS, ...(doc.settings ?? {}) };
  if (!['system', 'light', 'dark'].includes(settings.theme)) settings.theme = 'system';
  const meta = {};
  for (const k of ['lastExport', 'lastAutoBackup']) if (Number.isFinite(doc.meta?.[k])) meta[k] = doc.meta[k];

  const current = nat(doc.streak?.current);
  return {
    schemaVersion: CURRENT_SCHEMA,
    profile,
    coins: nat(doc.coins),
    streak: { current, best: Math.max(current, nat(doc.streak?.best)) },
    progress,
    stats: { answered: nat(doc.stats?.answered), correct: nat(doc.stats?.correct), byTitle },
    flags,
    settings,
    meta,
  };
}
