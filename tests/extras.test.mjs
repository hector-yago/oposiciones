// Comodín, bonus diario, caja misteriosa, estadísticas y logros.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CURRENT_SCHEMA, emptyDoc, migrate } from '../js/migrations.js';
import { COOLDOWN_MS, formatRemaining, isAvailable, pickHidden, remainingMs, useJoker } from '../js/joker.js';
import { claimDaily, dayOfWeek, openBox } from '../js/daily.js';
import { byArticle, dayKey, lastDays, recordDay, studyStreak } from '../js/stats.js';
import { ACHIEVEMENTS, newlyUnlocked, unlock } from '../js/achievements.js';
import { EXCLUSIVES } from '../js/catalog.js';
import { addItem, buy } from '../js/shop.js';
import { applyAnswer } from '../js/economy.js';

const at = (y, m, d, h = 10) => new Date(y, m - 1, d, h, 0, 0).getTime();
const base = () => {
  const d = emptyDoc();
  d.profile = { name: 'Ana', gender: 'chica' };
  return d;
};

test('comodín: 1 uso cada 4 h con cuenta atrás', () => {
  const d = base();
  const t0 = at(2026, 11, 24);
  assert.equal(isAvailable(d, t0), true);
  useJoker(d, t0);
  assert.equal(d.joker.uses, 1);
  assert.equal(isAvailable(d, t0 + COOLDOWN_MS - 1), false);
  assert.equal(remainingMs(d, t0 + 3600000), COOLDOWN_MS - 3600000);
  assert.throws(() => useJoker(d, t0 + 1000), /disponible en/);
  assert.equal(isAvailable(d, t0 + COOLDOWN_MS), true);
  assert.equal(formatRemaining(2 * 3600000 + 13 * 60000), '2 h 13 min');
  assert.equal(formatRemaining(45 * 60000), '45 min');
});

test('comodín: oculta 2 incorrectas y deja la correcta y una más', () => {
  for (let correct = 0; correct < 4; correct++) {
    for (const r of [0, 0.34, 0.67, 0.99]) {
      const hidden = pickHidden(correct, () => r);
      assert.equal(hidden.length, 2);
      assert.ok(!hidden.includes(correct));
      assert.equal(new Set(hidden).size, 2);
    }
  }
});

test('bonus diario: el primer día no da moneda, los siguientes sí; saltarse un día reinicia', () => {
  const d = base();
  const r1 = claimDaily(d, at(2026, 11, 24));
  assert.deepEqual(r1, { coins: 0, streak: 1, box: false, first: true });
  assert.equal(claimDaily(d, at(2026, 11, 24, 20)), null); // mismo día
  const r2 = claimDaily(d, at(2026, 11, 25));
  assert.equal(r2.coins, 1);
  assert.equal(r2.streak, 2);
  assert.equal(d.coins, 1);
  assert.equal(d.stats.earned, 1);
  const r3 = claimDaily(d, at(2026, 11, 27)); // se salta un día
  assert.equal(r3.streak, 1);
  assert.equal(d.coins, 2);
});

test('caja misteriosa: al 7.º día seguido; da un exclusivo distinto cada vez y luego monedas', () => {
  const d = base();
  let box = false;
  for (let day = 0; day < 7; day++) box = claimDaily(d, at(2026, 11, 1 + day)).box;
  assert.equal(box, true);
  assert.equal(d.daily.boxes, 1);
  assert.equal(dayOfWeek(d.daily.streak), 7);
  const got = new Set();
  for (let i = 0; i < EXCLUSIVES.length; i++) {
    d.daily.boxes = 1;
    const res = openBox(d, 1, () => 0);
    got.add(res.itemId);
  }
  assert.equal(got.size, EXCLUSIVES.length);
  d.daily.boxes = 1;
  const coins = d.coins;
  assert.deepEqual(openBox(d, 1), { coins: 5 });
  assert.equal(d.coins, coins + 5);
  assert.throws(() => openBox(d, 1), /ninguna caja/);
  assert.equal(d.daily.opened, EXCLUSIVES.length + 1);
});

test('días y racha de estudio', () => {
  const d = base();
  for (const day of [22, 23, 24]) recordDay(d, at(2026, 11, day), true);
  recordDay(d, at(2026, 11, 24), false);
  assert.equal(studyStreak(d, at(2026, 11, 24)), 3);
  assert.equal(studyStreak(d, at(2026, 11, 25)), 3); // hoy aún sin estudiar: cuenta hasta ayer
  assert.equal(studyStreak(d, at(2026, 11, 27)), 0);
  const days = lastDays(d, at(2026, 11, 24), 3);
  assert.deepEqual(days.map((x) => x.key), ['2026-11-22', '2026-11-23', '2026-11-24']);
  assert.deepEqual(days[2], { key: '2026-11-24', n: 2, ok: 1 });
  assert.equal(dayKey(at(2026, 1, 5)), '2026-01-05');
});

test('artículos con más fallos', () => {
  const d = base();
  const qs = [
    { id: 'a', articulo: '15.1', titulo: 'Título I' },
    { id: 'b', articulo: '15.2', titulo: 'Título I' },
    { id: 'c', articulo: '20', titulo: 'Título I' },
  ];
  d.progress = { a: { ok: 1, ko: 3 }, b: { ok: 0, ko: 1 }, c: { ok: 5, ko: 0 } };
  const r = byArticle(d, qs);
  assert.equal(r.length, 1);
  assert.deepEqual(r[0], { articulo: '15', titulo: 'Título I', ok: 1, ko: 4, pct: 20 });
});

test('logros: se desbloquean una vez y por sus condiciones', () => {
  const d = base();
  const ctx = () => ({ doc: d, questions: [], now: at(2026, 11, 24) });
  assert.deepEqual(newlyUnlocked(ctx()), []);
  d.coins = 100;
  buy(d, 'pecera', '', 1);
  buy(d, 'pez', 'Nemo', 1);
  const ids = newlyUnlocked(ctx());
  for (const id of ['first_pet', 'has_pez', 'first_tool', 'aquarium']) assert.ok(ids.includes(id), id);
  unlock(d, ids, 5);
  assert.deepEqual(newlyUnlocked(ctx()), []);
  assert.equal(d.achievements.aquarium, 5);
});

test('logros de preguntas y de tema dominado', () => {
  const d = base();
  const questions = Array.from({ length: 20 }, (_, i) => ({ id: `ce-${i}`, tema: 'ce', titulo: 'Título I', articulo: '1' }));
  const ctx = { doc: d, questions, now: 1 };
  d.stats.answered = 50;
  d.stats.correct = 30;
  let ids = newlyUnlocked(ctx);
  assert.ok(ids.includes('answered_50') && ids.includes('correct_10') && !ids.includes('answered_100'));
  for (const q of questions) d.progress[q.id] = { box: 5, ok: 5, ko: 0, last: 0, due: 0, failedSeq: 0 };
  ids = newlyUnlocked(ctx);
  for (const id of ['tema_mastered', 'ce_mastered', 'ce_half', 'title_mastered']) assert.ok(ids.includes(id), id);
});

test('logros de cuidados, colección y entrada diaria', () => {
  const d = base();
  d.stats.care = { cleaned: 10, calmed: 1, coins: 1 };
  d.daily.opened = 1;
  d.daily.streak = 7;
  for (const e of EXCLUSIVES) addItem(d, e.id, '', 1);
  const ids = newlyUnlocked({ doc: d, questions: [], now: 1 });
  for (const id of ['clean_1', 'clean_10', 'calm_1', 'petcoin_1', 'box_first', 'login_7', 'exclusive_1', 'exclusive_all']) assert.ok(ids.includes(id), id);
});

test('los ids de logros son únicos y cada uno tiene objetivo y arte', () => {
  assert.equal(new Set(ACHIEVEMENTS.map((a) => a.id)).size, ACHIEVEMENTS.length);
  for (const a of ACHIEVEMENTS) assert.ok(a.target >= 1 && a.name && a.desc && a.group, a.id);
  assert.ok(ACHIEVEMENTS.length >= 50);
});

test('migración 1→2: conserva datos y añade tienda, cuidados, comodín y entrada diaria', () => {
  const { doc, from, to } = migrate({ schemaVersion: 1, profile: { name: 'Ana', gender: 'chica' }, coins: 7, streak: { current: 1, best: 4 }, progress: {}, stats: { answered: 5, correct: 4, byTitle: {} }, flags: {}, settings: {}, meta: {} });
  assert.equal(from, 1);
  assert.equal(to, CURRENT_SCHEMA);
  assert.equal(doc.coins, 7);
  assert.equal(doc.stats.earned, 7);
  assert.deepEqual(doc.inventory, []);
  assert.deepEqual(doc.stats.care, { cleaned: 0, calmed: 0, coins: 0 });
  assert.deepEqual(doc.daily, { last: '', streak: 0, boxes: 0, opened: 0 });
  assert.equal(doc.streak.wrong, 0);
  assert.equal(doc.nextUid, 1);
});

test('saneado v2: mascotas con estado inválido se normalizan', () => {
  const { doc } = migrate({
    schemaVersion: 2,
    profile: { name: 'Ana', gender: 'chica' },
    inventory: [
      { uid: 3, itemId: 'gato', name: 'Michi', xp: 12.345, mood: 'loco', mess: 99, joy: -5, coin: 'sí' },
      { uid: 3, itemId: 'perro', name: 'Duplicado' },
      { itemId: 'sin-uid' },
    ],
  });
  assert.equal(doc.inventory.length, 1);
  const p = doc.inventory[0];
  assert.deepEqual([p.mood, p.mess, p.joy, p.coin, p.xp], ['ok', 3, 0, true, 12.35]);
  assert.equal(doc.nextUid, 4);
});

test('economía: el resultado de un acierto incluye monedas encontradas y fallos seguidos', () => {
  const d = base();
  const r = applyAnswer(d, { id: 'q', titulo: 'T' }, false, 1);
  assert.equal(r.wrong, 1);
  assert.deepEqual(r.mischief, []);
});
