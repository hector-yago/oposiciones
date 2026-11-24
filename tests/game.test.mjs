import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyDoc } from '../js/migrations.js';
import { applyAnswer, rewardFor } from '../js/economy.js';
import { DAY_MS, INTERVAL_DAYS, MIN_GAP, pickNext, statusOf, updateProgress } from '../js/scheduler.js';

const Q = { id: 'q1', titulo: 'Título I' };
const NOW = 1_700_000_000_000;

test('recompensas: 1 moneda, +1 en la racha 3, +2 en la 10 (y la racha se reinicia)', () => {
  assert.equal(rewardFor(1).total, 1);
  assert.equal(rewardFor(2).total, 1);
  assert.equal(rewardFor(3).total, 2);
  assert.equal(rewardFor(4).total, 1);
  assert.equal(rewardFor(10).total, 3);
  assert.equal(rewardFor(10).resetStreak, true);
});

test('secuencia de 10 aciertos = 10 + 1 + 2 = 13 monedas y racha a 0', () => {
  const doc = emptyDoc();
  for (let i = 0; i < 10; i++) applyAnswer(doc, Q, true, NOW);
  assert.equal(doc.coins, 13);
  assert.equal(doc.streak.current, 0);
  assert.equal(doc.streak.best, 10);
  // el bonus de 3 se puede volver a ganar tras el 10
  for (let i = 0; i < 3; i++) applyAnswer(doc, Q, true, NOW);
  assert.equal(doc.coins, 13 + 4);
});

test('un fallo corta la racha, no da monedas y cuenta en estadísticas', () => {
  const doc = emptyDoc();
  applyAnswer(doc, Q, true, NOW);
  applyAnswer(doc, Q, true, NOW);
  const r = applyAnswer(doc, Q, false, NOW);
  assert.equal(r.coins, 0);
  assert.equal(doc.streak.current, 0);
  assert.equal(doc.coins, 2);
  assert.deepEqual(doc.stats.byTitle['Título I'], { ok: 2, ko: 1 });
  assert.equal(doc.stats.answered, 3);
});

test('progreso: acertar sube de caja con intervalos crecientes; fallar vuelve a la caja 0', () => {
  let p = updateProgress(undefined, true, NOW, 1);
  assert.equal(p.box, 1);
  assert.equal(p.due, NOW + INTERVAL_DAYS[1] * DAY_MS);
  p = updateProgress(p, true, NOW, 2);
  assert.equal(p.box, 2);
  assert.equal(p.due, NOW + 3 * DAY_MS);
  for (let i = 0; i < 6; i++) p = updateProgress(p, true, NOW, 3 + i);
  assert.equal(p.box, 5);
  assert.equal(statusOf(p), 'mastered');
  p = updateProgress(p, false, NOW, 20);
  assert.equal(p.box, 0);
  assert.equal(p.failedSeq, 20);
  assert.equal(statusOf(p), 'failed');
});

const bank = Array.from({ length: 30 }, (_, i) => ({ id: `q${i}`, titulo: 'T' }));

test('selección: prioriza nuevas, no repite las recientes y devuelve siempre algo', () => {
  const rng = () => 0;
  const q = pickNext(bank, {}, { now: NOW, seq: 0, rng });
  assert.ok(q);
  const recent = ['q0', 'q1'];
  const q2 = pickNext(bank, {}, { now: NOW, seq: 0, recent, rng });
  assert.ok(!recent.includes(q2.id));
});

test('selección: una fallada no vuelve antes de MIN_GAP preguntas', () => {
  const progress = { q0: updateProgress(undefined, false, NOW, 5) };
  // todas las demás ya dominadas y no vencidas: solo q0 es candidata cuando toque
  for (let i = 1; i < 30; i++) progress[`q${i}`] = updateProgress(updateProgress(undefined, true, NOW, 1), true, NOW, 2);
  const early = pickNext(bank, progress, { now: NOW, seq: 5 + MIN_GAP - 1, rng: () => 0 });
  assert.notEqual(early.id, 'q0'); // cae al repaso anticipado de otra
  const later = pickNext(bank, progress, { now: NOW, seq: 5 + MIN_GAP, rng: () => 0 });
  assert.equal(later.id, 'q0');
});

test('selección: lo acertado no vence hasta su intervalo; con todo al día hay repaso anticipado', () => {
  const progress = {};
  for (const q of bank) progress[q.id] = updateProgress(undefined, true, NOW, 1);
  const q = pickNext(bank, progress, { now: NOW + 1000, seq: 50, rng: () => 0.5 });
  assert.ok(q); // no se queda sin preguntas
  const due = pickNext(bank, progress, { now: NOW + 2 * DAY_MS, seq: 50, rng: () => 0.5 });
  assert.ok(due);
});

test('selección: las falladas salen de vez en cuando (poca frecuencia frente a las nuevas)', () => {
  const progress = {};
  for (let i = 0; i < 3; i++) progress[`q${i}`] = updateProgress(undefined, false, NOW, 1);
  let seed = 7;
  const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let failed = 0;
  const N = 400;
  for (let i = 0; i < N; i++) if (progress[pickNext(bank, progress, { now: NOW, seq: 100, rng }).id]) failed++;
  const ratio = failed / N;
  assert.ok(ratio > 0.05 && ratio < 0.35, `ratio de falladas ${ratio}`);
});
