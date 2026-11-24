// Mascotas en SVG propio. Cada dibujo ocupa una caja local de 60×60 con los pies en (30, 58).
// La etapa (0 cría, 1 joven, 2 adulto) se aplica con una escala desde los pies; el cactus añade brazos y flor.
import { isPlant } from '../catalog.js';

export const PET_BOX = { w: 60, h: 60 };
export const STAGE_SCALE = [0.62, 0.84, 1.0];

const cactus = (stage, mood = 'ok') => mood === 'angry' ? cactusWilted(stage) : `
  <path d="M20 44h20l-3 14H23z" fill="#c8693f"/><rect x="18" y="41" width="24" height="6" rx="2.5" fill="#dd7d4d"/>
  <rect x="24" y="${stage === 0 ? 24 : 12}" width="12" height="${stage === 0 ? 20 : 32}" rx="6" fill="#3f9b54"/>
  ${stage >= 1 ? `<path d="M24 34h-5a4 4 0 0 1-4-4v-7a3 3 0 0 1 6 0v4h3z" fill="#3f9b54"/><path d="M36 28h5a4 4 0 0 0 4-4v-5a3 3 0 0 0-6 0v3h-3z" fill="#3f9b54"/>` : ''}
  <g stroke="#e8f5d0" stroke-width="1.2" stroke-linecap="round"><path d="M28 ${stage === 0 ? 30 : 20}v2M32 ${stage === 0 ? 36 : 28}v2M28 ${stage === 0 ? 40 : 36}v2"/></g>
  ${stage === 2 ? '<g><circle cx="30" cy="11" r="4.6" fill="#f472b6"/><circle cx="30" cy="11" r="1.8" fill="#fde047"/></g>' : ''}`;

const cactusWilted = (stage) => `
  <path d="M20 44h20l-3 14H23z" fill="#c8693f"/><rect x="18" y="41" width="24" height="6" rx="2.5" fill="#dd7d4d"/>
  <g transform="rotate(-8 30 44)"><rect x="24" y="${stage === 0 ? 26 : 16}" width="12" height="${stage === 0 ? 18 : 28}" rx="6" fill="#a3a24a"/>
  ${stage >= 1 ? `<path d="M24 38h-6a4 4 0 0 0-4 4v4a3 3 0 0 0 6 0v-2h4z" fill="#a3a24a"/><path d="M36 36h6a4 4 0 0 1 4 4v4a3 3 0 0 1-6 0v-2h-4z" fill="#a3a24a"/>` : ''}
  <path d="M28 ${stage === 0 ? 32 : 24}v2M32 ${stage === 0 ? 37 : 32}v2" stroke="#e5e0b0" stroke-width="1.2" stroke-linecap="round"/></g>
  ${stage === 2 ? '<g transform="translate(40 52) rotate(60)"><ellipse cx="0" cy="0" rx="3.4" ry="2" fill="#f9a8d4"/></g>' : ''}`;

const pez = () => `
  <path d="M44 38l13-10v20z" fill="#f97316"/>
  <path d="M26 27c4-6 10-6 13-1z" fill="#f97316"/>
  <ellipse cx="30" cy="38" rx="17" ry="11" fill="#fb923c"/>
  <path d="M30 28c3 6 3 16 0 20" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2.2"/>
  <circle cx="21" cy="35" r="3" fill="#fff"/><circle cx="20.4" cy="35" r="1.5" fill="#1f2937"/>
  <path d="M15 41q3 2 5 0" fill="none" stroke="#9a3412" stroke-width="1.4" stroke-linecap="round"/>`;

const canario = () => `
  <path d="M42 42l12 6-12 2z" fill="#f5b800"/>
  <path d="M26 56v-5M34 56v-5" stroke="#f97316" stroke-width="2" stroke-linecap="round"/>
  <ellipse cx="30" cy="40" rx="15" ry="13" fill="#ffd23f"/>
  <circle cx="37" cy="24" r="10" fill="#ffd23f"/>
  <path d="M46 24l8 3-8 3z" fill="#f97316"/>
  <circle cx="40" cy="22" r="2" fill="#1f2937"/><circle cx="40.6" cy="21.4" r=".7" fill="#fff"/>
  <ellipse cx="27" cy="41" rx="8" ry="6" fill="#f5b800"/>
  <path d="M14 37l-9 2 8 5z" fill="#f5b800"/>`;

const gato = () => `
  <path d="M44 52c10 0 12-10 6-16" fill="none" stroke="#e0872e" stroke-width="5" stroke-linecap="round"/>
  <ellipse cx="29" cy="45" rx="15" ry="14" fill="#f59e42"/>
  <ellipse cx="22" cy="57" rx="6" ry="3" fill="#f59e42"/><ellipse cx="36" cy="57" rx="6" ry="3" fill="#f59e42"/>
  <ellipse cx="29" cy="48" rx="8" ry="8" fill="#fde7c4"/>
  <path d="M16 18l3-11 8 6zM42 18l-3-11-8 6z" fill="#f59e42"/><path d="M19 15l1.5-5 4 3zM39 15l-1.5-5-4 3z" fill="#f9a8b8"/>
  <circle cx="29" cy="24" r="13" fill="#f59e42"/>
  <path d="M26 12v4M29 11v5M32 12v4" stroke="#e0872e" stroke-width="1.6" stroke-linecap="round"/>
  <ellipse cx="23.5" cy="24" rx="2.2" ry="2.8" fill="#1f2937"/><ellipse cx="34.5" cy="24" rx="2.2" ry="2.8" fill="#1f2937"/>
  <path d="M27.5 29h3l-1.5 2z" fill="#f472b6"/><path d="M29 31q-2 2-4 1M29 31q2 2 4 1" fill="none" stroke="#7a3b2e" stroke-width="1.2" stroke-linecap="round"/>
  <g stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".9"><path d="M20 29l-8-1M20 31l-8 2M38 29l8-1M38 31l8 2"/></g>`;

const perro = () => `
  <path d="M43 48c8-2 11-9 8-15" fill="none" stroke="#9a6a3a" stroke-width="5" stroke-linecap="round"/>
  <ellipse cx="29" cy="45" rx="15" ry="14" fill="#b9824f"/>
  <ellipse cx="22" cy="57" rx="6.5" ry="3" fill="#c99560"/><ellipse cx="36" cy="57" rx="6.5" ry="3" fill="#c99560"/>
  <ellipse cx="29" cy="48" rx="8" ry="8" fill="#e8c9a0"/>
  <ellipse cx="17" cy="22" rx="6" ry="11" fill="#7c4f28" transform="rotate(14 17 22)"/><ellipse cx="41" cy="22" rx="6" ry="11" fill="#7c4f28" transform="rotate(-14 41 22)"/>
  <circle cx="29" cy="24" r="13" fill="#c99560"/>
  <ellipse cx="29" cy="30" rx="8" ry="6" fill="#e8c9a0"/>
  <circle cx="23.5" cy="22" r="2.2" fill="#1f2937"/><circle cx="34.5" cy="22" r="2.2" fill="#1f2937"/><circle cx="24" cy="21.4" r=".7" fill="#fff"/><circle cx="35" cy="21.4" r=".7" fill="#fff"/>
  <ellipse cx="29" cy="27.5" rx="3" ry="2.2" fill="#1f2937"/>
  <path d="M29 29.5v2M26 32q3 2 6 0" fill="none" stroke="#7a3b2e" stroke-width="1.3" stroke-linecap="round"/>
  <path d="M27.5 32.2q1.5 5 3 0z" fill="#f472b6"/>`;

const ANGER_MARK = '<path d="M43 5c3 0 4 3 4 5M51 5c-3 0-4 3-4 5M43 17c3 0 4-3 4-5M51 17c-3 0-4-3-4-5" stroke="#dc2626" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
const BROWS = {
  hamster: '<path d="M19 22l8 3M41 22l-8 3" stroke="#7c4a21" stroke-width="2.2" stroke-linecap="round"/>',
  tortuga: '<path d="M49 38l9 3" stroke="#33691e" stroke-width="2.2" stroke-linecap="round"/>',
  conejo: '<path d="M20 20l8 3M38 20l-8 3" stroke="#475569" stroke-width="2.2" stroke-linecap="round"/>',
  loro: '<path d="M24 12l10 3" stroke="#7f1d1d" stroke-width="2.4" stroke-linecap="round"/>',
  pez: '<path d="M17 30l7 3" stroke="#7c2d12" stroke-width="2" stroke-linecap="round"/>',
  canario: '<path d="M36 17l8 3" stroke="#7c2d12" stroke-width="2" stroke-linecap="round"/>',
  gato: '<path d="M19 18l8 3M39 18l-8 3" stroke="#7c2d12" stroke-width="2.2" stroke-linecap="round"/>',
  perro: '<path d="M19 16l8 3M39 16l-8 3" stroke="#3b2a20" stroke-width="2.2" stroke-linecap="round"/>',
};
/** Cejas y símbolo de enfado encima del dibujo base (el cactus lo expresa con la variante mustia). */
const angryOverlay = (species) => (isPlant(species) ? '' : `${BROWS[species]}${ANGER_MARK}`);

const margarita = (stage, mood = 'ok') => {
  const wilted = mood === 'angry';
  const n = wilted ? 3 : stage === 0 ? 5 : stage === 1 ? 8 : 11;
  const cx = wilted ? 40 : 30;
  const cy = wilted ? 27 : 18;
  const petals = Array.from({ length: n }, (_, i) => {
    const a = (i * 2 * Math.PI) / n;
    const px = (cx + 7.5 * Math.cos(a)).toFixed(1);
    const py = (cy + 7.5 * Math.sin(a)).toFixed(1);
    return `<ellipse cx="${px}" cy="${py}" rx="4.4" ry="2.3" transform="rotate(${((a * 180) / Math.PI).toFixed(0)} ${px} ${py})" fill="${wilted ? '#e5e7eb' : '#ffffff'}" stroke="#d1d5db" stroke-width=".6"/>`;
  }).join('');
  return `
  <path d="M20 44h20l-3 14H23z" fill="#c8693f"/><rect x="18" y="41" width="24" height="6" rx="2.5" fill="#dd7d4d"/>
  <path d="M30 44C30 36 ${wilted ? '38 33 40 29' : '30 28 30 24'}" fill="none" stroke="${wilted ? '#8da04a' : '#3f9b54'}" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M30 38c-8-1-11-7-10-11 6 0 10 4 10 11z" fill="${wilted ? '#9aa34d' : '#46a85f'}"/><path d="M30 34c7 0 10-5 9-9-6 0-9 4-9 9z" fill="${wilted ? '#9aa34d' : '#46a85f'}"/>
  ${petals}<circle cx="${cx}" cy="${cy}" r="4.2" fill="${wilted ? '#d6b84a' : '#fbbf24'}"/>
  ${wilted ? '<ellipse cx="22" cy="57" rx="3.4" ry="1.6" fill="#f3f4f6" stroke="#d1d5db" stroke-width=".5" transform="rotate(-12 22 57)"/><ellipse cx="37" cy="58" rx="3.4" ry="1.6" fill="#f3f4f6" stroke="#d1d5db" stroke-width=".5" transform="rotate(15 37 58)"/>' : ''}`;
};

const hamster = () => `
  <ellipse cx="30" cy="44" rx="17" ry="14" fill="#e8b878"/>
  <ellipse cx="30" cy="48" rx="10" ry="8" fill="#fbe6c4"/>
  <circle cx="19" cy="21" r="5.5" fill="#e8b878"/><circle cx="19" cy="21" r="3" fill="#f4b6b0"/>
  <circle cx="41" cy="21" r="5.5" fill="#e8b878"/><circle cx="41" cy="21" r="3" fill="#f4b6b0"/>
  <circle cx="30" cy="29" r="13" fill="#e8b878"/>
  <ellipse cx="21" cy="33" rx="5" ry="4" fill="#f7d9a8"/><ellipse cx="39" cy="33" rx="5" ry="4" fill="#f7d9a8"/>
  <circle cx="25" cy="27" r="2" fill="#1f2937"/><circle cx="35" cy="27" r="2" fill="#1f2937"/><circle cx="25.6" cy="26.4" r=".7" fill="#fff"/><circle cx="35.6" cy="26.4" r=".7" fill="#fff"/>
  <ellipse cx="30" cy="31.5" rx="2" ry="1.4" fill="#e57373"/>
  <path d="M30 33v1.5M27.5 35.5q2.5 1.5 5 0" fill="none" stroke="#7a3b2e" stroke-width="1.1" stroke-linecap="round"/>
  <ellipse cx="22" cy="57" rx="4.5" ry="2.5" fill="#f4b6b0"/><ellipse cx="38" cy="57" rx="4.5" ry="2.5" fill="#f4b6b0"/>`;

const tortuga = () => `
  <path d="M7 52l-5 3 7 1z" fill="#7cb342"/>
  <ellipse cx="15" cy="55" rx="6" ry="3.5" fill="#7cb342"/><ellipse cx="40" cy="55" rx="6" ry="3.5" fill="#7cb342"/>
  <path d="M46 48c0-9 12-11 14-3 1 5-2 9-8 9z" fill="#8bc34a"/>
  <circle cx="54" cy="43" r="2" fill="#fff"/><circle cx="54.6" cy="43" r="1" fill="#1f2937"/>
  <path d="M53 48q3 2 6 0" fill="none" stroke="#33691e" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M8 52C8 30 44 30 44 52z" fill="#5d8a3a"/>
  <path d="M8 52C8 30 44 30 44 52" fill="none" stroke="#3f6b27" stroke-width="1.6"/>
  <path d="M26 33v19M17 40l9 4 9-4M12 48l14 4 14-4" fill="none" stroke="#3f6b27" stroke-width="1.4"/>
  <path d="M14 42q4-8 12-9" stroke="#fff" stroke-opacity=".35" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;

const bonsai = (stage, mood = 'ok') => {
  const wilted = mood === 'angry';
  const leaf = wilted ? '#a8a548' : '#2f8f4e';
  const dark = wilted ? '#8d8a3a' : '#257a40';
  const clouds = [[22, 18, 8], [38, 20, 7], [30, 10, 8], [14, 26, 6], [43, 29, 6]].slice(0, wilted ? Math.max(2, stage + 1) : stage + 2);
  return `
  <path d="M16 48h28l-3 10H19z" fill="#475569"/><rect x="14" y="45" width="32" height="5" rx="2" fill="#64748b"/>
  <path d="M30 46C28 38 34 34 30 28 28 24 24 22 22 20" fill="none" stroke="#7c4a21" stroke-width="4" stroke-linecap="round"/>
  <path d="M31 36C36 34 40 30 42 26" fill="none" stroke="#7c4a21" stroke-width="3" stroke-linecap="round"/>
  ${clouds.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${leaf}"/><circle cx="${x - 2}" cy="${y - 2}" r="${r * 0.55}" fill="${dark}" opacity=".5"/>`).join('')}
  ${wilted ? '<path d="M44 40l3 3-3 1z" fill="#a8a548"/><path d="M12 48l3 2-3 2z" fill="#a8a548"/>' : ''}`;
};

const conejo = () => `
  <circle cx="46" cy="52" r="4.5" fill="#fff" stroke="#e2e8f0"/>
  <ellipse cx="29" cy="46" rx="14" ry="13" fill="#e2e8f0"/>
  <ellipse cx="22" cy="57" rx="6.5" ry="3" fill="#cbd5e1"/><ellipse cx="36" cy="57" rx="6.5" ry="3" fill="#cbd5e1"/>
  <ellipse cx="29" cy="49" rx="8" ry="8" fill="#f8fafc"/>
  <ellipse cx="22" cy="10" rx="4.5" ry="12" fill="#e2e8f0" transform="rotate(-10 22 10)"/><ellipse cx="22" cy="11" rx="2.2" ry="9" fill="#f9a8b8" transform="rotate(-10 22 11)"/>
  <ellipse cx="36" cy="10" rx="4.5" ry="12" fill="#e2e8f0" transform="rotate(10 36 10)"/><ellipse cx="36" cy="11" rx="2.2" ry="9" fill="#f9a8b8" transform="rotate(10 36 11)"/>
  <circle cx="29" cy="26" r="11" fill="#f1f5f9"/>
  <circle cx="25" cy="25" r="2" fill="#1f2937"/><circle cx="33" cy="25" r="2" fill="#1f2937"/><circle cx="25.6" cy="24.4" r=".7" fill="#fff"/><circle cx="33.6" cy="24.4" r=".7" fill="#fff"/>
  <path d="M27.5 29h3l-1.5 2z" fill="#f472b6"/><path d="M29 31q-2 2-4 1M29 31q2 2 4 1" fill="none" stroke="#7a3b2e" stroke-width="1.1" stroke-linecap="round"/>
  <g stroke="#94a3b8" stroke-width=".9" stroke-linecap="round"><path d="M21 30l-7-1M21 32l-7 2M37 30l7-1M37 32l7 2"/></g>`;

const loro = () => `
  <path d="M34 50l10 8-4-11z" fill="#3b82f6"/><path d="M30 52l5 7-1-9z" fill="#ef4444"/>
  <ellipse cx="28" cy="38" rx="12" ry="17" fill="#22c55e"/>
  <ellipse cx="26" cy="42" rx="7" ry="11" fill="#86efac"/>
  <ellipse cx="36" cy="40" rx="6" ry="12" fill="#16a34a"/><path d="M33 48q4 6 7 0" fill="none" stroke="#ef4444" stroke-width="2.2" stroke-linecap="round"/>
  <circle cx="28" cy="20" r="10" fill="#ef4444"/>
  <path d="M33 21q9 0 8 8-6-2-8-4z" fill="#fbbf24" stroke="#d97706" stroke-width=".8"/>
  <circle cx="30" cy="18" r="2.6" fill="#fff"/><circle cx="30.4" cy="18" r="1.3" fill="#1f2937"/>
  <path d="M23 57h4M31 57h4" stroke="#f97316" stroke-width="2.2" stroke-linecap="round"/>`;

const DRAW = { cactus, margarita, pez, hamster, canario, tortuga, gato, bonsai, conejo, loro, perro };

/** Dibujo local (caja 60×60) de una mascota en la etapa dada. */
export const petSvg = (species, stage = 2, mood = 'ok') => DRAW[species](stage, mood) + (mood === 'angry' ? angryOverlay(species) : '');

/** Miniatura completa (para la tienda y las listas): siempre en etapa adulta salvo que se pida otra. */
export const petThumb = (species, stage = 2, cls = 'thumb', mood = 'ok') => `<svg class="${cls}" viewBox="0 0 60 60" aria-hidden="true">${petSvg(species, stage, mood)}</svg>`;

// Elementos sueltos de la escena (cajas locales): caca, moneda y corazón.
export const POOP = { w: 20, h: 16, svg: '<path d="M10 15C3 15 2 10 5 8.5 3.5 5 7 3 9 4 10 1 15 1 15.5 5 19 6 18 11 14 12.5 13.5 15 12 15 10 15z" fill="#8b5a2b"/><path d="M6 10.5q4 2.5 8 0M7 7q3 1.6 6 0" stroke="#6b4423" stroke-width="1.2" fill="none" stroke-linecap="round"/><circle cx="15" cy="2" r="1.1" fill="#365314"/><path d="M17 1l2-1" stroke="#365314" stroke-width=".8"/>' };
export const COIN = { w: 20, h: 20, svg: '<circle cx="10" cy="10" r="9" fill="#f5b301" stroke="#c78a00" stroke-width="1.4"/><circle cx="10" cy="10" r="6" fill="none" stroke="#c78a00" stroke-width="1.2"/><path d="M10 6v8M8 8.2c0-1 .9-1.6 2-1.6s2 .6 2 1.6-.9 1.4-2 1.6-2 .6-2 1.6.9 1.6 2 1.6 2-.6 2-1.6" fill="none" stroke="#c78a00" stroke-width="1.2" stroke-linecap="round"/><path d="M5 6a6 6 0 0 1 4-3" stroke="#fff" stroke-opacity=".7" stroke-width="1.6" fill="none" stroke-linecap="round"/>' };
export const HEART = { w: 14, h: 13, svg: '<path d="M7 12S1 8 1 4.5A3 3 0 0 1 7 3a3 3 0 0 1 6 1.5C13 8 7 12 7 12z" fill="#ef4444"/>' };
