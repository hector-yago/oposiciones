// Minijuegos cortos para descansar entre test y test. Lógica pura; el premio tiene tope diario para que no sea una granja.
import { dayKey } from './stats.js';
import { trackEvent } from './missions.js';

export const MAX_REWARDED_PLAYS = 3; // partidas con premio al día
export const MAX_GAME_COINS = 3;

export const TITLE_INFO = [
  { id: 'Título Preliminar', short: 'Preliminar', desc: 'Principios generales (arts. 1-9)' },
  { id: 'Título I', short: 'Título I', desc: 'Derechos y deberes fundamentales (arts. 10-55)' },
  { id: 'Título II', short: 'Título II', desc: 'La Corona (arts. 56-65)' },
  { id: 'Título III', short: 'Título III', desc: 'Las Cortes Generales (arts. 66-96)' },
  { id: 'Título IV', short: 'Título IV', desc: 'Gobierno y Administración (arts. 97-107)' },
  { id: 'Título V', short: 'Título V', desc: 'Relaciones Gobierno-Cortes (arts. 108-116)' },
  { id: 'Título VI', short: 'Título VI', desc: 'Poder Judicial (arts. 117-127)' },
  { id: 'Título VII', short: 'Título VII', desc: 'Economía y Hacienda (arts. 128-136)' },
  { id: 'Título VIII', short: 'Título VIII', desc: 'Organización territorial (arts. 137-158)' },
  { id: 'Título IX', short: 'Título IX', desc: 'Tribunal Constitucional (arts. 159-165)' },
  { id: 'Título X', short: 'Título X', desc: 'Reforma constitucional (arts. 166-169)' },
];

const shuffled = (list, rng) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** «Emparejar»: une cada Título con lo que regula. Devuelve las columnas ya mezcladas. */
export function pairsRound(rng = Math.random, n = 6) {
  const chosen = shuffled(TITLE_INFO, rng).slice(0, n);
  return { pairs: chosen, left: shuffled(chosen, rng).map((p) => ({ id: p.id, label: p.short })), right: shuffled(chosen, rng).map((p) => ({ id: p.id, label: p.desc })) };
}

/** «Verdadero o falso»: una pregunta con una de sus opciones; es verdadera si es la correcta. */
export function vfRound(questions, rng = Math.random) {
  const q = questions[Math.floor(rng() * questions.length)];
  const truth = rng() < 0.5;
  const wrong = q.opciones.map((_, i) => i).filter((i) => i !== q.correcta);
  const idx = truth ? q.correcta : wrong[Math.floor(rng() * wrong.length)];
  return { qid: q.id, article: q.articulo, text: q.enunciado, option: q.opciones[idx], truth, explanation: q.explicacion };
}

export const playsToday = (doc, nowMs) => (doc.minigames.day === dayKey(nowMs) ? doc.minigames.plays : 0);
export const canEarn = (doc, nowMs) => playsToday(doc, nowMs) < MAX_REWARDED_PLAYS;

/** Premio según el porcentaje de aciertos (0-1): 3 monedas si es perfecto, 2 si ≥70 %, 1 si ≥40 %. Cuenta como misión «jugar». */
export function awardGame(doc, nowMs, ratio) {
  const day = dayKey(nowMs);
  if (doc.minigames.day !== day) doc.minigames = { day, plays: 0 };
  trackEvent(doc, 'game');
  doc.stats.games += 1;
  if (doc.minigames.plays >= MAX_REWARDED_PLAYS) return 0;
  doc.minigames.plays += 1;
  const coins = ratio >= 1 ? 3 : ratio >= 0.7 ? 2 : ratio >= 0.4 ? 1 : 0;
  const v = Math.min(MAX_GAME_COINS, coins);
  doc.coins += v;
  doc.stats.earned += v;
  return v;
}
