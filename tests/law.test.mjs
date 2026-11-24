// Extractor genérico de leyes del BOE: debe reproducir exactamente lo publicado para la Constitución.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { extractLaw, groupLabel } from '../tools/lib/law.mjs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('extractLaw reproduce ce.json (169 artículos, texto y grupos)', () => {
  const { articles } = extractLaw(read('docs/fuente-ce/ce-consolidada.xml'));
  const ce = JSON.parse(read('docs/fuente-ce/ce.json'));
  assert.equal(Object.keys(articles).length, 169);
  assert.deepEqual(articles, ce);
  assert.equal(articles['1'].grupo, 'Título Preliminar');
  assert.equal(articles['15'].grupo, 'Título I');
  assert.equal(articles['169'].grupo, 'Título X');
  assert.match(articles['49'].texto, /discapacidad/, 'usa la última versión vigente del art. 49');
  assert.match(articles['135'].texto, /estabilidad presupuestaria/);
});

test('la copia que sirve la app coincide con la fuente', () => {
  assert.deepEqual(JSON.parse(read('data/ce-articulos.json')), JSON.parse(read('docs/fuente-ce/ce.json')));
});

test('groupLabel normaliza títulos, capítulos y secciones', () => {
  assert.equal(groupLabel('TÍTULO PRELIMINAR'), 'Título Preliminar');
  assert.equal(groupLabel('TÍTULO VIII'), 'Título VIII');
  assert.equal(groupLabel('CAPÍTULO II'), 'Capítulo II');
  assert.equal(groupLabel('CAPÍTULO III. Del procedimiento'), 'Capítulo III');
  assert.equal(groupLabel('SECCIÓN 1.ª'), 'Sección 1.ª');
  assert.equal(groupLabel('Otra cosa'), 'Otra cosa');
});

test('artículos con «bis» y texto sin artículos', () => {
  const xml = `<bloque><version><p class="titulo">TÍTULO I</p><p class="articulo">Artículo 12 bis</p><p class="parrafo">Texto uno.</p><p class="articulo">Artículo 13</p><p class="parrafo">Texto dos.</p></version></bloque>`;
  const { articles } = extractLaw(xml);
  assert.deepEqual(Object.keys(articles).sort(), ['12 bis', '13']);
  assert.equal(articles['12 bis'].texto, 'Texto uno.');
  assert.equal(extractLaw('<bloque><version></version></bloque>').articles['1'], undefined);
});
