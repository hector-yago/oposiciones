// Prepara un tema nuevo a partir de una ley del BOE: descarga el texto consolidado, extrae los artículos y deja la
// carpeta de trabajo lista para redactar y revisar las preguntas (ver docs/guia-nuevo-tema.md).
// Uso: node tools/new-tema.mjs <BOE-id> <tema> "<Nombre>"        p. ej.: node tools/new-tema.mjs BOE-A-2015-10565 ley39 "Ley 39/2015"
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { extractLaw } from './lib/law.mjs';

const [boeId, tema, nombre] = process.argv.slice(2);
if (!boeId || !/^BOE-[A-Z]-\d{4}-\d+$/.test(boeId) || !tema || !/^[a-z][a-z0-9-]{1,20}$/.test(tema) || !nombre) {
  console.error('Uso: node tools/new-tema.mjs <BOE-id> <tema> "<Nombre>"   (tema: minúsculas, números y guiones; p. ej. ley39)');
  process.exit(1);
}
if (tema === 'ce') {
  console.error('El tema «ce» ya existe: usa tools/extract-ce.mjs.');
  process.exit(1);
}

const root = new URL('../', import.meta.url);
const dir = new URL(`docs/fuente-${tema}/`, root);
mkdirSync(new URL('borradores/', dir), { recursive: true });

const url = `https://www.boe.es/datosabiertos/api/legislacion-consolidada/id/${boeId}/texto`;
const res = await fetch(url, { headers: { Accept: 'application/xml' } });
if (!res.ok) {
  console.error(`No se pudo descargar ${url} (HTTP ${res.status}).`);
  process.exit(1);
}
const xml = await res.text();
writeFileSync(new URL(`${tema}-consolidada.xml`, dir), xml);

const { articles, lines } = extractLaw(xml);
const count = Object.keys(articles).length;
if (!count) {
  console.error('No se ha encontrado ningún artículo en el texto descargado.');
  process.exit(1);
}
writeFileSync(new URL(`${tema}.txt`, dir), lines.join('\n') + '\n');
writeFileSync(new URL(`${tema}.json`, dir), JSON.stringify(articles, null, 1));
writeFileSync(new URL(`data/${tema}-articulos.json`, root), JSON.stringify(articles));

const grupos = [...new Set(Object.values(articles).map((a) => a.grupo))];
writeFileSync(new URL('borradores/retiradas.json', dir), '[]\n');
if (!existsSync(new URL('borradores/INSTRUCCIONES.md', dir))) {
  writeFileSync(
    new URL('borradores/INSTRUCCIONES.md', dir),
    `# Instrucciones para redactar preguntas — ${nombre}

Fuente de verdad ÚNICA: docs/fuente-${tema}/${tema}.txt (texto consolidado del BOE, ${boeId}). Lee solo el tramo de artículos asignado.
Formato de cada pregunta (JSON): {"id":"${tema}-XXX","tema":"${tema}","titulo":"<grupo>","articulo":"15.1","enunciado":"…","opciones":["correcta","falsa","falsa","falsa"],"correcta":0,"explicacion":"Art. 15.1: …","dificultad":2}
- \`titulo\` debe ser UNO de estos grupos (únicos en toda la app): ${grupos.join(' · ')}
- Correcta siempre en la posición 0; 3 falsas plausibles pero falsas según el texto; sin «todas las anteriores».
- Ids consecutivos con 3 cifras en el rango asignado. Español de España, sin copiar bancos de terceros.
`,
  );
}

console.log(`Artículos extraídos: ${count}`);
console.log(`Grupos (usa estos textos en el campo «titulo»): ${grupos.join(' | ')}`);
console.log(`Siguiente: redactar y revisar las preguntas (docs/guia-nuevo-tema.md) y añadir el tema a data/temas.json con:`);
console.log(JSON.stringify({ id: tema, nombre, descripcion: '…', archivo: `data/${tema}.json`, articulos: `data/${tema}-articulos.json`, grupos: grupos.map((g) => ({ id: g, short: g.replace(/^Título /, ''), desc: '…' })) }, null, 2));
