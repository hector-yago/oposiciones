// Fusiona los borradores de un tema (docs/fuente-<tema>/borradores/<tema>-*.json o ce-*.json) con data/<tema>.json,
// ordena por artículo y valida contra el texto oficial. Idempotente: los ids ya presentes se conservan y los de
// borradores/retiradas.json no se reincorporan.
// Uso: node tools/merge-bank.mjs [tema=ce]
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';

const tema = process.argv[2] ?? 'ce';
const root = new URL('../', import.meta.url);
const read = (p) => JSON.parse(readFileSync(new URL(p, root), 'utf8'));
const bankPath = `data/${tema}.json`;
const draftsDir = `docs/fuente-${tema}/borradores/`;
const bank = existsSync(new URL(bankPath, root)) ? read(bankPath) : [];
const retiradas = new Set(existsSync(new URL(`${draftsDir}retiradas.json`, root)) ? read(`${draftsDir}retiradas.json`) : []);
const ids = new Set([...bank.map((q) => q.id), ...retiradas]);
const art = read(`docs/fuente-${tema}/${tema}.json`);
const temas = read('data/temas.json');
const grupos = temas.find((t) => t.id === tema)?.grupos?.map((g) => g.id);

let added = 0;
for (const f of readdirSync(new URL(draftsDir, root)).filter((n) => new RegExp(`^(${tema}|ce)-[A-Z]\\.json$`).test(n))) {
  for (const q of read(`${draftsDir}${f}`)) {
    if (ids.has(q.id)) continue;
    ids.add(q.id);
    bank.push(q);
    added++;
  }
}

const problems = [];
const base = (a) => a.split('.')[0];
for (const q of bank) {
  const n = base(q.articulo);
  if (!art[n]) problems.push(`${q.id}: el artículo ${q.articulo} no existe`);
  else if (q.titulo !== art[n].grupo) problems.push(`${q.id}: grupo «${q.titulo}» ≠ «${art[n].grupo}» (art. ${n})`);
  if (grupos && !grupos.includes(q.titulo)) problems.push(`${q.id}: «${q.titulo}» no está en los grupos de ${tema}`);
}
const key = (q) => q.articulo.split('.').map((x) => x.padStart(4, '0')).join('.');
bank.sort((a, b) => key(a).localeCompare(key(b)) || a.id.localeCompare(b.id));
writeFileSync(new URL(bankPath, root), `[\n${bank.map((q) => `  ${JSON.stringify(q)}`).join(',\n')}\n]\n`);
console.log(`[${tema}] Preguntas: ${bank.length} (+${added}). Problemas: ${problems.length}`);
for (const p of problems.slice(0, 40)) console.log(' -', p);
if (problems.length) process.exitCode = 1;
