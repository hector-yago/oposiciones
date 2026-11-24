// Coherencia del catálogo ampliado y de la escena día/noche.
import test from 'node:test';
import assert from 'node:assert/strict';
import { BY_ID, CATALOG, CLOTHES, EXCLUSIVES, LAMPS, PLANTS, SPECIES, roomOf } from '../js/catalog.js';
import { gardenSvg } from '../js/art/garden.js';
import { outfitSvg } from '../js/art/clothes.js';
import { seasonOf } from '../js/seasons.js';
import { ITEM_ART } from '../js/art/items.js';
import { petSvg } from '../js/art/pets.js';
import { isNightHour, sceneSvg } from '../js/art/scene.js';
import { MOOD_TEXT } from '../js/shop.js';

const inv = (ids, pets = []) => {
  let uid = 1;
  return [
    ...ids.map((itemId) => ({ uid: uid++, itemId, name: '', xp: 0, mood: 'ok', mess: 0, joy: 0, coin: false })),
    ...pets.map((itemId) => ({ uid: uid++, itemId, name: itemId, xp: 500, mood: 'ok', mess: 0, joy: 0, coin: false })),
  ];
};

test('catálogo: ids únicos, precios positivos y 3 categorías con contenido', () => {
  const all = [...CATALOG, ...EXCLUSIVES];
  assert.equal(new Set(all.map((i) => i.id)).size, all.length);
  for (const i of CATALOG) assert.ok(i.price >= 1 && i.name && i.desc, i.id);
  for (const cat of ['vivos', 'herramientas', 'accesorios', 'ropa', 'jardin']) assert.ok(CATALOG.filter((i) => i.cat === cat).length >= 5, cat);
  assert.ok(CATALOG.filter((i) => i.cat === 'vivos').length >= 18);
  for (const i of CATALOG.filter((x) => x.req)) assert.ok(BY_ID[i.req], `${i.id} necesita ${i.req}`);
});

test('catálogo: los seres vivos están ordenados de más barato a más caro', () => {
  const prices = CATALOG.filter((i) => i.cat === 'vivos').map((i) => i.price);
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
});

test('especies: cada una está en la tienda y su herramienta y extras existen como herramientas', () => {
  for (const [sp, cfg] of Object.entries(SPECIES)) {
    assert.equal(BY_ID[sp]?.cat, 'vivos', sp);
    for (const t of [cfg.tool, ...cfg.extras]) assert.equal(BY_ID[t]?.cat, 'herramientas', `${sp} → ${t}`);
    assert.ok(cfg.stages[0] === 0 && cfg.stages[1] < cfg.stages[2], sp);
    assert.ok(cfg.max >= 1 && cfg.size > 0 && cfg.size <= 1, sp);
    assert.ok(MOOD_TEXT[sp]?.angry, `falta MOOD_TEXT de ${sp}`);
  }
  for (const p of PLANTS) assert.ok(p in SPECIES);
});

test('arte: todos los objetos y todas las mascotas (3 etapas × 2 estados) se dibujan', () => {
  for (const i of [...CATALOG, ...EXCLUSIVES]) if (!(i.id in SPECIES)) assert.ok(ITEM_ART[i.id]?.svg, `sin arte: ${i.id}`);
  for (const sp of Object.keys(SPECIES)) for (const stage of [0, 1, 2]) for (const mood of ['ok', 'angry']) assert.ok(petSvg(sp, stage, mood).length > 100, `${sp}/${stage}/${mood}`);
  // las plantas enfadadas cambian de dibujo (se marchitan); los animales añaden cejas y marca de enfado
  for (const sp of Object.keys(SPECIES)) assert.notEqual(petSvg(sp, 2, 'ok'), petSvg(sp, 2, 'angry'), sp);
});

test('día y noche: 18:00-06:00 es de noche', () => {
  const noche = [0, 1, 5, 18, 19, 23];
  const dia = [6, 7, 12, 17];
  for (const h of noche) assert.equal(isNightHour(h), true, `h=${h}`);
  for (const h of dia) assert.equal(isNightHour(h), false, `h=${h}`);
});

test('escena de día: sol y sin luna ni estrellas ni sombra nocturna', () => {
  const svg = sceneSvg({ gender: 'chica', inventory: [], night: false });
  assert.match(svg, /class="scene day /);
  assert.ok(svg.includes('fill="#ffd34d"'));
  assert.ok(!svg.includes('class="star'));
  assert.ok(!svg.includes('night-shade'));
});

test('escena de noche: cielo oscuro con luna y estrellas, y la casa se oscurece', () => {
  const svg = sceneSvg({ gender: 'chico', inventory: [], night: true });
  assert.match(svg, /class="scene night /);
  assert.ok(svg.includes('url(#sky-night)'));
  assert.ok((svg.match(/class="star /g) ?? []).length >= 8);
  assert.ok(svg.includes('#f5f3d7')); // luna
  assert.ok(!svg.includes('fill="#ffd34d"')); // sin sol
  assert.match(svg, /class="night-shade"[^>]*opacity="0\.52"/);
  assert.ok(!svg.includes('class="glow"'));
});

test('lámparas del salón: de noche iluminan si están encendidas; apagadas o de día no', () => {
  for (const lamp of LAMPS.filter((l) => roomOf(l) === 'casa')) {
    const on = sceneSvg({ gender: 'chica', inventory: inv([lamp]), night: true, lampOff: false });
    assert.ok(on.includes('class="glow"'), `${lamp}: brillo`);
    assert.match(on, /class="night-shade"[^>]*opacity="0\.2"/);
    assert.ok(on.includes(`data-lamp="${lamp}"`));
    const off = sceneSvg({ gender: 'chica', inventory: inv([lamp]), night: true, lampOff: true });
    assert.ok(!off.includes('class="glow"'));
    assert.match(off, /class="night-shade"[^>]*opacity="0\.52"/);
    const day = sceneSvg({ gender: 'chica', inventory: inv([lamp]), night: false });
    assert.ok(!day.includes('class="glow"'));
    assert.ok(day.includes(`data-lamp="${lamp}"`), 'también se puede tocar de día');
  }
});

test('escena con todo comprado: se genera en día y noche y no repite ids de mascotas', () => {
  const everything = inv(CATALOG.filter((i) => i.cat !== 'vivos').map((i) => i.id).concat(EXCLUSIVES.map((e) => e.id)), Object.keys(SPECIES));
  for (const night of [false, true]) {
    const svg = sceneSvg({ gender: 'chica', inventory: everything, night, lampOff: false });
    assert.ok(svg.length > 20000);
    const pets = [...svg.matchAll(/data-pet="(\d+)"/g)].map((m) => m[1]);
    assert.equal(new Set(pets).size, pets.length, 'una mascota dibujada dos veces');
    assert.equal(pets.length, Object.keys(SPECIES).filter((sp) => roomOf(sp) === 'casa').length, 'todas las especies del salón visibles');
  }
});

test('los animales con casa viven en ella y, sin ella, van al suelo', () => {
  const withHome = sceneSvg({ gender: 'chica', inventory: inv(['rueda', 'terrario', 'conejera', 'percha'], ['hamster', 'tortuga', 'conejo', 'loro']) });
  const noHome = sceneSvg({ gender: 'chica', inventory: inv([], ['hamster', 'tortuga', 'conejo', 'loro']) });
  for (const svg of [withHome, noHome]) assert.equal((svg.match(/data-pet="/g) ?? []).length, 4);
  assert.ok(withHome.includes('obj-rueda') && withHome.includes('obj-percha'));
  assert.ok(!noHome.includes('obj-rueda'));
});

const garden = (ids, pets = [], extra = {}) => gardenSvg({ gender: 'chico', inventory: inv(ids, pets), ...extra });

test('jardín: los animales de granja viven allí y no en el salón', () => {
  const gardenPets = Object.keys(SPECIES).filter((sp) => roomOf(sp) === 'jardin');
  assert.ok(gardenPets.length >= 7);
  const g = garden(['jardin'], gardenPets);
  const s = sceneSvg({ gender: 'chico', inventory: inv(['jardin'], gardenPets) });
  assert.equal((g.match(/data-pet="/g) ?? []).length, gardenPets.length);
  assert.equal((s.match(/data-pet="/g) ?? []).length, 0);
});

test('jardín: casas de los animales y objetos aparecen cuando se tienen', () => {
  const g = garden(['nido', 'estanque', 'corral', 'madriguera', 'bambu', 'banco', 'huerto', 'columpio', 'fuente'], ['pollito', 'patito', 'cerdito', 'zorro', 'panda']);
  for (const id of ['nido', 'estanque', 'corral', 'madriguera', 'bambu', 'banco', 'huerto', 'columpio', 'fuente']) assert.ok(g.includes(`obj-${id}`), id);
  assert.equal((g.match(/data-pet="/g) ?? []).length, 5);
});

test('jardín de noche: farola encendida ilumina; apagada no', () => {
  const on = garden(['farola'], [], { night: true, lampOff: false });
  assert.ok(on.includes('class="glow"') && on.includes('data-lamp="farola"'));
  assert.ok(!garden(['farola'], [], { night: true, lampOff: true }).includes('class="glow"'));
  assert.match(garden([], [], { night: true }), /class="scene night room-jardin"/);
});

test('ropa: cada prenda tiene su sitio, se dibuja puesta y cambia la escena', () => {
  for (const c of CLOTHES) assert.ok(['hat', 'face', 'neck', 'top'].includes(c.slot), c.id);
  const slots = { hat: 'gorra', face: 'gafas', neck: 'pajarita', top: 'traje' };
  for (const gender of ['chico', 'chica']) {
    assert.equal(outfitSvg({}, gender), '');
    for (const [slot, id] of Object.entries(slots)) assert.ok(outfitSvg({ [slot]: id }, gender).length > 20, id);
  }
  const base = sceneSvg({ gender: 'chica', inventory: [] });
  assert.notEqual(base, sceneSvg({ gender: 'chica', inventory: [], outfit: { hat: 'corona' } }));
});

test('variantes raras de mascotas se marcan con su clase', () => {
  const svg = sceneSvg({ gender: 'chica', inventory: [{ uid: 1, itemId: 'gato', name: 'Michi', xp: 5, mood: 'ok', mess: 0, joy: 0, coin: false, variant: 'dorado' }] });
  assert.ok(svg.includes('v-dorado'));
});

test('temporadas: fechas clave y decoración en la escena', () => {
  assert.equal(seasonOf(new Date(2026, 11, 24)), 'navidad');
  assert.equal(seasonOf(new Date(2027, 0, 6)), 'navidad');
  assert.equal(seasonOf(new Date(2027, 0, 7)), null);
  assert.equal(seasonOf(new Date(2026, 9, 31)), 'halloween');
  assert.equal(seasonOf(new Date(2026, 6, 15)), 'verano');
  assert.equal(seasonOf(new Date(2026, 3, 10)), 'primavera');
  assert.equal(seasonOf(new Date(2026, 10, 10)), null);
  assert.ok(sceneSvg({ gender: 'chico', inventory: [], season: 'navidad' }).includes('xmas-tree'));
  assert.ok(sceneSvg({ gender: 'chico', inventory: [], season: 'halloween' }).includes('class="bat '));
  assert.ok(!sceneSvg({ gender: 'chico', inventory: [], season: null }).includes('xmas-tree'));
  for (const season of ['navidad', 'halloween', 'verano', 'primavera']) assert.ok(gardenSvg({ gender: 'chico', inventory: [], season }).length > 1000, season);
});
