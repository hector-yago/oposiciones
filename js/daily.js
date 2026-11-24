// Bonus diario y caja misteriosa semanal. Lógica pura (recibe «ahora»); los días son claves locales AAAA-MM-DD.
import { EXCLUSIVES } from './catalog.js';
import { addItem, ownedIds } from './shop.js';
import { dayKey } from './stats.js';

export const WEEK = 7; // cada 7 días seguidos entrando llega una caja misteriosa
export const DAILY_COINS = 1;
export const BOX_FALLBACK_COINS = 5; // si ya tienes todos los exclusivos

const yesterdayKey = (nowMs) => {
  const d = new Date(nowMs);
  return dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1).getTime());
};

/** Día de la semana en curso (1-7) para mostrar «día 3 de 7». */
export const dayOfWeek = (streak) => (streak > 0 ? ((streak - 1) % WEEK) + 1 : 0);

/**
 * Registra la entrada de hoy (muta el borrador). Devuelve null si ya se registró hoy.
 * El primer día de uso no da bonus (para no estropear el arranque guiado); el día 2 ya sí.
 * @returns {null | {coins:number, streak:number, box:boolean, first:boolean}}
 */
export function claimDaily(doc, nowMs) {
  const today = dayKey(nowMs);
  const d = doc.daily;
  if (!doc.profile || d.last === today) return null;
  if (!d.last) {
    d.last = today;
    d.streak = 1;
    return { coins: 0, streak: 1, box: false, first: true };
  }
  d.streak = d.last === yesterdayKey(nowMs) ? d.streak + 1 : 1;
  d.last = today;
  doc.coins += DAILY_COINS;
  doc.stats.earned += DAILY_COINS;
  const box = d.streak % WEEK === 0;
  if (box) d.boxes += 1;
  return { coins: DAILY_COINS, streak: d.streak, box, first: false };
}

/** Abre una caja misteriosa: un objeto exclusivo que aún no tengas (o monedas si ya los tienes todos). */
export function openBox(doc, nowMs, rng = Math.random) {
  if (doc.daily.boxes <= 0) throw new Error('No tienes ninguna caja sin abrir.');
  doc.daily.boxes -= 1;
  doc.daily.opened += 1;
  const owned = ownedIds(doc);
  const left = EXCLUSIVES.filter((e) => !owned.has(e.id));
  if (!left.length) {
    doc.coins += BOX_FALLBACK_COINS;
    doc.stats.earned += BOX_FALLBACK_COINS;
    return { coins: BOX_FALLBACK_COINS };
  }
  const item = left[Math.min(left.length - 1, Math.floor(rng() * left.length))];
  addItem(doc, item.id, '', nowMs);
  return { itemId: item.id };
}
