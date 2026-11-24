import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CURRENT_SCHEMA, migrate } from '../js/migrations.js';
import { createStore, memoryAdapter } from '../js/store.js';
import { applyAnswer } from '../js/economy.js';

const fixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));

test('el fixture v1 migra a la versión actual sin perder datos', () => {
  const { doc, from, to } = migrate(fixture('v1.json'));
  assert.equal(from, 1);
  assert.equal(to, CURRENT_SCHEMA);
  assert.deepEqual(doc.profile, { name: 'Ana', gender: 'chica' });
  assert.equal(doc.coins, 12);
  assert.equal(doc.streak.best, 5);
  assert.equal(doc.progress['ce-001'].box, 2);
  assert.deepEqual(doc.stats.byTitle['Título I'], { ok: 3, ko: 1 });
  assert.equal(doc.flags.introSeen, true);
});

test('un documento de una versión futura se rechaza sin tocarlo', async () => {
  const adapter = memoryAdapter();
  await adapter.put('doc', { schemaVersion: 99, coins: 5 });
  const store = createStore(adapter);
  await assert.rejects(() => store.load(), /más nueva/);
  assert.equal((await adapter.get('doc')).coins, 5);
});

test('crear, actualizar, persistir y recargar', async () => {
  const adapter = memoryAdapter();
  const s1 = createStore(adapter);
  assert.equal((await s1.load()).created, true);
  await s1.update((d) => {
    d.profile = { name: 'Luis', gender: 'chico' };
  });
  const result = await s1.update((d) => applyAnswer(d, { id: 'ce-001', titulo: 'Título I' }, true, 1000));
  assert.equal(result.coins, 1);
  const s2 = createStore(adapter);
  await s2.load();
  assert.equal(s2.state.coins, 1);
  assert.equal(s2.state.profile.name, 'Luis');
});

test('saneado: descarta perfil incompleto y valores inválidos', () => {
  const { doc } = migrate({ schemaVersion: 1, profile: { name: '  ', gender: 'x' }, coins: -3, streak: { current: 'a' }, progress: { a: { box: 99 }, b: null } });
  assert.equal(doc.profile, null);
  assert.equal(doc.coins, 0);
  assert.equal(doc.progress.a.box, 5);
  assert.equal(doc.progress.b, undefined);
});

test('exportar e importar conserva los datos y deja copia previa', async () => {
  const a = createStore(memoryAdapter());
  await a.load();
  await a.update((d) => {
    d.profile = { name: 'Eva', gender: 'chica' };
    d.coins = 7;
  });
  const text = a.exportJson();
  const b = createStore(memoryAdapter());
  await b.load();
  await b.importJson(text);
  assert.equal(b.state.coins, 7);
  assert.equal((await b.listBackups()).length, 1);
  await assert.rejects(() => b.importJson('{"app":"otra"}'), /no es una exportación/);
  await assert.rejects(() => b.importJson('no json'), /JSON válido/);
});
