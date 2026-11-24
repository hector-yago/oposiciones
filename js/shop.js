// Tienda, mascotas y cuidados. Lógica pura sobre el documento de datos (se llama sobre un borrador y lo muta).
import { BY_ID, SPECIES, isPet, isPlant } from './catalog.js';
import { MAX_MESS, NAME_MAX, OUTFIT_SLOTS } from './migrations.js';
import { trackEvent } from './missions.js';

export const BOOST_MAIN = 0.5;
export const BOOST_EXTRA = 0.25;
export const UPSET_FACTOR = 0.5; // una mascota enfadada o con suciedad crece a la mitad de velocidad
export const JOY_TARGET = 12; // aciertos con la mascota feliz y limpia hasta que encuentra una moneda

export const petsOf = (doc) => doc.inventory.filter((i) => isPet(i.itemId));
export const ownedIds = (doc) => new Set(doc.inventory.filter((i) => !isPet(i.itemId)).map((i) => i.itemId));
export const countOf = (doc, itemId) => doc.inventory.filter((i) => i.itemId === itemId).length;

/** Etapa 0 (cría), 1 (joven) o 2 (adulto) según la XP acumulada. */
export function stageOf(species, xp) {
  const t = SPECIES[species].stages;
  return xp >= t[2] ? 2 : xp >= t[1] ? 1 : 0;
}

/** Progreso hacia la siguiente etapa: { stage, pct (0-100), need (XP que faltan) } ; adulto → pct 100. */
export function growthInfo(species, xp) {
  const t = SPECIES[species].stages;
  const stage = stageOf(species, xp);
  if (stage === 2) return { stage, pct: 100, need: 0 };
  const from = t[stage];
  const to = t[stage + 1];
  return { stage, pct: Math.round(((xp - from) / (to - from)) * 100), need: Math.ceil(to - xp) };
}

/** Multiplicador de XP de una mascota: 1 + 0,5 con su herramienta + 0,25 por cada extra que tengas. */
export function boostFor(doc, species) {
  const owned = ownedIds(doc);
  const sp = SPECIES[species];
  return 1 + (owned.has(sp.tool) ? BOOST_MAIN : 0) + sp.extras.filter((e) => owned.has(e)).length * BOOST_EXTRA;
}

/** Herramientas principales que le faltan a una mascota (para avisar al usuario). */
export const missingTool = (doc, species) => (ownedIds(doc).has(SPECIES[species].tool) ? null : SPECIES[species].tool);

/* ---------- Estado de ánimo y cuidados ---------- */
/** ¿Tiene algún problema pendiente (enfado o suciedad)? */
export const isUpset = (pet) => pet.mood === 'angry' || pet.mess > 0;
/** Feliz = sin problemas; solo entonces acumula alegría para encontrar monedas. */
export const isHappy = (pet) => !isUpset(pet);
/** Las plantas no ensucian: solo se marchitan. */
export const canMess = (species) => !isPlant(species);

// `angry` = cómo se le ve cuando está mal; `mess` = qué ha hecho; `f` = género femenino (para «tócala»).
export const MOOD_TEXT = {
  cactus: { angry: 'está mustio', mess: '' },
  margarita: { angry: 'está mustia, ha perdido pétalos', mess: '', f: true },
  bonsai: { angry: 'está mustio', mess: '' },
  pez: { angry: 'está triste', mess: 'el agua está sucia' },
  hamster: { angry: 'está enfadado', mess: 'ha ensuciado la rueda' },
  canario: { angry: 'está enfadado', mess: 'ha ensuciado la jaula' },
  tortuga: { angry: 'está enfadada', mess: 'ha ensuciado el terrario', f: true },
  gato: { angry: 'está enfadado', mess: 'ha hecho caca' },
  conejo: { angry: 'está enfadado', mess: 'ha hecho caca' },
  loro: { angry: 'está enfadado', mess: 'ha ensuciado la percha' },
  perro: { angry: 'está enfadado', mess: 'ha hecho caca' },
  pollito: { angry: 'está enfadado', mess: 'ha ensuciado el nido' },
  patito: { angry: 'está enfadado', mess: 'ha ensuciado el estanque' },
  erizo: { angry: 'está enfadado', mess: 'ha hecho caca' },
  cerdito: { angry: 'está enfadado', mess: 'ha ensuciado el corral' },
  ovejita: { angry: 'está enfadada', mess: 'ha ensuciado el corral', f: true },
  zorro: { angry: 'está enfadado', mess: 'ha hecho caca' },
  panda: { angry: 'está enfadado', mess: 'ha ensuciado el bambú' },
  raton: { angry: 'está enfadado', mess: 'ha dejado migas y bolitas' },
  buho: { angry: 'está enfadado', mess: 'ha ensuciado el posadero' },
};

/** Resumen de lo que hay que atender en casa. */
export function attention(doc) {
  const pets = petsOf(doc);
  return {
    angry: pets.filter((p) => p.mood === 'angry').length,
    mess: pets.reduce((n, p) => n + p.mess, 0),
    coins: pets.filter((p) => p.coin).length,
    boxes: doc.daily.boxes,
  };
}

/** Castigo por 3 fallos seguidos: las mascotas se enfadan, ensucian y pierden su alegría. Devuelve las afectadas. */
export function mischief(doc) {
  const hit = [];
  for (const pet of petsOf(doc)) {
    pet.mood = 'angry';
    if (canMess(pet.itemId)) pet.mess = Math.min(MAX_MESS, pet.mess + 1);
    pet.joy = 0;
    hit.push({ uid: pet.uid, name: pet.name, species: pet.itemId });
  }
  return hit;
}

const findPet = (doc, uid) => petsOf(doc).find((p) => p.uid === uid);

/** El personaje calma a una mascota enfadada. Devuelve true si había algo que calmar. */
export function calmPet(doc, uid) {
  const pet = findPet(doc, uid);
  if (!pet || pet.mood !== 'angry') return false;
  pet.mood = 'ok';
  doc.stats.care.calmed += 1;
  trackEvent(doc, 'care');
  return true;
}

/** El personaje limpia una caca/suciedad de una mascota. */
export function cleanMess(doc, uid) {
  const pet = findPet(doc, uid);
  if (!pet || pet.mess <= 0) return false;
  pet.mess -= 1;
  doc.stats.care.cleaned += 1;
  trackEvent(doc, 'care');
  return true;
}

/** Monedas que da una mascota feliz: 1, y 2 si es adulta. */
export const coinValue = (pet) => 1 + (stageOf(pet.itemId, pet.xp) === 2 ? 1 : 0);

/** Recoge la moneda que ha encontrado (o que le ha crecido) una mascota. Devuelve las monedas ganadas (0 si no había). */
export function collectCoin(doc, uid) {
  const pet = findPet(doc, uid);
  if (!pet || !pet.coin) return 0;
  const v = coinValue(pet);
  pet.coin = false;
  pet.joy = 0;
  doc.coins += v;
  doc.stats.earned += v;
  doc.stats.care.coins += 1;
  return v;
}

/**
 * Reparte la XP y la alegría de un acierto entre todas las mascotas.
 * @returns {{grown: object[], found: object[]}} las que suben de etapa y las que encuentran una moneda
 */
export function awardXp(doc) {
  const grown = [];
  const found = [];
  for (const pet of petsOf(doc)) {
    const before = stageOf(pet.itemId, pet.xp);
    const factor = isUpset(pet) ? UPSET_FACTOR : 1;
    pet.xp = Math.round((pet.xp + boostFor(doc, pet.itemId) * factor) * 100) / 100;
    const after = stageOf(pet.itemId, pet.xp);
    if (after > before) grown.push({ uid: pet.uid, name: pet.name, species: pet.itemId, stage: after });
    if (isHappy(pet) && !pet.coin) {
      pet.joy += 1;
      if (pet.joy >= JOY_TARGET) {
        pet.coin = true;
        pet.joy = 0;
        found.push({ uid: pet.uid, name: pet.name, species: pet.itemId });
      }
    }
  }
  return { grown, found };
}

export const cleanName = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);

/** ¿Se puede comprar? → { ok, reason? } */
export function canBuy(doc, itemId) {
  const item = BY_ID[itemId];
  if (!item || item.cat === 'exclusivos') return { ok: false, reason: 'No existe ese artículo.' };
  if (isPet(itemId)) {
    const max = SPECIES[itemId].max;
    if (countOf(doc, itemId) >= max) return { ok: false, reason: `Máximo ${max}`, code: 'max' };
  } else if (ownedIds(doc).has(itemId)) return { ok: false, reason: 'Ya lo tienes', code: 'owned' };
  if (item.req && !ownedIds(doc).has(item.req)) return { ok: false, reason: `Necesita: ${BY_ID[item.req].name.toLowerCase()}`, code: 'req' };
  if (doc.coins < item.price) return { ok: false, reason: `Te faltan ${item.price - doc.coins}`, code: 'coins' };
  return { ok: true };
}

/** Compra un artículo (muta el borrador). Las mascotas requieren nombre. Devuelve { uid }. */
export function buy(doc, itemId, name, nowMs) {
  const check = canBuy(doc, itemId);
  if (!check.ok) throw new Error(check.reason);
  const pet = isPet(itemId);
  const clean = cleanName(name);
  if (pet && !clean) throw new Error('Ponle un nombre a tu mascota.');
  doc.coins -= BY_ID[itemId].price;
  return { uid: addItem(doc, itemId, pet ? clean : '', nowMs) };
}

/** Añade un objeto al inventario sin cobrar (compra, caja misteriosa). */
export function addItem(doc, itemId, name, nowMs, variant = '') {
  const uid = doc.nextUid++;
  doc.inventory.push({ uid, itemId, name, xp: 0, boughtAt: nowMs, mood: 'ok', mess: 0, joy: 0, coin: false, variant });
  return uid;
}

/** Se pone o se quita una prenda (itemId vacío = quitar). Solo ropa que tienes y en su sitio. */
export function equip(doc, slot, itemId) {
  if (!OUTFIT_SLOTS.includes(slot)) throw new Error('Ese sitio no existe.');
  if (itemId) {
    const item = BY_ID[itemId];
    if (!item || item.cat !== 'ropa' || item.slot !== slot) throw new Error('Esa prenda no va ahí.');
    if (!ownedIds(doc).has(itemId)) throw new Error('Todavía no tienes esa prenda.');
  }
  doc.outfit[slot] = itemId || '';
}

export function renamePet(doc, uid, name) {
  const pet = findPet(doc, uid);
  const clean = cleanName(name);
  if (!pet || !clean) throw new Error('Nombre no válido.');
  pet.name = clean;
}
