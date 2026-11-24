// Fusiona borradores (docs/fuente-ce/borradores/ce-*.json) con data/ce.json, ordena por artículo y valida contra el BOE.
// Uso: node tools/merge-bank.mjs   (idempotente: los ids ya presentes en data/ce.json se conservan)
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (p) => JSON.parse(readFileSync(new URL(p, root), 'utf8'));
const bank = read('data/ce.json');
const retiradas = new Set(read('docs/fuente-ce/borradores/retiradas.json')); // duplicados descartados: no se reincorporan
const ids = new Set([...bank.map((q) => q.id), ...retiradas]);
const art = read('docs/fuente-ce/ce.json');
const titleOf = (n) => `Título ${art[n].titulo === 'Preliminar' ? 'Preliminar' : art[n].titulo}`;

let added = 0;
for (const f of readdirSync(new URL('docs/fuente-ce/borradores/', root)).filter((n) => /^ce-[A-Z]\.json$/.test(n))) {
  for (const q of read(`docs/fuente-ce/borradores/${f}`)) {
    if (ids.has(q.id)) continue;
    ids.add(q.id);
    bank.push(q);
    added++;
  }
}

const problems = [];
for (const q of bank) {
  const n = q.articulo.split('.')[0];
  if (!art[n]) problems.push(`${q.id}: el artículo ${q.articulo} no existe`);
  else if (q.titulo !== titleOf(n)) problems.push(`${q.id}: título «${q.titulo}» ≠ «${titleOf(n)}» (art. ${n})`);
}
const key = (q) => q.articulo.split('.').map((x) => x.padStart(4, '0')).join('.');
bank.sort((a, b) => key(a).localeCompare(key(b)) || a.id.localeCompare(b.id));
writeFileSync(new URL('data/ce.json', root), `[\n${bank.map((q) => `  ${JSON.stringify(q)}`).join(',\n')}\n]\n`);
console.log(`Preguntas: ${bank.length} (+${added}). Problemas: ${problems.length}`);
for (const p of problems.slice(0, 40)) console.log(' -', p);
