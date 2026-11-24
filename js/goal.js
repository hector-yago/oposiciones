// Objetivo de estudio: fecha de examen y preguntas diarias. Lógica pura.
import { dayKey } from './stats.js';

export const GOAL_BONUS = 2;

/** Días que faltan para el examen (0 = hoy); null si no hay fecha o ya pasó. */
export function daysToExam(goal, nowMs) {
  if (!goal.examDate) return null;
  const [y, m, d] = goal.examDate.split('-').map(Number);
  const today = new Date(nowMs);
  const a = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const b = Date.UTC(y, m - 1, d);
  const days = Math.round((b - a) / 86400000);
  return days >= 0 ? days : null;
}

export const todayCount = (doc, nowMs) => doc.stats.byDay[dayKey(nowMs)]?.n ?? 0;

/** Preguntas que hay que hacer cada día para llegar al objetivo (informativo). */
export const goalPct = (doc, nowMs) => Math.min(100, Math.round((todayCount(doc, nowMs) / doc.goal.daily) * 100));

/** Bonus por cumplir el objetivo de hoy (una vez al día). Devuelve las monedas (0 si no toca). */
export function claimGoalBonus(doc, nowMs) {
  const today = dayKey(nowMs);
  if (doc.goal.bonusDay === today || todayCount(doc, nowMs) < doc.goal.daily) return 0;
  doc.goal.bonusDay = today;
  doc.coins += GOAL_BONUS;
  doc.stats.earned += GOAL_BONUS;
  return GOAL_BONUS;
}
