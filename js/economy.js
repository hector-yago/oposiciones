// Economía del juego: monedas y rachas. Lógica pura sobre el documento de datos.
import { updateProgress } from './scheduler.js';

export const STREAK_BONUS = [
  { at: 3, coins: 1 }, // racha de 3 → +1 moneda
  { at: 10, coins: 2, reset: true }, // racha de 10 → +2 monedas y la racha vuelve a 0 (el bonus de 3 se puede repetir)
];

/** Monedas por un acierto dado que la racha pasa a `streak`. */
export function rewardFor(streak) {
  const bonus = STREAK_BONUS.find((b) => b.at === streak);
  return { base: 1, bonus: bonus?.coins ?? 0, total: 1 + (bonus?.coins ?? 0), resetStreak: Boolean(bonus?.reset) };
}

/**
 * Registra una respuesta sobre el borrador `doc` (lo muta) y devuelve el resultado para la interfaz.
 * @param {object} doc documento (borrador)
 * @param {{id:string, titulo:string}} question
 * @param {boolean} correct
 * @param {number} nowMs
 */
export function applyAnswer(doc, question, correct, nowMs) {
  doc.stats.answered += 1;
  const t = (doc.stats.byTitle[question.titulo] ??= { ok: 0, ko: 0 });
  doc.progress[question.id] = updateProgress(doc.progress[question.id], correct, nowMs, doc.stats.answered);
  if (!correct) {
    t.ko += 1;
    doc.streak.current = 0;
    return { correct, coins: 0, bonus: 0, streak: 0, streakMilestone: false };
  }
  t.ok += 1;
  doc.stats.correct += 1;
  const next = doc.streak.current + 1;
  doc.streak.best = Math.max(doc.streak.best, next);
  const reward = rewardFor(next);
  doc.streak.current = reward.resetStreak ? 0 : next;
  doc.coins += reward.total;
  return { correct, coins: reward.total, bonus: reward.bonus, streak: next, streakMilestone: reward.bonus > 0 };
}
