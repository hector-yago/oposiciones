import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyDoc } from '../js/migrations.js';
import { applyAnswer } from '../js/economy.js';
import { JOY_TARGET, awardXp, boostFor, buy, calmPet, canBuy, cleanMess, coinValue, collectCoin, growthInfo, mischief, petsOf, renamePet, stageOf } from '../js/shop.js';
import { SPECIES } from '../js/catalog.js';

const NOW = 1_700_000_000_000;
const Q = { id: 'q1', titulo: 'Título I' };
const rich = (coins = 500) => {
  const d = emptyDoc();
  d.profile = { name: 'Ana', gender: 'chica' };
  d.coins = coins;
  return d;
};

test('compra: cobra, exige nombre a las mascotas y no deja repetir objetos', () => {
  const d = rich(10);
  assert.throws(() => buy(d, 'cactus', '  ', NOW), /nombre/);
  assert.equal(d.coins, 10);
  const { uid } = buy(d, 'cactus', '  Pin   Pon ', NOW);
  assert.equal(d.coins, 9);
  assert.equal(d.inventory.find((i) => i.uid === uid).name, 'Pin Pon');
  buy(d, 'regadera', '', NOW);
  assert.equal(d.coins, 6);
  assert.equal(canBuy(d, 'regadera', NOW).code, 'owned');
  assert.throws(() => buy(d, 'regadera', '', NOW), /Ya lo tienes/);
});

test('compra: sin monedas no se puede, y los exclusivos no se venden', () => {
  const d = rich(0);
  assert.equal(canBuy(d, 'cactus').code, 'coins');
  assert.equal(canBuy(d, 'bandera').ok, false);
  assert.equal(canBuy(d, 'no-existe').ok, false);
});

test('compra: límite de ejemplares por especie y nombres repetidos permitidos', () => {
  const d = rich(1000);
  for (let i = 0; i < SPECIES.gato.max; i++) buy(d, 'gato', 'Michi', NOW);
  assert.equal(canBuy(d, 'gato').code, 'max');
  assert.equal(petsOf(d).length, SPECIES.gato.max);
});

test('renombrar mascotas', () => {
  const d = rich();
  const { uid } = buy(d, 'perro', 'Toby', NOW);
  renamePet(d, uid, 'Rex');
  assert.equal(petsOf(d)[0].name, 'Rex');
  assert.throws(() => renamePet(d, uid, '   '), /no válido/);
});

test('crecimiento: etapas por XP y herramienta ×1,5, extras +0,25', () => {
  assert.equal(stageOf('cactus', 0), 0);
  assert.equal(stageOf('cactus', 10), 1);
  assert.equal(stageOf('cactus', 30), 2);
  assert.deepEqual(growthInfo('cactus', 5), { stage: 0, pct: 50, need: 5 });
  assert.equal(growthInfo('perro', 500).pct, 100);
  const d = rich();
  buy(d, 'perro', 'Toby', NOW);
  assert.equal(boostFor(d, 'perro'), 1);
  buy(d, 'cuenco-agua', '', NOW);
  assert.equal(boostFor(d, 'perro'), 1.5);
  buy(d, 'cama', '', NOW);
  buy(d, 'juguete', '', NOW);
  assert.equal(boostFor(d, 'perro'), 2);
});

test('un acierto da XP a las mascotas y avisa al subir de etapa', () => {
  const d = rich();
  buy(d, 'cactus', 'Pin', NOW);
  buy(d, 'regadera', '', NOW); // ×1,5
  let grown = [];
  for (let i = 0; i < 7; i++) grown = grown.concat(awardXp(d).grown);
  assert.equal(petsOf(d)[0].xp, 10.5);
  assert.equal(grown.length, 1);
  assert.equal(grown[0].stage, 1);
});

test('3 fallos seguidos: las mascotas se enfadan y ensucian (el cactus solo se marchita)', () => {
  const d = rich();
  buy(d, 'cactus', 'Pin', NOW);
  buy(d, 'gato', 'Michi', NOW);
  applyAnswer(d, Q, false, NOW);
  applyAnswer(d, Q, false, NOW);
  assert.ok(petsOf(d).every((p) => p.mood === 'ok' && p.mess === 0));
  const r = applyAnswer(d, Q, false, NOW);
  assert.equal(r.mischief.length, 2);
  const [cactus, gato] = petsOf(d);
  assert.equal(cactus.mood, 'angry');
  assert.equal(cactus.mess, 0);
  assert.equal(gato.mood, 'angry');
  assert.equal(gato.mess, 1);
  // 3 fallos más: otra tanda, la suciedad se acumula hasta el máximo
  for (let i = 0; i < 3; i++) applyAnswer(d, Q, false, NOW);
  assert.equal(petsOf(d)[1].mess, 2);
  for (let i = 0; i < 12; i++) applyAnswer(d, Q, false, NOW);
  assert.equal(petsOf(d)[1].mess, 3);
});

test('un acierto reinicia la cuenta de fallos seguidos', () => {
  const d = rich();
  buy(d, 'gato', 'Michi', NOW);
  applyAnswer(d, Q, false, NOW);
  applyAnswer(d, Q, false, NOW);
  applyAnswer(d, Q, true, NOW);
  assert.equal(d.streak.wrong, 0);
  applyAnswer(d, Q, false, NOW);
  applyAnswer(d, Q, false, NOW);
  assert.equal(petsOf(d)[0].mood, 'ok');
});

test('cuidados: calmar y limpiar, con contadores', () => {
  const d = rich();
  const { uid } = buy(d, 'perro', 'Toby', NOW);
  mischief(d);
  assert.equal(calmPet(d, uid), true);
  assert.equal(calmPet(d, uid), false); // ya calmado
  assert.equal(cleanMess(d, uid), true);
  assert.equal(cleanMess(d, uid), false); // nada que limpiar
  assert.equal(d.stats.care.calmed, 1);
  assert.equal(d.stats.care.cleaned, 1);
  assert.equal(petsOf(d)[0].mood, 'ok');
});

test('mascota enfadada o sucia crece a la mitad y no acumula alegría', () => {
  const d = rich();
  const { uid } = buy(d, 'gato', 'Michi', NOW);
  mischief(d);
  awardXp(d);
  assert.equal(petsOf(d)[0].xp, 0.5);
  assert.equal(petsOf(d)[0].joy, 0);
  calmPet(d, uid);
  cleanMess(d, uid);
  awardXp(d);
  assert.equal(petsOf(d)[0].xp, 1.5);
  assert.equal(petsOf(d)[0].joy, 1);
});

test('alegría → moneda: se genera, se coge una sola vez y vale más si es adulta', () => {
  const d = rich(10);
  const { uid } = buy(d, 'cactus', 'Pin', NOW);
  let found = [];
  for (let i = 0; i < JOY_TARGET; i++) found = found.concat(awardXp(d).found);
  assert.equal(found.length, 1);
  assert.equal(petsOf(d)[0].coin, true);
  const before = d.coins;
  assert.equal(coinValue(petsOf(d)[0]), stageOf('cactus', petsOf(d)[0].xp) === 2 ? 2 : 1);
  const v = collectCoin(d, uid);
  assert.ok(v >= 1);
  assert.equal(d.coins, before + v);
  assert.equal(collectCoin(d, uid), 0);
  assert.equal(d.stats.care.coins, 1);
  assert.equal(d.stats.earned, v);
});
