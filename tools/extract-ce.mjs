// Convierte docs/fuente-ce/ce-consolidada.xml (API de legislación consolidada del BOE, BOE-A-1978-31229) en:
//   docs/fuente-ce/ce.txt            (legible, con títulos/capítulos)
//   docs/fuente-ce/ce.json           { "<n>": { titulo, grupo, texto } } (lo usa merge-bank.mjs y los tests)
//   data/ce-articulos.json           copia compacta que sirve la app (visor y tarjetas de artículos)
// Descarga: curl -sL -H "Accept: application/xml" -o docs/fuente-ce/ce-consolidada.xml \
//   "https://www.boe.es/datosabiertos/api/legislacion-consolidada/id/BOE-A-1978-31229/texto"
// Para otras leyes: node tools/new-tema.mjs <BOE-id> <tema> "<Nombre>"
// Uso: node tools/extract-ce.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { extractLaw } from './lib/law.mjs';

const dir = new URL('../docs/fuente-ce/', import.meta.url);
const { articles, lines } = extractLaw(readFileSync(new URL('ce-consolidada.xml', dir), 'utf8'));
writeFileSync(new URL('ce.txt', dir), lines.join('\n') + '\n');
writeFileSync(new URL('ce.json', dir), JSON.stringify(articles, null, 1));
writeFileSync(new URL('../data/ce-articulos.json', import.meta.url), JSON.stringify(articles));
console.log(`Artículos: ${Object.keys(articles).length} (último: ${Math.max(...Object.keys(articles).map(Number))})`);
