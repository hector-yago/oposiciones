// Convierte docs/fuente-ce/ce-consolidada.xml (API de legislación consolidada del BOE, BOE-A-1978-31229) en texto plano
// por artículos, usando SIEMPRE la última versión vigente de cada bloque (incluye las reformas de 1992, 2011 y 2024):
//   docs/fuente-ce/ce.txt   (legible, con títulos/capítulos)
//   docs/fuente-ce/ce.json  { "<n>": { titulo, texto } } (lo usa merge-bank.mjs para validar el artículo de cada pregunta)
// Descarga: curl -sL -H "Accept: application/xml" -o docs/fuente-ce/ce-consolidada.xml \
//   "https://www.boe.es/datosabiertos/api/legislacion-consolidada/id/BOE-A-1978-31229/texto"
// Uso: node tools/extract-ce.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const dir = new URL('../docs/fuente-ce/', import.meta.url);
const raw = readFileSync(new URL('ce-consolidada.xml', dir), 'utf8');

// El XML trae todas las redacciones históricas de cada bloque: nos quedamos con la última.
const blockRe = /<bloque\b[^>]*>([\s\S]*?)<\/bloque>/g;
const versionRe = /<version\b[^>]*>([\s\S]*?)<\/version>/g;
const xml = [...raw.matchAll(blockRe)]
  .map((b) => [...b[1].matchAll(versionRe)].at(-1)?.[1] ?? '')
  .join('\n');

const clean = (s) =>
  s
    .replace(/<br\s*\/?>/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const re = /<p class="([^"]+)"[^>]*>([\s\S]*?)<\/p>/g;
let titulo = 'Preliminar';
let current = null;
const articles = {};
const lines = [];
let m;
while ((m = re.exec(xml))) {
  const [, cls, body] = m;
  const t = clean(body);
  if (!t) continue;
  if (cls === 'titulo') {
    titulo = /PRELIMINAR/i.test(t) ? 'Preliminar' : t.replace(/^T[ÍI]TULO\s+/i, '');
    lines.push(`\n=== ${t} ===`);
  } else if (cls === 'titulo_num') {
    titulo = t.replace(/^T[ÍI]TULO\s+/i, '');
    lines.push(`\n=== ${t} ===`);
  } else if (['titulo_tit', 'capitulo_tit', 'capitulo_num', 'capitulo', 'seccion'].includes(cls)) lines.push(`--- ${t}`);
  else if (cls === 'articulo') {
    const n = t.match(/^Artículo\s+(\d+)/i)?.[1];
    if (n && !articles[n]) {
      current = { n, titulo, texto: '' };
      articles[n] = current;
      lines.push(`\nArtículo ${n}`);
    } else current = null;
  } else if ((cls === 'parrafo' || cls === 'parrafo_2') && current) {
    current.texto += `${current.texto ? '\n' : ''}${t}`;
    lines.push(t);
  }
}
writeFileSync(new URL('ce.txt', dir), lines.join('\n') + '\n');
const out = Object.fromEntries(Object.entries(articles).map(([n, a]) => [n, { titulo: a.titulo, texto: a.texto }]));
writeFileSync(new URL('ce.json', dir), JSON.stringify(out, null, 1));
// Copia compacta que sirve la app para enseñar el texto oficial de cada artículo (visor y tarjetas).
writeFileSync(new URL('../data/ce-articulos.json', import.meta.url), JSON.stringify(out));
console.log(`Artículos: ${Object.keys(out).length} (último: ${Math.max(...Object.keys(out).map(Number))})`);
