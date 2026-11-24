// Comodín 50 %: deja 2 de las 4 opciones (la correcta y una incorrecta). 1 uso cada 4 horas.
export const COOLDOWN_MS = 4 * 3600 * 1000;

export const remainingMs = (doc, nowMs) => Math.max(0, doc.joker.lastUsed + COOLDOWN_MS - nowMs);
export const isAvailable = (doc, nowMs) => remainingMs(doc, nowMs) === 0;

/** Texto del tiempo que falta: «2 h 13 min», «45 min», «menos de 1 min». */
export function formatRemaining(ms) {
  const min = Math.ceil(ms / 60000);
  if (min <= 0) return '0 min';
  if (min < 1) return 'menos de 1 min';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min`;
}

/** Posiciones (índices de `opciones`) que se ocultan: dos incorrectas al azar, dejando la correcta y otra. */
export function pickHidden(correct, rng = Math.random, total = 4) {
  const wrong = Array.from({ length: total }, (_, i) => i).filter((i) => i !== correct);
  const keep = wrong[Math.min(wrong.length - 1, Math.floor(rng() * wrong.length))];
  return wrong.filter((i) => i !== keep);
}

/** Gasta el comodín (muta el borrador). Lanza si aún no está disponible. */
export function useJoker(doc, nowMs) {
  if (!isAvailable(doc, nowMs)) throw new Error(`El comodín estará disponible en ${formatRemaining(remainingMs(doc, nowMs))}.`);
  doc.joker.lastUsed = nowMs;
  doc.joker.uses += 1;
}
