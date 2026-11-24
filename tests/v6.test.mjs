// Habitaciones Cocina y Terraza (y coherencia de todas las habitaciones).
import test from 'node:test';
import assert from 'node:assert/strict';
import { BY_ID, CATALOG, CATEGORIES, KITCHEN_ITEMS, LAMPS, ROOMS, SPECIES, TERRACE_ITEMS, roomOf } from '../js/catalog.js';
import { emptyDoc } from '../js/migrations.js';
import { cocinaSvg } from '../js/art/cocina.js';
import { terrazaSvg } from '../js/art/terraza.js';
import { studySvg } from '../js/art/study.js';
import { gardenSvg } from '../js/art/garden.js';
import { sceneSvg } from '../js/art/scene.js';
import { buy, canBuy } from '../js/shop.js';
import { newlyUnlocked } from '../js/achievements.js';

const inv = (ids, pets = []) => {
  let uid = 1;
  return [...ids.map((itemId) => ({ uid: uid++, itemId, name: '', xp: 0, mood: 'ok', mess: 0, joy: 0, coin: false, variant: '' })), ...pets.map((itemId) => ({ uid: uid++, itemId, name: itemId, xp: 500, mood: 'ok', mess: 0, joy: 0, coin: false, variant: '' }))];
};
const base = () => {
  const d = emptyDoc();
  d.profile = { name: 'Ana', gender: 'chica' };
  return d;
};

test('habitaciones: cada una tiene su artículo de desbloqueo, su categoría y su escena', () => {
  assert.deepEqual(ROOMS.map((r) => r.id), ['casa', 'jardin', 'estudio', 'cocina', 'terraza']);
  for (const r of ROOMS.filter((x) => x.req)) {
    assert.equal(r.req, r.id);
    assert.equal(BY_ID[r.id]?.cat, r.id, `artículo de desbloqueo de ${r.id}`);
    assert.ok(CATEGORIES.some((c) => c.id === r.id), `categoría ${r.id}`);
    assert.ok(CATALOG.filter((i) => i.req === r.id).length >= 7, `${r.id} tiene contenido`);
    for (const i of CATALOG.filter((x) => x.req === r.id)) assert.equal(roomOf(i.id), r.id, `${i.id} va en ${r.id}`);
  }
  for (const sp of Object.values(SPECIES)) assert.ok(!sp.room || ROOMS.some((r) => r.id === sp.room));
});

test('habitaciones: ningún objeto o animal con requisito está en el salón', () => {
  for (const i of CATALOG.filter((x) => x.req)) assert.notEqual(roomOf(i.id), 'casa', i.id);
  for (const sp of ['abeja', 'pinguino']) assert.equal(roomOf(sp), 'cocina');
  for (const sp of ['paloma', 'camaleon']) assert.equal(roomOf(sp), 'terraza');
});

test('cocina y terraza: se compran y desbloquean sus artículos', () => {
  const d = base();
  d.coins = 1000;
  for (const [room, thing] of [['cocina', 'nevera'], ['terraza', 'hamaca']]) {
    assert.equal(canBuy(d, thing).code, 'req');
    buy(d, room, '', 1);
    assert.equal(canBuy(d, thing).ok, true);
  }
  assert.equal(BY_ID.cocina.price, 45);
  assert.equal(BY_ID.terraza.price, 70);
  assert.equal(canBuy(d, 'abeja').ok, true);
  assert.equal(canBuy(d, 'camaleon').ok, true);
});

test('cocina: escena con muebles, abejas, pingüinos, luz de noche', () => {
  const svg = cocinaSvg({ gender: 'chico', inventory: inv(KITCHEN_ITEMS, ['abeja', 'abeja', 'pinguino']) });
  assert.match(svg, /class="scene day room-cocina"/);
  for (const id of KITCHEN_ITEMS) assert.ok(svg.includes(`obj-${id}`), id);
  assert.equal((svg.match(/data-pet="/g) ?? []).length, 3);
  assert.ok(svg.includes('swim'), 'las abejas revolotean');
  const night = cocinaSvg({ gender: 'chica', inventory: inv(['lampara-cocina']), night: true });
  assert.ok(night.includes('class="glow"') && night.includes('data-lamp="lampara-cocina"'));
  assert.ok(!cocinaSvg({ gender: 'chica', inventory: inv(['lampara-cocina']), night: true, lampOff: true }).includes('class="glow"'));
  assert.match(cocinaSvg({ gender: 'chica', inventory: [], night: true }), /class="scene night room-cocina"/);
});

test('terraza: escena con objetos, palomas en la barandilla, camaleón en su rama, ciudad de noche', () => {
  const svg = terrazaSvg({ gender: 'chica', inventory: inv(TERRACE_ITEMS, ['paloma', 'paloma', 'camaleon']) });
  assert.match(svg, /class="scene day room-terraza"/);
  for (const id of TERRACE_ITEMS) assert.ok(svg.includes(`obj-${id}`), id);
  assert.equal((svg.match(/data-pet="/g) ?? []).length, 3);
  const night = terrazaSvg({ gender: 'chico', inventory: inv(['farol-terraza']), night: true });
  assert.ok(night.includes('class="glow"') && night.includes('data-lamp="farol-terraza"'));
  assert.ok(night.includes('#fde68a'), 'ventanas encendidas en los edificios');
  assert.ok(!terrazaSvg({ gender: 'chico', inventory: [] }).includes('#fde68a'));
});

test('cada animal solo aparece en su habitación y cada lámpara en la suya', () => {
  const rooms = { casa: sceneSvg, jardin: gardenSvg, estudio: studySvg, cocina: cocinaSvg, terraza: terrazaSvg };
  for (const [sp, cfg] of Object.entries(SPECIES)) {
    const mine = cfg.room ?? 'casa';
    for (const [room, draw] of Object.entries(rooms)) {
      const n = (draw({ gender: 'chico', inventory: inv([], [sp]) }).match(/data-pet="/g) ?? []).length;
      assert.equal(n, room === mine ? 1 : 0, `${sp} en ${room}`);
    }
  }
  for (const lamp of LAMPS) {
    const mine = roomOf(lamp);
    for (const [room, draw] of Object.entries(rooms)) {
      const has = draw({ gender: 'chico', inventory: inv([lamp]), night: true }).includes(`data-lamp="${lamp}"`);
      assert.equal(has, room === mine, `${lamp} en ${room}`);
    }
  }
});

test('todas las escenas se generan con todo comprado, de día y de noche', () => {
  const all = (room) => CATALOG.filter((i) => roomOf(i.id) === room && !(i.id in SPECIES)).map((i) => i.id);
  const pets = (room) => Object.keys(SPECIES).filter((sp) => roomOf(sp) === room);
  const rooms = { casa: sceneSvg, jardin: gardenSvg, estudio: studySvg, cocina: cocinaSvg, terraza: terrazaSvg };
  for (const [room, draw] of Object.entries(rooms)) {
    for (const night of [false, true]) {
      const svg = draw({ gender: 'chica', inventory: inv(all(room), pets(room)), night, season: 'navidad' });
      assert.ok(svg.length > 8000, `${room} ${night}`);
      const ids = [...svg.matchAll(/data-pet="(\d+)"/g)].map((m) => m[1]);
      assert.equal(new Set(ids).size, ids.length, `${room}: mascota repetida`);
      assert.equal(ids.length, pets(room).length, `${room}: todas las especies visibles`);
    }
  }
});

test('logros de las habitaciones nuevas', () => {
  const d = base();
  d.inventory = inv(['jardin', 'estudio', 'cocina', 'terraza', 'nevera', 'fogon', 'mesa', 'cafetera', 'toldo', 'hamaca', 'barbacoa', 'telescopio'], ['abeja', 'pinguino', 'paloma', 'camaleon']);
  const ids = newlyUnlocked({ doc: d, questions: [], now: 1 });
  for (const id of ['kitchen_open', 'terrace_open', 'all_rooms', 'has_abeja', 'has_pinguino', 'has_paloma', 'has_camaleon', 'kitchen_full', 'terrace_full']) assert.ok(ids.includes(id), id);
});
