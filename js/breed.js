// Cría: dos mascotas adultas, felices y de la misma especie pueden tener una cría (a veces con un color raro).
import { SPECIES } from './catalog.js';
import { addItem, countOf, isUpset, petsOf, stageOf } from './shop.js';

export const BREED_COOLDOWN_MS = 7 * 86400000; // una cría por especie cada 7 días
export const BREED_CAP_FACTOR = 2; // las crías no cuentan para el máximo de compra: se puede llegar al doble
/** Probabilidades acumuladas de variante: 5 % arcoíris, 10 % dorado, 15 % azul, 70 % normal. */
export const VARIANT_ODDS = [
  ['arcoiris', 0.05],
  ['dorado', 0.15],
  ['azul', 0.3],
];

/** ¿Pueden criar los ejemplares de esta especie? → { ok, reason? } */
export function canBreed(doc, species, nowMs) {
  const cfg = SPECIES[species];
  if (!cfg) return { ok: false, reason: 'Especie desconocida.' };
  const adults = petsOf(doc).filter((p) => p.itemId === species && stageOf(species, p.xp) === 2 && !isUpset(p));
  if (adults.length < 2) return { ok: false, reason: 'Hacen falta 2 adultos felices y limpios.' };
  if (countOf(doc, species) >= cfg.max * BREED_CAP_FACTOR) return { ok: false, reason: `Ya tienes todos los que caben (${cfg.max * BREED_CAP_FACTOR}).` };
  const left = Math.min(BREED_COOLDOWN_MS, (doc.breed[species] ?? 0) + BREED_COOLDOWN_MS - nowMs);
  if (left > 0) return { ok: false, reason: `Podrán volver a criar en ${Math.ceil(left / 86400000)} día(s).`, left };
  return { ok: true };
}

export function rollVariant(rng = Math.random) {
  const r = rng();
  return VARIANT_ODDS.find(([, p]) => r < p)?.[0] ?? '';
}

/** Cría (muta el borrador): añade una mascota nueva en etapa de cría. Devuelve { uid, variant }. */
export function breed(doc, species, name, nowMs, rng = Math.random) {
  const chk = canBreed(doc, species, nowMs);
  if (!chk.ok) throw new Error(chk.reason);
  const clean = String(name ?? '').replace(/\s+/g, ' ').trim().slice(0, 20);
  if (!clean) throw new Error('Ponle un nombre a la cría.');
  const variant = rollVariant(rng);
  const uid = addItem(doc, species, clean, nowMs, variant);
  doc.breed[species] = nowMs;
  return { uid, variant };
}

export const VARIANT_NAMES = { azul: 'azul', dorado: 'dorada', arcoiris: 'arcoíris' };
