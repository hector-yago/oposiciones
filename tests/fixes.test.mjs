// Regresiones de la revisión de seguridad y de corrección de la 0.5.0.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LIMITS, emptyDoc, migrate } from '../js/migrations.js';
import { BY_ID, SPECIES, isPet } from '../js/catalog.js';
import { SOUNDS, soundLine, speciesWithoutPhrase } from '../js/phrases.js';
import { decodeCode, encodeCode, MAX_CODE_CHARS } from '../js/share.js';
import { createStore, memoryAdapter } from '../js/store.js';
import { claimDaily } from '../js/daily.js';
import { COOLDOWN_MS, isAvailable, remainingMs } from '../js/joker.js';
import { BREED_COOLDOWN_MS, canBreed } from '../js/breed.js';
import { recordExam } from '../js/exam.js';
import { applyAnswer } from '../js/economy.js';
import { ensureMissions, weekKey } from '../js/missions.js';
import { buildNotices } from '../js/notifications.js';
import { buy, petsOf, stageOf } from '../js/shop.js';
import * as study from '../js/study.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const at = (y, m, d, h = 10) => new Date(y, m - 1, d, h, 0, 0).getTime();
const T = at(2026, 11, 24);
const base = () => {
  const d = emptyDoc();
  d.profile = { name: 'Ana', gender: 'chica' };
  return d;
};

test('frases: cada especie tiene la suya y soundLine nunca lanza', () => {
  assert.deepEqual(speciesWithoutPhrase(), []);
  for (const sp of Object.keys(SPECIES)) assert.match(soundLine(sp, 'Bola'), /Bola/, sp);
  assert.match(soundLine('especie-nueva', 'Bola'), /Bola/);
  assert.ok(SOUNDS.raton && SOUNDS.buho);
});

test('catálogo: «constructor» y «__proto__» no cuentan como artículos ni mascotas', () => {
  for (const id of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
    assert.equal(isPet(id), false, id);
    assert.equal(Object.hasOwn(BY_ID, id), false, id);
  }
});

test('saneado: descarta objetos desconocidos y la app sigue funcionando con lo que quede', () => {
  const evil = { schemaVersion: 4, profile: { name: 'Ana', gender: 'chica' }, inventory: [{ uid: 1, itemId: 'constructor' }, { uid: 2, itemId: '__proto__' }, { uid: 3, itemId: 'zzz' }, { uid: 4, itemId: 'gato', name: 'Michi', xp: 4 }] };
  const { doc } = migrate(evil);
  assert.deepEqual(doc.inventory.map((i) => i.itemId), ['gato']);
  for (const p of petsOf(doc)) assert.doesNotThrow(() => stageOf(p.itemId, p.xp));
});

test('saneado: topes de tamaño y claves __proto__ en los mapas', () => {
  const big = {};
  for (let i = 0; i < LIMITS.progress + 500; i++) big[`ce-${i}`] = { box: 1, ok: 1, ko: 0 };
  const json = `{"schemaVersion":4,"progress":${JSON.stringify(big).slice(0, -1)},"__proto__":{"box":3}},"stats":{"byTitle":{"__proto__":{"ok":9},"T":{"ok":1,"ko":1}}},"flags":{"__proto__":true,"ok":true}}`;
  const { doc } = migrate(JSON.parse(json));
  assert.equal(Object.keys(doc.progress).length, LIMITS.progress);
  assert.equal(Object.getPrototypeOf(doc.progress), Object.prototype);
  assert.equal(doc.progress.box, undefined);
  assert.deepEqual(Object.keys(doc.stats.byTitle), ['T']);
  assert.deepEqual(Object.keys(doc.flags), ['ok']);
  const manyItems = Array.from({ length: LIMITS.inventory + 100 }, (_, i) => ({ uid: i + 1, itemId: 'cuadro' }));
  assert.equal(migrate({ schemaVersion: 4, inventory: manyItems }).doc.inventory.length, LIMITS.inventory);
  assert.equal(({}).box, undefined, 'Object.prototype intacto');
});

test('código de copia: se rechaza lo desmesurado', () => {
  assert.throws(() => decodeCode(`OPO1:${'A'.repeat(MAX_CODE_CHARS + 1)}`), /demasiado grande/);
  assert.equal(decodeCode(encodeCode('{"a":1}')), '{"a":1}');
});

test('fechas: solo se aceptan fechas reales y el objetivo decimal se redondea', () => {
  assert.equal(migrate({ schemaVersion: 4, goal: { examDate: '2026-13-45' } }).doc.goal.examDate, '');
  assert.equal(migrate({ schemaVersion: 4, goal: { examDate: '2026-02-30' } }).doc.goal.examDate, '');
  assert.equal(migrate({ schemaVersion: 4, goal: { examDate: '2028-02-29' } }).doc.goal.examDate, '2028-02-29');
  assert.equal(migrate({ schemaVersion: 4, goal: { daily: 7.5 } }).doc.goal.daily, 8);
});

test('almacén: un guardado que falla no bloquea los siguientes', async () => {
  const inner = memoryAdapter();
  let fail = false;
  const adapter = { ...inner, put: async (k, v) => (fail ? ((fail = false), Promise.reject(new Error('cuota llena'))) : inner.put(k, v)) };
  const store = createStore(adapter);
  await store.load();
  fail = true;
  await assert.rejects(() => store.update((d) => { d.coins = 5; }), /cuota/);
  await store.update((d) => { d.coins = 9; });
  assert.equal((await inner.get('doc')).coins, 9, 'el segundo guardado sí llega al disco');
});

test('bonus diario: con el reloj atrasado no se cobra otra vez', () => {
  const d = base();
  claimDaily(d, at(2026, 11, 20));
  claimDaily(d, at(2026, 11, 25));
  const coins = d.coins;
  assert.equal(claimDaily(d, at(2026, 11, 24)), null);
  assert.equal(d.coins, coins);
  assert.equal(d.daily.last, '2026-11-25');
  assert.equal(claimDaily(d, at(2026, 11, 25, 20)), null);
});

test('comodín y cría: un reloj adelantado no los bloquea más del enfriamiento', () => {
  const d = base();
  d.joker.lastUsed = T + 30 * 86400000;
  assert.equal(remainingMs(d, T), COOLDOWN_MS);
  assert.equal(isAvailable(d, T), false);
  d.coins = 1000;
  buy(d, 'jardin', '', T);
  buy(d, 'patito', 'A', T);
  buy(d, 'patito', 'B', T);
  d.inventory.forEach((p) => (p.xp = 500));
  d.breed.patito = T + 60 * 86400000;
  assert.equal(canBreed(d, 'patito', T).left, BREED_COOLDOWN_MS);
});

test('examen entregado en blanco: no cuenta como examen ni como misión', () => {
  const d = base();
  ensureMissions(d, T);
  d.missions.weekly = [{ id: 'exam-1', type: 'exam', target: 1, titulo: '', progress: 0, reward: 12, claimed: false }];
  const r = recordExam(d, { n: 10, ok: 0, ko: 0, blank: 10, secs: 5 }, T);
  assert.equal(r.recorded, false);
  assert.equal(d.exams.length, 0);
  assert.equal(d.missions.weekly[0].progress, 0);
  assert.equal(d.coins, 0);
  const r2 = recordExam(d, { n: 10, ok: 1, ko: 0, blank: 9, secs: 5 }, T);
  assert.equal(r2.recorded, true);
  assert.equal(d.exams.length, 1);
  assert.equal(d.missions.weekly[0].progress, 1);
});

test('misiones: las de un día anterior no cuentan respuestas de hoy (se renuevan antes)', () => {
  const d = base();
  ensureMissions(d, at(2026, 11, 23));
  const ayer = d.missions.daily.map((m) => m.id);
  d.missions.daily[0] = { id: 'answer-10', type: 'answer', target: 10, titulo: '', progress: 0, reward: 2, claimed: false };
  applyAnswer(d, { id: 'q', titulo: 'T', tema: 'ce' }, true, at(2026, 11, 24));
  assert.equal(d.missions.day, '2026-11-24');
  assert.ok(d.missions.daily.every((m) => m.progress <= 1));
  assert.notDeepEqual(d.missions.daily.map((m) => m.id), ayer);
  assert.equal(weekKey(at(2026, 11, 24)), d.missions.week);
});

test('avisos: singular y plural correctos', () => {
  const d = base();
  d.stats.answered = 30;
  d.goal = { examDate: '2026-11-25', daily: 4, bonusDay: '' };
  d.stats.byDay = { '2026-11-24': { n: 3, ok: 3 } };
  const text = buildNotices(d, T).map((n) => n.text).join(' | ');
  assert.match(text, /Te falta 1 pregunta para cumplir/);
  assert.match(text, /Falta 1 día para tu examen/);
  d.stats.byDay = { '2026-11-24': { n: 1, ok: 1 } };
  assert.match(buildNotices(d, T).map((n) => n.text).join(' | '), /Te faltan 3 preguntas/);
});

test('estudio: finishExam y vfNext no se ejecutan dos veces (doble toque)', async () => {
  const store = createStore(memoryAdapter(), { now: () => T });
  await store.load();
  await store.update((d) => { d.profile = { name: 'Ana', gender: 'chica' }; });
  const questions = Array.from({ length: 12 }, (_, i) => ({ id: `ce-${i}`, tema: 'ce', titulo: 'Título I', articulo: `${i + 1}`, enunciado: `P${i}`, opciones: ['a', 'b', 'c', 'd'], correcta: 0, explicacion: 'x', dificultad: 1 }));
  const ctx = { doc: () => store.state, get store() { return store; }, esc: String, plural: (n) => `${n}`, toast() {}, rerender() {}, banks: () => ({ ce: questions }), allQuestions: () => questions, afterChange: async () => {}, getTema: () => ({ id: 'ce' }), activeTema: () => 'ce' };
  study.init(ctx);
  await study.onAct('exam-size', { dataset: { n: '10' } });
  await study.onAct('exam-start', { dataset: {} });
  for (let i = 0; i < 10; i++) await study.onAct('exam-answer', { dataset: { p: '0' } });
  await Promise.all([study.finishExam(), study.finishExam()]);
  study.clearTimers();
  assert.equal(store.state.exams.length, 1, 'un solo examen registrado');
  assert.equal(store.state.stats.answered, 10, 'respuestas contadas una vez');

  const plays = () => store.state.minigames.plays;
  await study.onAct('game-vf', { dataset: {} });
  for (let i = 0; i < 8; i++) {
    await study.onAct('vf-answer', { dataset: { v: '1' } });
    if (i < 7) await study.onAct('vf-next', { dataset: {} });
  }
  await Promise.all([study.onAct('vf-next', { dataset: {} }), study.onAct('vf-next', { dataset: {} })]);
  assert.equal(plays(), 1, 'el premio de la partida se cuenta una vez');
  assert.equal(store.state.stats.games, 1);
});

test('index.html: CSP presente y sin scripts en línea; el service worker solo recurre a index.html en navegaciones', () => {
  const html = read('index.html');
  assert.match(html, /http-equiv="Content-Security-Policy"/);
  assert.match(html, /script-src 'self'/);
  assert.match(html, /object-src 'none'/);
  assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(html), 'hay un <script> en línea');
  assert.match(read('sw.js'), /req\.mode === 'navigate'/);
});
