// Centro de avisos dentro de la app (sin notificaciones del sistema ni servidor). Lógica pura: se calculan al abrir la app.
import { attention } from './shop.js';
import { isAvailable } from './joker.js';
import { daysToExam, todayCount } from './goal.js';
import { isDone } from './missions.js';
import { backupDue, daysSinceBackup } from './backup.js';

/** Preguntas ya aprendidas cuyo repaso ha vencido. */
export const dueCount = (doc, nowMs) => Object.values(doc.progress).filter((p) => p.box > 0 && p.due <= nowMs).length;

/**
 * Lista de avisos ordenada por prioridad.
 * @returns {{id:string, level:'warn'|'info', text:string, view:string, label:string}[]}
 */
export function buildNotices(doc, nowMs) {
  if (!doc.profile) return [];
  const out = [];
  const att = attention(doc);
  const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;

  if (att.angry + att.mess > 0) {
    out.push({ id: 'care', level: 'warn', text: `Tus mascotas necesitan atención: ${att.angry ? plural(att.angry, 'enfadada', 'enfadadas') : ''}${att.angry && att.mess ? ' y ' : ''}${att.mess ? plural(att.mess, 'suciedad por limpiar', 'suciedades por limpiar') : ''}.`, view: 'casa', label: 'Ir a casa' });
  }
  if (att.coins > 0) out.push({ id: 'petcoins', level: 'info', text: `${plural(att.coins, 'mascota ha encontrado una moneda', 'mascotas han encontrado una moneda')}: ¡cógela!`, view: 'casa', label: 'Cogerla' });
  if (att.boxes > 0) out.push({ id: 'box', level: 'info', text: `Tienes ${plural(att.boxes, 'caja misteriosa', 'cajas misteriosas')} sin abrir.`, view: 'casa', label: 'Abrir' });

  const claimable = [...doc.missions.daily, ...doc.missions.weekly].filter((m) => isDone(m) && !m.claimed).length;
  if (claimable > 0) out.push({ id: 'missions', level: 'info', text: `Tienes ${plural(claimable, 'misión lista', 'misiones listas')} para cobrar.`, view: 'casa', label: 'Cobrar' });

  const left = doc.goal.daily - todayCount(doc, nowMs);
  if (left > 0 && doc.stats.answered > 0) out.push({ id: 'goal', level: 'info', text: `${left === 1 ? 'Te falta' : 'Te faltan'} ${plural(left, 'pregunta', 'preguntas')} para cumplir tu objetivo de hoy (+2 monedas).`, view: 'preguntas', label: 'Estudiar' });

  const days = daysToExam(doc.goal, nowMs);
  if (days !== null && days <= 30) out.push({ id: 'exam', level: days <= 7 ? 'warn' : 'info', text: days === 0 ? '¡Hoy es tu examen! Mucha suerte.' : `${days === 1 ? 'Falta' : 'Faltan'} ${plural(days, 'día', 'días')} para tu examen.`, view: 'preguntas', label: 'Repasar' });

  const due = dueCount(doc, nowMs);
  if (due >= 5) out.push({ id: 'due', level: 'info', text: `Tienes ${plural(due, 'pregunta lista', 'preguntas listas')} para repasar.`, view: 'preguntas', label: 'Repasar' });

  if (doc.stats.answered > 0 && isAvailable(doc, nowMs)) out.push({ id: 'joker', level: 'info', text: 'El comodín 50 % está disponible.', view: 'preguntas', label: 'Estudiar' });

  if (backupDue(doc, nowMs)) out.push({ id: 'backup', level: 'warn', text: `Hace ${plural(daysSinceBackup(doc, nowMs), 'día', 'días')} que no guardas una copia de seguridad.`, view: 'ajustes', label: 'Guardar copia' });
  return out;
}
