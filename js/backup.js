// Recordatorio de copia de seguridad. Sin sincronización, el progreso solo vive en el dispositivo: conviene avisar.
// Lógica pura (recibe «ahora»).
export const BACKUP_DUE_DAYS = 14;
const DAY_MS = 86400000;

/** Anota el primer uso (para contar los días hasta la primera copia). Devuelve true si cambió algo. */
export function ensureFirstUse(doc, nowMs) {
  if (!doc.profile || doc.meta.firstUse) return false;
  doc.meta.firstUse = nowMs;
  return true;
}

/** Días desde la última copia exportada (o desde el primer uso); null si no hay referencia. */
export function daysSinceBackup(doc, nowMs) {
  const base = doc.meta.lastExport ?? doc.meta.firstUse;
  return base ? Math.max(0, Math.floor((nowMs - base) / DAY_MS)) : null;
}

/** ¿Hay algo que perder? (no se avisa a quien acaba de empezar). */
export const hasProgress = (doc) => doc.stats.answered >= 20 || doc.inventory.length > 0 || doc.coins >= 10;

/** ¿Toca recordar la copia? */
export function backupDue(doc, nowMs) {
  if (!doc.profile || !hasProgress(doc)) return false;
  const d = daysSinceBackup(doc, nowMs);
  return d !== null && d >= BACKUP_DUE_DAYS;
}

/** Marca que se acaba de exportar (muta el borrador). */
export function markBackup(doc, nowMs) {
  doc.meta.lastExport = nowMs;
}

export const reasonLabel = (reason) =>
  ({
    'copia automática diaria': 'Copia automática',
    'antes de empezar de cero': 'Antes de empezar de cero',
    'antes de importar': 'Antes de importar datos',
    'antes de restaurar una copia': 'Antes de restaurar otra copia',
  })[reason] ?? reason;
