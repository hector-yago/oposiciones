// Validación automática del banco de preguntas (esquema, ids únicos, sin duplicados).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));
const temas = read('data/temas.json');

for (const tema of temas) {
  const bank = read(tema.archivo);
  test(`banco «${tema.id}»: esquema de cada pregunta`, () => {
    assert.ok(bank.length > 0);
    for (const q of bank) {
      const at = q.id ?? JSON.stringify(q).slice(0, 40);
      assert.match(q.id, new RegExp(`^${tema.id}-\\d{3,}$`), `id inválido: ${at}`);
      assert.equal(q.tema, tema.id, `tema: ${at}`);
      for (const k of ['titulo', 'articulo', 'enunciado', 'explicacion']) {
        assert.ok(typeof q[k] === 'string' && q[k].trim().length >= 1, `${k} vacío: ${at}`);
      }
      assert.match(q.articulo, /^\d+(\.\d+)?$/, `articulo con formato «N» o «N.M»: ${at}`);
      assert.ok(Array.isArray(q.opciones) && q.opciones.length === 4, `4 opciones: ${at}`);
      assert.equal(new Set(q.opciones.map((o) => o.trim().toLowerCase())).size, 4, `opciones repetidas: ${at}`);
      assert.ok(q.opciones.every((o) => typeof o === 'string' && o.trim()), `opción vacía: ${at}`);
      assert.ok(Number.isInteger(q.correcta) && q.correcta >= 0 && q.correcta < 4, `correcta fuera de rango: ${at}`);
      assert.ok([1, 2, 3].includes(q.dificultad), `dificultad: ${at}`);
    }
  });
  test(`banco «${tema.id}»: artículo y título existen en el texto consolidado del BOE`, () => {
    if (tema.id !== 'ce') return;
    const art = read('docs/fuente-ce/ce.json');
    for (const q of bank) {
      const n = q.articulo.split('.')[0];
      assert.ok(art[n], `${q.id}: el artículo ${n} no existe`);
      const esperado = `Título ${art[n].titulo}`;
      assert.equal(q.titulo, esperado, `${q.id}: título`);
    }
  });
  test(`banco «${tema.id}»: ids y enunciados únicos`, () => {
    assert.equal(new Set(bank.map((q) => q.id)).size, bank.length, 'ids repetidos');
    assert.equal(new Set(bank.map((q) => q.enunciado.trim().toLowerCase())).size, bank.length, 'enunciados repetidos');
  });
}
