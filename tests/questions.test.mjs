// Validación automática de los bancos de preguntas (esquema, ids únicos, sin duplicados, artículos y grupos reales).
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
      assert.match(q.articulo, /^\d+(\s(bis|ter|quater|quinquies))?(\.\d+)?$/, `articulo con formato «N» o «N.M»: ${at}`);
      assert.ok(Array.isArray(q.opciones) && q.opciones.length === 4, `4 opciones: ${at}`);
      assert.equal(new Set(q.opciones.map((o) => o.trim().toLowerCase())).size, 4, `opciones repetidas: ${at}`);
      assert.ok(q.opciones.every((o) => typeof o === 'string' && o.trim()), `opción vacía: ${at}`);
      assert.ok(Number.isInteger(q.correcta) && q.correcta >= 0 && q.correcta < 4, `correcta fuera de rango: ${at}`);
      assert.ok([1, 2, 3].includes(q.dificultad), `dificultad: ${at}`);
    }
  });
  test(`banco «${tema.id}»: artículo y grupo existen en el texto oficial`, () => {
    if (!tema.articulos) return;
    const art = read(tema.articulos);
    const grupos = new Set((tema.grupos ?? []).map((g) => g.id));
    for (const q of bank) {
      const n = q.articulo.split('.')[0];
      assert.ok(art[n], `${q.id}: el artículo ${n} no existe`);
      if (art[n].grupo) assert.equal(q.titulo, art[n].grupo, `${q.id}: grupo`);
      if (grupos.size) assert.ok(grupos.has(q.titulo), `${q.id}: «${q.titulo}» no está en los grupos de ${tema.id}`);
    }
  });
  test(`banco «${tema.id}»: ids y enunciados únicos`, () => {
    assert.equal(new Set(bank.map((q) => q.id)).size, bank.length, 'ids repetidos');
    assert.equal(new Set(bank.map((q) => q.enunciado.trim().toLowerCase())).size, bank.length, 'enunciados repetidos');
  });
}

test('temas: ids únicos y los grupos (títulos) no se repiten entre temas', () => {
  assert.equal(new Set(temas.map((t) => t.id)).size, temas.length);
  const seen = new Map();
  for (const t of temas) {
    for (const g of t.grupos ?? []) {
      assert.ok(g.id && g.short && g.desc, `grupo incompleto en ${t.id}`);
      assert.ok(!seen.has(g.id), `el grupo «${g.id}» está en «${seen.get(g.id)}» y en «${t.id}»: usa etiquetas únicas`);
      seen.set(g.id, t.id);
    }
  }
});
