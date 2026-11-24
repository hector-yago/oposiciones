// Coherencia del catálogo ampliado y de la escena día/noche.
import test from 'node:test';
import assert from 'node:assert/strict';
import { BY_ID, CATALOG, EXCLUSIVES, LAMPS, PLANTS, SPECIES } from '../js/catalog.js';
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
  for (const cat of ['vivos', 'herramientas', 'accesorios']) assert.ok(CATALOG.filter((i) => i.cat === cat).length >= 10, cat);
  assert.ok(CATALOG.filter((i) => i.cat === 'vivos').length >= 11);
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
  assert.match(svg, /class="scene day"/);
  assert.ok(svg.includes('fill="#ffd34d"'));
  assert.ok(!svg.includes('class="star'));
  assert.ok(!svg.includes('night-shade'));
});

test('escena de noche: cielo oscuro con luna y estrellas, y la casa se oscurece', () => {
  const svg = sceneSvg({ gender: 'chico', inventory: [], night: true });
  assert.match(svg, /class="scene night"/);
  assert.ok(svg.includes('url(#sky-night)'));
  assert.ok((svg.match(/class="star /g) ?? []).length >= 8);
  assert.ok(svg.includes('#f5f3d7')); // luna
  assert.ok(!svg.includes('fill="#ffd34d"')); // sin sol
  assert.match(svg, /class="night-shade"[^>]*opacity="0\.52"/);
  assert.ok(!svg.includes('class="glow"'));
});

test('lámparas: de noche iluminan si están encendidas; apagadas o de día no', () => {
  for (const lamp of LAMPS) {
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
    assert.equal(pets.length, Object.keys(SPECIES).length, 'todas las especies visibles (hay hueco para cada una)');
  }
});

test('los animales con casa viven en ella y, sin ella, van al suelo', () => {
  const withHome = sceneSvg({ gender: 'chica', inventory: inv(['rueda', 'terrario', 'conejera', 'percha'], ['hamster', 'tortuga', 'conejo', 'loro']) });
  const noHome = sceneSvg({ gender: 'chica', inventory: inv([], ['hamster', 'tortuga', 'conejo', 'loro']) });
  for (const svg of [withHome, noHome]) assert.equal((svg.match(/data-pet="/g) ?? []).length, 4);
  assert.ok(withHome.includes('obj-rueda') && withHome.includes('obj-percha'));
  assert.ok(!noHome.includes('obj-rueda'));
});
