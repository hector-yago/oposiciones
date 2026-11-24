// Economía del juego: monedas, rachas, crecimiento y castigos. Lógica pura sobre el documento de datos.
import { updateProgress } from './scheduler.js';
import { awardXp, mischief } from './shop.js';
import { recordDay } from './stats.js';

export const STREAK_BONUS = [
  { at: 3, coins: 1 }, // racha de 3 → +1 moneda
  { at: 10, coins: 2, reset: true }, // racha de 10 → +2 monedas y la racha vuelve a 0 (el bonus de 3 se puede repetir)
];
export const WRONG_LIMIT = 3; // cada 3 fallos seguidos, las mascotas se portan mal

/** Monedas por un acierto dado que la racha pasa a `streak`. */
export function rewardFor(streak) {
  const bonus = STREAK_BONUS.find((b) => b.at === streak);
  return { base: 1, bonus: bonus?.coins ?? 0, total: 1 + (bonus?.coins ?? 0), resetStreak: Boolean(bonus?.reset) };
}

/**
 * Registra una respuesta sobre el borrador `doc` (lo muta) y devuelve el resultado para la interfaz.
 * @returns {{correct:boolean, coins:number, bonus:number, streak:number, grown:object[], found:object[], mischief:object[]}}
 */
export function applyAnswer(doc, question, correct, nowMs) {
  doc.stats.answered += 1;
  const t = (doc.stats.byTitle[question.titulo] ??= { ok: 0, ko: 0 });
  doc.progress[question.id] = updateProgress(doc.progress[question.id], correct, nowMs, doc.stats.answered);
  recordDay(doc, nowMs, correct);
  if (!correct) {
    t.ko += 1;
    doc.streak.current = 0;
    doc.streak.wrong += 1;
    const bad = doc.streak.wrong % WRONG_LIMIT === 0 ? mischief(doc) : [];
    return { correct, coins: 0, bonus: 0, streak: 0, grown: [], found: [], mischief: bad, wrong: doc.streak.wrong };
  }
  t.ok += 1;
  doc.stats.correct += 1;
  doc.streak.wrong = 0;
  const next = doc.streak.current + 1;
  doc.streak.best = Math.max(doc.streak.best, next);
  const reward = rewardFor(next);
  if (reward.resetStreak) doc.streak.tens += 1;
  doc.streak.current = reward.resetStreak ? 0 : next;
  doc.coins += reward.total;
  doc.stats.earned += reward.total;
  const { grown, found } = awardXp(doc);
  return { correct, coins: reward.total, bonus: reward.bonus, streak: next, grown, found, mischief: [], wrong: 0 };
}
