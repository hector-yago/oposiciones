// Copias de seguridad, avisos, preguntas dudosas, sonido, estadísticas nuevas y la habitación Estudio.
import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_FLAGGED, emptyDoc, migrate } from '../js/migrations.js';
import { BACKUP_DUE_DAYS, backupDue, daysSinceBackup, ensureFirstUse, hasProgress, markBackup, reasonLabel } from '../js/backup.js';
import { buildNotices, dueCount } from '../js/notifications.js';
import { clearFlags, flaggedQuestions, flaggedReport, toggleFlag } from '../js/review.js';
import { SOUND_NAMES, isEnabled, play, setEnabled } from '../js/sound.js';
import { masteryByGroup, weeklyAccuracy } from '../js/stats.js';
import { studySvg } from '../js/art/study.js';
import { sceneSvg } from '../js/art/scene.js';
import { gardenSvg } from '../js/art/garden.js';
import { BY_ID, CATALOG, LAMPS, ROOMS, SPECIES, roomOf } from '../js/catalog.js';
import { buy, canBuy } from '../js/shop.js';
import { applyAnswer } from '../js/economy.js';
import { ensureMissions } from '../js/missions.js';
import { createStore, memoryAdapter } from '../js/store.js';
import { newlyUnlocked } from '../js/achievements.js';

const at = (y, m, d, h = 10) => new Date(y, m - 1, d, h, 0, 0).getTime();
const T = at(2026, 11, 24);
const DAY = 86400000;
const base = () => {
  const d = emptyDoc();
  d.profile = { name: 'Ana', gender: 'chica' };
  return d;
};
const Q = (i, extra = {}) => ({ id: `ce-${i}`, tema: 'ce', titulo: i % 2 ? 'Título I' : 'Título II', articulo: `${i}`, enunciado: `Pregunta ${i}`, opciones: ['a', 'b', 'c', 'd'], correcta: 0, explicacion: 'x', dificultad: 1, ...extra });

/* ---------- Copias ---------- */
test('copias: primer uso, días sin guardar y aviso a partir de 14 días (solo si hay progreso)', () => {
  const d = base();
  assert.equal(ensureFirstUse(d, T), true);
  assert.equal(ensureFirstUse(d, T + 5), false, 'solo la primera vez');
  assert.equal(d.meta.firstUse, T);
  assert.equal(daysSinceBackup(d, T + 3 * DAY), 3);
  assert.equal(hasProgress(d), false);
  assert.equal(backupDue(d, T + 30 * DAY), false, 'sin nada que perder no se avisa');
  d.coins = 25;
  assert.equal(backupDue(d, T + (BACKUP_DUE_DAYS - 1) * DAY), false);
  assert.equal(backupDue(d, T + BACKUP_DUE_DAYS * DAY), true);
  markBackup(d, T + 20 * DAY);
  assert.equal(daysSinceBackup(d, T + 21 * DAY), 1);
  assert.equal(backupDue(d, T + 21 * DAY), false);
  assert.equal(backupDue(d, T + (20 + BACKUP_DUE_DAYS) * DAY), true);
  assert.equal(ensureFirstUse(emptyDoc(), T), false, 'sin perfil no se anota');
  assert.equal(reasonLabel('copia automática diaria'), 'Copia automática');
  assert.equal(reasonLabel('otra'), 'otra');
});

test('copias: restaurar devuelve el estado anterior y guarda copia de lo actual', async () => {
  const store = createStore(memoryAdapter(), { now: () => 1_700_000_000_000 });
  await store.load();
  await store.update((d) => {
    d.profile = { name: 'Ana', gender: 'chica' };
    d.coins = 40;
  });
  assert.equal(await store.autoBackup(), true);
  await store.update((d) => {
    d.coins = 5;
  });
  const [backup] = await store.listBackups();
  assert.equal(backup.coins, 40);
  await store.restoreBackup(backup.key);
  assert.equal(store.state.coins, 40);
  const after = await store.listBackups();
  assert.ok(after.some((b) => b.reason === 'antes de restaurar una copia' && b.coins === 5));
});

/* ---------- Avisos ---------- */
test('avisos: sin perfil no hay avisos y un doc nuevo está al día', () => {
  assert.deepEqual(buildNotices(emptyDoc(), T), []);
  assert.deepEqual(buildNotices(base(), T), []);
});

test('avisos: cuidados, monedas, caja, misiones, objetivo, examen, repaso, comodín y copia', () => {
  const d = base();
  d.coins = 30;
  d.stats.answered = 50;
  d.stats.byDay = { '2026-11-24': { n: 2, ok: 2 } };
  d.goal = { examDate: '2026-12-01', daily: 10, bonusDay: '' };
  d.inventory = [
    { uid: 1, itemId: 'gato', name: 'Michi', xp: 0, boughtAt: 1, mood: 'angry', mess: 2, joy: 0, coin: false, variant: '' },
    { uid: 2, itemId: 'perro', name: 'Toby', xp: 0, boughtAt: 1, mood: 'ok', mess: 0, joy: 0, coin: true, variant: '' },
  ];
  d.daily.boxes = 1;
  ensureMissions(d, T);
  d.missions.daily[0].progress = d.missions.daily[0].target;
  for (let i = 0; i < 6; i++) d.progress[`q${i}`] = { box: 2, ok: 2, ko: 0, last: 1, due: T - 1000, failedSeq: 0 };
  d.meta.firstUse = T - 20 * DAY;
  const ids = buildNotices(d, T).map((n) => n.id);
  for (const id of ['care', 'petcoins', 'box', 'missions', 'goal', 'exam', 'due', 'joker', 'backup']) assert.ok(ids.includes(id), id);
  assert.equal(ids[0], 'care', 'lo urgente va primero');
  const exam = buildNotices(d, T).find((n) => n.id === 'exam');
  assert.equal(exam.level, 'warn', 'examen a ≤7 días es importante');
  assert.match(exam.text, /Faltan 7 días/);
  assert.equal(dueCount(d, T), 6);
});

test('avisos: el comodín no avisa si se usó hace poco y el objetivo cumplido no aparece', () => {
  const d = base();
  d.stats.answered = 30;
  d.joker.lastUsed = T - 1000;
  d.goal.daily = 3;
  d.stats.byDay = { '2026-11-24': { n: 5, ok: 5 } };
  const ids = buildNotices(d, T).map((n) => n.id);
  assert.ok(!ids.includes('joker'));
  assert.ok(!ids.includes('goal'));
});

/* ---------- Preguntas dudosas ---------- */
test('dudosas: marcar, desmarcar, informe y límite', () => {
  const d = base();
  const qs = [Q(1), Q(2), Q(3)];
  assert.equal(toggleFlag(d, 'ce-1', 100), true);
  assert.equal(toggleFlag(d, 'ce-2', 200), true);
  assert.equal(toggleFlag(d, 'ce-1', 300), false, 'segunda vez la quita');
  assert.deepEqual(flaggedQuestions(d, qs).map((q) => q.id), ['ce-2']);
  const report = flaggedReport(d, qs);
  assert.match(report, /Preguntas dudosas \(1\)/);
  assert.match(report, /\[ce-2\] Título II · Art\. 2/);
  assert.match(report, /A\) a {3}← marcada como correcta/);
  assert.match(report, /Explicación: x/);
  assert.equal(flaggedReport(base(), qs), 'No hay preguntas marcadas como dudosas.');
  d.flagged['ce-inexistente'] = 5;
  assert.equal(flaggedQuestions(d, qs).length, 1, 'ignora ids que ya no existen');
  clearFlags(d);
  assert.deepEqual(d.flagged, {});
  for (let i = 0; i < MAX_FLAGGED + 20; i++) toggleFlag(d, `ce-${i}`, i + 1);
  assert.equal(Object.keys(d.flagged).length, MAX_FLAGGED);
  assert.ok(!d.flagged['ce-0'] && d.flagged[`ce-${MAX_FLAGGED + 19}`], 'se descartan las más antiguas');
});

test('dudosas: el saneado descarta basura y migra desde el esquema 3', () => {
  const { doc } = migrate({ schemaVersion: 4, flagged: { a: 5, '': 3, b: 'x', c: -1, [`${'z'.repeat(41)}`]: 9 } });
  assert.deepEqual(doc.flagged, { a: 5 });
  const m = migrate({ schemaVersion: 3, profile: { name: 'Ana', gender: 'chica' } });
  assert.equal(m.from, 3);
  assert.deepEqual(m.doc.flagged, {});
  assert.equal(m.doc.settings.sound, true);
});

/* ---------- Sonido ---------- */
test('sonido: sin AudioContext no falla; se puede desactivar', () => {
  assert.ok(SOUND_NAMES.length >= 8);
  assert.equal(isEnabled(), true);
  assert.equal(play('coin'), false, 'en Node no hay audio, pero no lanza');
  assert.equal(play('inexistente'), false);
  setEnabled(false);
  assert.equal(isEnabled(), false);
  assert.equal(play('coin'), false);
  setEnabled(true);
});

/* ---------- Estadísticas nuevas ---------- */
test('precisión semanal: agrupa por semanas de lunes a domingo', () => {
  const d = base();
  d.stats.byDay = { '2026-11-23': { n: 10, ok: 8 }, '2026-11-24': { n: 10, ok: 6 }, '2026-11-16': { n: 4, ok: 4 } };
  const w = weeklyAccuracy(d, T, 3);
  assert.equal(w.length, 3);
  assert.deepEqual(w.map((x) => x.start), ['2026-11-09', '2026-11-16', '2026-11-23']);
  assert.deepEqual(w.map((x) => x.pct), [null, 100, 70]);
  assert.equal(w[2].n, 20);
});

test('dominio por grupo: cuenta nuevas, aprendiendo y dominadas', () => {
  const d = base();
  const qs = [Q(1), Q(3), Q(5), Q(2)];
  d.progress['ce-1'] = { box: 5, ok: 5, ko: 0, last: 1, due: 1, failedSeq: 0 };
  d.progress['ce-3'] = { box: 2, ok: 2, ko: 0, last: 1, due: 1, failedSeq: 0 };
  const g = masteryByGroup(d, qs);
  const t1 = g.find((x) => x.titulo === 'Título I');
  assert.deepEqual([t1.total, t1.mastered, t1.learning, t1.pct], [3, 1, 1, 33]);
  assert.equal(g.find((x) => x.titulo === 'Título II').pct, 0);
});

/* ---------- Estudio y catálogo ---------- */
test('estudio: está en la tienda y exige comprarlo; animales, muebles y lámpara', () => {
  assert.ok(ROOMS.some((r) => r.id === 'estudio'));
  const d = base();
  d.coins = 1000;
  assert.equal(canBuy(d, 'escritorio').code, 'req');
  assert.equal(canBuy(d, 'buho').code, 'req');
  buy(d, 'estudio', '', T);
  assert.equal(canBuy(d, 'escritorio').ok, true);
  assert.equal(canBuy(d, 'buho').ok, true);
  assert.equal(roomOf('buho'), 'estudio');
  assert.equal(roomOf('raton'), 'estudio');
  assert.equal(roomOf('escritorio'), 'estudio');
  assert.ok(LAMPS.includes('lampara-mesa') && roomOf('lampara-mesa') === 'estudio');
  assert.equal(CATALOG.filter((i) => i.cat === 'estudio').length, 9);
  assert.equal(BY_ID.estudio.price, 50);
});

const inv = (ids, pets = [], extra = {}) => {
  let uid = 1;
  return [...ids.map((itemId) => ({ uid: uid++, itemId, name: '', xp: 0, mood: 'ok', mess: 0, joy: 0, coin: false, variant: '' })), ...pets.map((itemId) => ({ uid: uid++, itemId, name: itemId, xp: 500, mood: 'ok', mess: 0, joy: 0, coin: false, variant: '', ...extra }))];
};

test('estudio: escena de día y noche, muebles, animales y flexo', () => {
  const all = CATALOG.filter((i) => i.cat === 'estudio' || ['queso', 'posadero'].includes(i.id)).map((i) => i.id);
  const svg = studySvg({ gender: 'chico', inventory: inv(all, ['raton', 'raton', 'buho']) });
  assert.match(svg, /class="scene day room-estudio"/);
  for (const id of ['escritorio', 'ordenador', 'estanteria-grande', 'silla', 'diploma', 'libros', 'globo-terraqueo', 'posadero', 'queso']) assert.ok(svg.includes(`obj-${id}`), id);
  assert.equal((svg.match(/data-pet="/g) ?? []).length, 3);
  const night = studySvg({ gender: 'chico', inventory: inv(['lampara-mesa']), night: true });
  assert.ok(night.includes('class="glow"') && night.includes('data-lamp="lampara-mesa"'));
  assert.ok(!studySvg({ gender: 'chico', inventory: inv(['lampara-mesa']), night: true, lampOff: true }).includes('class="glow"'));
  assert.ok(studySvg({ gender: 'chica', inventory: [], night: true }).includes('night-shade'));
});

test('estudio: sus animales no aparecen en el salón ni en el jardín y sus lámparas tampoco', () => {
  const items = inv(['estudio', 'lampara-mesa'], ['buho', 'raton']);
  assert.equal((sceneSvg({ gender: 'chica', inventory: items }).match(/data-pet="/g) ?? []).length, 0);
  assert.equal((gardenSvg({ gender: 'chica', inventory: items }).match(/data-pet="/g) ?? []).length, 0);
  assert.ok(!sceneSvg({ gender: 'chica', inventory: items, night: true }).includes('data-lamp="lampara-mesa"'));
  for (const sp of ['raton', 'buho']) assert.equal(SPECIES[sp].room, 'estudio');
});

test('logros del estudio y de las copias', () => {
  const d = base();
  d.inventory = inv(['estudio', 'escritorio', 'silla', 'ordenador', 'estanteria-grande'], ['buho', 'raton']);
  d.inventory.forEach((i, n) => (i.uid = n + 1));
  d.meta.lastExport = T;
  d.flagged = { 'ce-1': 1 };
  const ids = newlyUnlocked({ doc: d, questions: [], now: T });
  for (const id of ['study_open', 'has_buho', 'has_raton', 'office_full', 'backup_first', 'flag_first']) assert.ok(ids.includes(id), id);
});

test('misiones por Título usan los grupos del tema que se les pase', () => {
  const d = base();
  ensureMissions(d, T, ['Ley 39/2015 · Capítulo I']);
  const tit = [...d.missions.daily, ...d.missions.weekly].filter((m) => m.type === 'titulo');
  for (const m of tit) assert.equal(m.titulo, 'Ley 39/2015 · Capítulo I');
  const { doc } = migrate(d);
  assert.equal(doc.missions.daily.length, 3);
  applyAnswer(d, { id: 'x', titulo: 'Ley 39/2015 · Capítulo I', tema: 'ley39' }, true, T);
});
