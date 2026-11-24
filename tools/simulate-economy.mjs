// Simula cuánto tarda un jugador en comprar cosas, usando las reglas reales del juego (applyAnswer).
// Uso: node tools/simulate-economy.mjs [--md]   (con --md imprime la tabla en Markdown para docs/economia.md)
import { readFileSync } from 'node:fs';
import { emptyDoc } from '../js/migrations.js';
import { applyAnswer } from '../js/economy.js';
import { CATALOG } from '../js/catalog.js';
import { DAILY_COINS } from '../js/daily.js';

const md = process.argv.includes('--md');
const bank = JSON.parse(readFileSync(new URL('../data/ce.json', import.meta.url), 'utf8'));

// Generador reproducible
let seed = 12345;
const rng = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);

/** Monedas medias por pregunta con una precisión dada (solo aciertos y rachas; sin mascotas ni bonus). */
function coinsPerAnswer(accuracy, n = 40000) {
  const d = emptyDoc();
  d.profile = { name: 'Sim', gender: 'chica' };
  for (let i = 0; i < n; i++) applyAnswer(d, bank[Math.floor(rng() * bank.length)], rng() < accuracy, 1_700_000_000_000 + i * 1000);
  return d.coins / n;
}

const price = (cat) => CATALOG.filter((i) => i.cat === cat).reduce((s, i) => s + i.price, 0);
const totals = {
  'Seres vivos (1 de cada)': price('vivos'),
  Herramientas: price('herramientas'),
  Accesorios: price('accesorios'),
  Ropa: price('ropa'),
  'Jardín (todo)': price('jardin'),
  'Estudio (todo)': price('estudio'),
};
const everything = Object.values(totals).reduce((a, b) => a + b, 0);

const rows = [];
for (const acc of [0.6, 0.75, 0.9]) {
  const cpa = coinsPerAnswer(acc);
  for (const perDay of [10, 20, 40]) {
    const perDayCoins = cpa * perDay + DAILY_COINS;
    rows.push({ acc, perDay, cpa, perDayCoins, daysAll: Math.ceil(everything / perDayCoins), daysFirstPet: Math.ceil(1 / perDayCoins), daysDog: Math.ceil(50 / perDayCoins) });
  }
}

const fmt = (n, d = 2) => n.toFixed(d).replace('.', ',');
if (md) {
  console.log('| Precisión | Preguntas/día | Monedas/pregunta | Monedas/día | Días para el perro (50) | Días para comprarlo todo |');
  console.log('|---|---|---|---|---|---|');
  for (const r of rows) console.log(`| ${Math.round(r.acc * 100)} % | ${r.perDay} | ${fmt(r.cpa)} | ${fmt(r.perDayCoins, 1)} | ${r.daysDog} | ${r.daysAll} |`);
  console.log('');
  console.log('| Categoría | Coste total (monedas) |');
  console.log('|---|---|');
  for (const [k, v] of Object.entries(totals)) console.log(`| ${k} | ${v} |`);
  console.log(`| **Todo** | **${everything}** |`);
} else {
  console.log(`Catálogo completo: ${everything} monedas`);
  for (const r of rows) console.log(`precisión ${Math.round(r.acc * 100)} %, ${r.perDay} preguntas/día → ${fmt(r.cpa)} monedas/pregunta, ${fmt(r.perDayCoins, 1)}/día, todo en ~${r.daysAll} días`);
}
