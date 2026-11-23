// Comprobaciones del andamiaje: versiones sincronizadas y shell del service worker completo.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

test('la versión de package.json coincide con js/version.js y sw.js', () => {
  const { version } = JSON.parse(read('package.json'));
  assert.match(read('js/version.js'), new RegExp(`'${version}'`));
  assert.match(read('sw.js'), new RegExp(`const VERSION = '${version}'`));
});

test('todos los ficheros del shell del service worker existen', () => {
  const shell = read('sw.js').match(/const SHELL = \[([\s\S]*?)\];/)[1];
  const files = [...shell.matchAll(/'([^']+)'/g)].map((m) => m[1]).filter((f) => f !== './');
  for (const f of files) assert.ok(existsSync(new URL(f, root)), `falta ${f}`);
});

test('my-tools.json apunta al lanzador y al puerto del servidor', () => {
  const { launcher } = JSON.parse(read('my-tools.json'));
  assert.ok(existsSync(new URL(launcher.target, root)));
  const port = launcher.openUrl.match(/:(\d+)\//)[1];
  assert.match(read('serve.mjs'), new RegExp(`\\?\\? ${port}`));
  assert.match(read(launcher.target), new RegExp(`\\$port = ${port}`));
});
