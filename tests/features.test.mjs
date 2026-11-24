// Misiones, examen, minijuegos, objetivo, cría, ropa y requisitos de la tienda.
import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyDoc, migrate } from '../js/migrations.js';
import { applyAnswer } from '../js/economy.js';
import { ensureMissions, claimMission, isDone, seeded, studyDaysThisWeek, trackEvent, weekKey, missionText } from '../js/missions.js';
import { EXAM_SIZES, PASS_MARK, applyExamAnswer, examCoins, formatSecs, pickExam, recordExam, scoreOf, timeLimit } from '../js/exam.js';
import { MAX_REWARDED_PLAYS, TITLE_INFO, awardGame, canEarn, pairsRound, vfRound } from '../js/minigames.js';
import { GOAL_BONUS, claimGoalBonus, daysToExam, goalPct, todayCount } from '../js/goal.js';
import { BREED_COOLDOWN_MS, breed, canBreed, rollVariant } from '../js/breed.js';
import { addItem, buy, canBuy, equip } from '../js/shop.js';
import { calmPet, mischief } from '../js/shop.js';

const at = (y, m, d, h = 10) => new Date(y, m - 1, d, h, 0, 0).getTime();
const base = () => {
  const d = emptyDoc();
  d.profile = { name: 'Ana', gender: 'chica' };
  return d;
};
const T = at(2026, 11, 24); // martes
const Q = { id: 'q1', titulo: 'Título I', articulo: '15', opciones: ['a', 'b', 'c', 'd'], correcta: 0, enunciado: '¿?', explicacion: 'x' };
const questions = Array.from({ length: 30 }, (_, i) => ({ ...Q, id: `ce-${i}`, titulo: i % 2 ? 'Título I' : 'Título II' }));

test('misiones: se crean 3 diarias y 3 semanales, iguales el mismo día y renovadas al cambiar', () => {
  const a = base();
  assert.equal(ensureMissions(a, T), true);
  assert.equal(a.missions.daily.length, 3);
  assert.equal(a.missions.weekly.length, 3);
  assert.equal(new Set(a.missions.daily.map((m) => m.id)).size, 3);
  const b = base();
  ensureMissions(b, T + 3600000);
  assert.deepEqual(b.missions, a.missions, 'mismo día = mismas misiones');
  assert.equal(ensureMissions(a, T + 7200000), false, 'no cambia el mismo día');
  const weekly = a.missions.weekly;
  assert.equal(ensureMissions(a, at(2026, 11, 25)), true); // otro día, misma semana
  assert.deepEqual(a.missions.weekly, weekly, 'las semanales se mantienen toda la semana');
  assert.equal(weekKey(at(2026, 11, 23)), weekKey(at(2026, 11, 29)));
  assert.notEqual(weekKey(at(2026, 11, 29)), weekKey(at(2026, 11, 30)));
  assert.equal(a.missions.daily.every((m) => missionText(m)), true);
});

test('misiones: el generador es determinista', () => {
  const r1 = seeded('x');
  const r2 = seeded('x');
  assert.deepEqual([r1(), r1(), r1()], [r2(), r2(), r2()]);
});

test('misiones: progreso con respuestas, cuidados y juegos; cobro una sola vez', () => {
  const d = base();
  d.missions = {
    day: '2026-11-24',
    daily: [
      { id: 'answer-3', type: 'answer', target: 3, titulo: '', progress: 0, reward: 4, claimed: false },
      { id: 'correct-2', type: 'correct', target: 2, titulo: '', progress: 0, reward: 3, claimed: false },
      { id: 'titulo-1', type: 'titulo', target: 1, titulo: 'Título I', progress: 0, reward: 2, claimed: false },
    ],
    week: weekKey(T),
    weekly: [
      { id: 'streak-3', type: 'streak', target: 3, titulo: '', progress: 0, reward: 5, claimed: false },
      { id: 'care-1', type: 'care', target: 1, titulo: '', progress: 0, reward: 1, claimed: false },
      { id: 'game-1', type: 'game', target: 1, titulo: '', progress: 0, reward: 1, claimed: false },
    ],
  };
  applyAnswer(d, { id: 'a', titulo: 'Título II' }, true, T);
  applyAnswer(d, { id: 'b', titulo: 'Título I' }, true, T);
  applyAnswer(d, { id: 'c', titulo: 'Título I' }, false, T);
  const [ans, cor, tit] = d.missions.daily;
  assert.equal(ans.progress, 3);
  assert.equal(cor.progress, 2);
  assert.equal(tit.progress, 1);
  assert.equal(d.missions.weekly[0].progress, 2, 'racha máxima alcanzada');
  trackEvent(d, 'care');
  trackEvent(d, 'game');
  assert.ok([...d.missions.daily, ...d.missions.weekly].filter((m) => ['care', 'game'].includes(m.type)).every(isDone));
  const coins = d.coins;
  assert.equal(claimMission(d, 'daily', 'answer-3'), 4);
  assert.equal(claimMission(d, 'daily', 'answer-3'), 0, 'no se cobra dos veces');
  assert.equal(claimMission(d, 'weekly', 'streak-3'), 0, 'sin terminar');
  assert.equal(d.coins, coins + 4);
});

test('misiones: días estudiados esta semana', () => {
  const d = base();
  d.stats.byDay = { '2026-11-23': { n: 3, ok: 2 }, '2026-11-24': { n: 1, ok: 1 }, '2026-11-20': { n: 9, ok: 9 } };
  assert.equal(studyDaysThisWeek(d, T), 2);
});

test('examen: nota con penalización 1/3, aprobado desde 5 y monedas según nota', () => {
  assert.equal(scoreOf({ ok: 10, ko: 0, n: 10 }), 10);
  assert.equal(scoreOf({ ok: 6, ko: 3, n: 10 }), 5);
  assert.equal(scoreOf({ ok: 0, ko: 10, n: 10 }), 0);
  assert.equal(scoreOf({ ok: 5, ko: 0, n: 10 }), 5);
  assert.equal(PASS_MARK, 5);
  assert.equal(examCoins(4.99), 0);
  assert.equal(examCoins(5), 5);
  assert.equal(examCoins(7.8), 7);
  assert.equal(examCoins(10), 10);
  assert.equal(timeLimit(20), 1000);
  assert.equal(formatSecs(125), '2:05');
  assert.deepEqual(EXAM_SIZES, [10, 20, 40, 100]);
});

test('examen: elige preguntas distintas y registra el resultado sin tocar racha ni monedas por respuesta', () => {
  const picked = pickExam(questions, 10);
  assert.equal(picked.length, 10);
  assert.equal(new Set(picked.map((q) => q.id)).size, 10);
  assert.equal(pickExam(questions, 500).length, 30);
  const d = base();
  d.streak.current = 4;
  for (const q of picked.slice(0, 8)) applyExamAnswer(d, q, true, T);
  for (const q of picked.slice(8)) applyExamAnswer(d, q, false, T);
  assert.equal(d.coins, 0);
  assert.equal(d.streak.current, 4);
  assert.equal(d.stats.answered, 10);
  assert.equal(Object.keys(d.progress).length, 10);
  const r = recordExam(d, { n: 10, ok: 8, ko: 2, blank: 0, secs: 300 }, T);
  assert.equal(r.passed, true);
  assert.equal(r.score, 7.33);
  assert.equal(r.coins, 7);
  assert.equal(d.coins, 7);
  assert.equal(d.exams.length, 1);
  for (let i = 0; i < 40; i++) recordExam(d, { n: 10, ok: 1, ko: 9, blank: 0, secs: 10 }, T + i);
  assert.equal(d.exams.length, 30, 'el historial está acotado');
});

test('minijuegos: emparejar y verdadero/falso se generan bien', () => {
  const r = pairsRound(() => 0.5, 6);
  assert.equal(r.pairs.length, 6);
  assert.equal(new Set(r.left.map((x) => x.id)).size, 6);
  assert.deepEqual(r.left.map((x) => x.id).sort(), r.right.map((x) => x.id).sort());
  assert.equal(TITLE_INFO.length, 11);
  const seen = new Set();
  for (let i = 0; i < 50; i++) {
    const v = vfRound(questions, () => Math.random());
    seen.add(v.truth);
    const q = questions.find((x) => x.id === v.qid);
    assert.equal(v.truth, v.option === q.opciones[q.correcta]);
  }
  assert.equal(seen.size, 2, 'salen verdaderas y falsas');
});

test('minijuegos: premio por rendimiento, con tope de partidas al día', () => {
  const d = base();
  ensureMissions(d, T);
  assert.equal(awardGame(d, T, 1), 3);
  assert.equal(awardGame(d, T, 0.7), 2);
  assert.equal(awardGame(d, T, 0.4), 1);
  assert.equal(canEarn(d, T), false);
  assert.equal(MAX_REWARDED_PLAYS, 3);
  assert.equal(awardGame(d, T, 1), 0, 'sin premio pasado el tope');
  assert.equal(d.coins, 6);
  assert.equal(canEarn(d, at(2026, 11, 25)), true, 'al día siguiente se reinicia');
  assert.equal(awardGame(d, at(2026, 11, 25), 0.1), 0);
});

test('objetivo: cuenta atrás, progreso y bonus único por día', () => {
  const d = base();
  d.goal = { examDate: '2026-12-04', daily: 3, bonusDay: '' };
  assert.equal(daysToExam(d.goal, T), 10);
  assert.equal(daysToExam({ examDate: '2026-11-24' }, T), 0);
  assert.equal(daysToExam({ examDate: '2026-11-01' }, T), null);
  assert.equal(daysToExam({ examDate: '' }, T), null);
  assert.equal(todayCount(d, T), 0);
  applyAnswer(d, Q, true, T);
  applyAnswer(d, Q, false, T);
  assert.equal(goalPct(d, T), 67);
  const before = d.coins;
  const r = applyAnswer(d, Q, true, T);
  assert.equal(r.goalBonus, GOAL_BONUS);
  assert.equal(d.coins, before + r.coins + GOAL_BONUS);
  assert.equal(applyAnswer(d, Q, true, T).goalBonus, 0, 'solo una vez al día');
  assert.equal(claimGoalBonus(d, T), 0);
  assert.equal(claimGoalBonus(d, at(2026, 11, 25)), 0, 'otro día sin llegar al objetivo');
});

test('ropa: solo se equipa lo comprado y en su sitio', () => {
  const d = base();
  d.coins = 100;
  assert.throws(() => equip(d, 'hat', 'gorra'), /no tienes/);
  buy(d, 'gorra', '', T);
  buy(d, 'gafas', '', T);
  equip(d, 'hat', 'gorra');
  assert.equal(d.outfit.hat, 'gorra');
  assert.throws(() => equip(d, 'face', 'gorra'), /no va ahí/);
  assert.throws(() => equip(d, 'neck', 'regadera'), /no va ahí/);
  assert.throws(() => equip(d, 'cola', 'gorra'), /no existe/);
  equip(d, 'face', 'gafas');
  equip(d, 'hat', '');
  assert.deepEqual(d.outfit, { hat: '', face: 'gafas', neck: '', top: '' });
  // el saneado descarta ropa que no se tiene
  const { doc } = migrate({ ...d, outfit: { hat: 'corona', face: 'gafas' } });
  assert.equal(doc.outfit.hat, '');
  assert.equal(doc.outfit.face, 'gafas');
});

test('tienda: el jardín es requisito de sus animales y objetos', () => {
  const d = base();
  d.coins = 500;
  assert.equal(canBuy(d, 'patito').code, 'req');
  assert.equal(canBuy(d, 'estanque').code, 'req');
  assert.equal(canBuy(d, 'jardin').ok, true);
  buy(d, 'jardin', '', T);
  assert.equal(d.coins, 460);
  assert.equal(canBuy(d, 'jardin').code, 'owned');
  assert.equal(canBuy(d, 'patito').ok, true);
  assert.equal(canBuy(d, 'estanque').ok, true);
});

test('cría: necesita 2 adultos felices y limpios, enfriamiento y no pasar del doble del máximo', () => {
  const d = base();
  d.coins = 1000;
  buy(d, 'conejo', 'Uno', T);
  buy(d, 'conejo', 'Dos', T);
  assert.equal(canBreed(d, 'conejo', T).ok, false, 'son crías');
  assert.equal(canBreed(d, 'gato', T).ok, false, 'no tiene ejemplares');
  assert.equal(canBreed(d, 'unicornio', T).ok, false);
  for (const p of d.inventory) p.xp = 500;
  assert.equal(canBreed(d, 'conejo', T).ok, true);
  mischief(d);
  assert.equal(canBreed(d, 'conejo', T).ok, false, 'enfadados no crían');
  for (const p of d.inventory) calmPet(d, p.uid);
  assert.equal(canBreed(d, 'conejo', T).ok, false, 'aún sucios');
  for (const p of d.inventory) p.mess = 0;
  assert.equal(canBreed(d, 'conejo', T).ok, true);
  // tope: el doble del máximo (conejo: 2 → 4)
  addItem(d, 'conejo', 'Tres', T);
  addItem(d, 'conejo', 'Cuatro', T);
  assert.equal(canBreed(d, 'conejo', T).ok, false);
  assert.match(canBreed(d, 'conejo', T).reason, /caben/);
});

test('cría: crea la mascota, guarda el enfriamiento y reparte variantes raras', () => {
  const d = base();
  d.coins = 1000;
  buy(d, 'jardin', '', T);
  buy(d, 'patito', 'Cua', T);
  buy(d, 'patito', 'Cuac', T);
  d.inventory.forEach((p) => (p.xp = 500));
  assert.throws(() => breed(d, 'patito', '  ', T), /nombre/);
  const r = breed(d, 'patito', 'Cría', T, () => 0.01);
  assert.equal(r.variant, 'arcoiris');
  const baby = d.inventory.find((p) => p.uid === r.uid);
  assert.equal(baby.xp, 0);
  assert.equal(baby.variant, 'arcoiris');
  assert.equal(d.breed.patito, T);
  const early = canBreed(d, 'patito', T + 86400000);
  assert.equal(early.ok, false);
  assert.match(early.reason, /día/);
  assert.equal(canBreed(d, 'patito', T + BREED_COOLDOWN_MS).ok, true);
  assert.throws(() => breed(d, 'patito', 'Otra', T + 1000), /día/);
  assert.equal(rollVariant(() => 0.04), 'arcoiris');
  assert.equal(rollVariant(() => 0.1), 'dorado');
  assert.equal(rollVariant(() => 0.2), 'azul');
  assert.equal(rollVariant(() => 0.9), '');
});

test('migración 2→3: conserva datos y añade lo nuevo con valores por defecto', () => {
  const { doc, from, to } = migrate({ schemaVersion: 2, profile: { name: 'Ana', gender: 'chica' }, coins: 5, inventory: [{ uid: 1, itemId: 'gato', name: 'Michi', xp: 3 }] });
  assert.equal(from, 2);
  assert.equal(to, 3);
  assert.equal(doc.coins, 5);
  assert.equal(doc.inventory[0].variant, '');
  assert.deepEqual(doc.exams, []);
  assert.deepEqual(doc.missions, { day: '', daily: [], week: '', weekly: [] });
  assert.deepEqual(doc.goal, { examDate: '', daily: 20, bonusDay: '' });
  assert.deepEqual(doc.minigames, { day: '', plays: 0 });
  assert.deepEqual(doc.breed, {});
  assert.equal(doc.settings.fontScale, 'normal');
  assert.equal(doc.settings.calm, false);
  assert.equal(doc.settings.season, 'auto');
});

test('saneado v3: valores inválidos se corrigen', () => {
  const { doc } = migrate({
    schemaVersion: 3,
    exams: [{ at: 1, n: 10, ok: 5, ko: 2, blank: 3, score: 99, secs: -4 }, { n: 0 }, null],
    missions: { day: 'ayer', daily: [{ id: 'x', type: 'inventada' }, { id: 'a', type: 'answer', target: 0, progress: 9, reward: 2 }], week: 'x', weekly: 'no' },
    goal: { examDate: '31/12/2026', daily: 99999 },
    minigames: { day: 3, plays: -2 },
    breed: { gato: 5, perro: 'x' },
    settings: { fontScale: 'enorme', calm: 'sí', season: 'siempre' },
    inventory: [{ uid: 1, itemId: 'gato', variant: 'verde' }],
  });
  assert.equal(doc.exams.length, 1);
  assert.equal(doc.exams[0].score, 10);
  assert.equal(doc.exams[0].secs, 0);
  assert.equal(doc.missions.day, '');
  assert.equal(doc.missions.daily.length, 1);
  assert.equal(doc.missions.daily[0].target, 1);
  assert.deepEqual(doc.missions.weekly, []);
  assert.equal(doc.goal.examDate, '');
  assert.equal(doc.goal.daily, 500);
  assert.deepEqual(doc.minigames, { day: '', plays: 0 });
  assert.deepEqual(doc.breed, { gato: 5 });
  assert.deepEqual([doc.settings.fontScale, doc.settings.calm, doc.settings.season], ['normal', true, 'auto']);
  assert.equal(doc.inventory[0].variant, '');
});

// ---- Compartir, código de copia y logros nuevos ----
import { SHARE_VARS, VARIANT_FILTERS, decodeCode, encodeCode, inlineSceneStyles } from '../js/share.js';
import { sceneSvg } from '../js/art/scene.js';
import { newlyUnlocked } from '../js/achievements.js';

test('compartir: el SVG sale autónomo (sin variables CSS) y con estilos de pared, suelo y hierba', () => {
  const vars = Object.fromEntries(SHARE_VARS.map((n, i) => [n, `#0${i}0${i}0${i}`]));
  const svg = sceneSvg({ gender: 'chica', inventory: [] });
  assert.ok(svg.includes('var(--'), 'el original usa variables');
  const out = inlineSceneStyles(svg, vars);
  assert.ok(!out.includes('var(--'));
  assert.match(out, /<style>\.wall\{fill:#000000?/);
  assert.ok(out.includes('.floor{fill:'));
  assert.ok(out.includes('.grass{fill:'));
  assert.ok(Object.keys(VARIANT_FILTERS).length === 3);
});

test('código de copia: ida y vuelta con acentos y datos grandes; errores legibles', () => {
  const d = base();
  d.profile.name = 'Ñandú ✓ ¿qué tal?';
  d.coins = 77;
  d.inventory = Array.from({ length: 300 }, (_, i) => ({ uid: i + 1, itemId: 'gato', name: `Gato número ${i}`, xp: i, boughtAt: i, mood: 'ok', mess: 0, joy: 0, coin: false, variant: '' }));
  const json = JSON.stringify(d);
  const code = encodeCode(json);
  assert.ok(code.startsWith('OPO1:'));
  assert.equal(decodeCode(code), json);
  assert.equal(decodeCode(`  ${code.slice(0, 20)}\n${code.slice(20)}  `), json, 'tolera saltos de línea y espacios');
  assert.throws(() => decodeCode('hola'), /empezar por OPO1/);
  assert.throws(() => decodeCode('OPO1:%%%no-es-base64'), /incompleto o dañado/);
  assert.throws(() => decodeCode(''), /OPO1/);
});

test('logros nuevos: exámenes, juegos, misiones, cría y ropa', () => {
  const d = base();
  d.exams = [{ at: 1, n: 20, ok: 20, ko: 0, blank: 0, score: 10, secs: 100 }];
  d.stats.games = 1;
  d.stats.missions = 1;
  d.breed = { gato: 1 };
  d.inventory = [{ uid: 1, itemId: 'perro', name: 'Toby', xp: 0, boughtAt: 0, mood: 'ok', mess: 0, joy: 0, coin: false, variant: 'arcoiris' }];
  const ids = newlyUnlocked({ doc: d, questions: [], now: 1 });
  for (const id of ['exam_first', 'exam_pass', 'exam_8', 'exam_10', 'game_first', 'mission_first', 'breed_first', 'rare_pet', 'rainbow_pet']) assert.ok(ids.includes(id), id);
  assert.ok(!ids.includes('exam_5'));
});
