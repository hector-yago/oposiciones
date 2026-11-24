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
  raton: '<path d="M19 21l9 3M41 21l-9 3" stroke="#475569" stroke-width="2.2" stroke-linecap="round"/>',
  buho: '<path d="M15 13l11 6M45 13l-11 6" stroke="#451a03" stroke-width="3" stroke-linecap="round"/>',
  pollito: '<path d="M18 27l8 3M42 27l-8 3" stroke="#a16207" stroke-width="2.2" stroke-linecap="round"/>',
  patito: '<path d="M32 16l9 3" stroke="#a16207" stroke-width="2.2" stroke-linecap="round"/>',
  erizo: '<path d="M41 39l8 3" stroke="#3f2d20" stroke-width="2.2" stroke-linecap="round"/>',
  cerdito: '<path d="M18 19l9 3M42 19l-9 3" stroke="#9d174d" stroke-width="2.2" stroke-linecap="round"/>',
  ovejita: '<path d="M21 21l8 3M39 21l-8 3" stroke="#f1f5f9" stroke-width="2.2" stroke-linecap="round"/>',
  zorro: '<path d="M18 20l9 3M42 20l-9 3" stroke="#7c2d12" stroke-width="2.2" stroke-linecap="round"/>',
  panda: '<path d="M18 15l9 4M42 15l-9 4" stroke="#e5e7eb" stroke-width="2.2" stroke-linecap="round"/>',
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

const pollito = () => `
  <path d="M26 56v-4M34 56v-4M23 57h6M31 57h6" stroke="#f97316" stroke-width="2.2" stroke-linecap="round"/>
  <ellipse cx="30" cy="38" rx="17" ry="16" fill="#fde047"/>
  <ellipse cx="17" cy="42" rx="5" ry="8" fill="#facc15" transform="rotate(15 17 42)"/><ellipse cx="43" cy="42" rx="5" ry="8" fill="#facc15" transform="rotate(-15 43 42)"/>
  <path d="M30 22c-3-5-7-4-8-1M30 22c1-6 5-7 7-4" stroke="#facc15" stroke-width="2" fill="none" stroke-linecap="round"/>
  <circle cx="23" cy="33" r="2.3" fill="#1f2937"/><circle cx="37" cy="33" r="2.3" fill="#1f2937"/><circle cx="23.7" cy="32.3" r=".8" fill="#fff"/><circle cx="37.7" cy="32.3" r=".8" fill="#fff"/>
  <path d="M26 38l4 5 4-5z" fill="#fb923c"/>
  <circle cx="18" cy="38" r="3" fill="#fca5a5" opacity=".55"/><circle cx="42" cy="38" r="3" fill="#fca5a5" opacity=".55"/>`;

const patito = () => `
  <path d="M24 57l-4 2h9zM36 57l-4 2h9z" fill="#fb923c"/>
  <path d="M14 38l-8-4 3 8z" fill="#fde047"/>
  <ellipse cx="30" cy="44" rx="16" ry="13" fill="#fde047"/>
  <ellipse cx="25" cy="45" rx="9" ry="6" fill="#facc15"/>
  <circle cx="34" cy="24" r="11" fill="#fde047"/>
  <ellipse cx="45" cy="27" rx="7" ry="3.6" fill="#fb923c"/><path d="M40 28h10" stroke="#c2410c" stroke-width=".8"/>
  <circle cx="37" cy="21" r="2.1" fill="#1f2937"/><circle cx="37.6" cy="20.4" r=".7" fill="#fff"/>
  <circle cx="30" cy="27" r="2.6" fill="#fca5a5" opacity=".55"/>`;

const erizo = () => `
  <ellipse cx="22" cy="57" rx="5" ry="2.5" fill="#e8c9a0"/><ellipse cx="38" cy="57" rx="5" ry="2.5" fill="#e8c9a0"/>
  <path d="M8 50L5 41l7 2-2-9 8 5 1-10 7 7 4-9 4 9 7-6 1 10 8-4-2 9 7 0-4 8z" fill="#5b4332"/>
  <ellipse cx="28" cy="49" rx="19" ry="10" fill="#7a5a43"/>
  <path d="M14 40l4 4M22 36l3 5M31 34l1 6M40 36l-2 5M47 42l-4 3" stroke="#3f2d20" stroke-width="1.6" stroke-linecap="round"/>
  <ellipse cx="44" cy="48" rx="11" ry="9" fill="#e8c9a0"/>
  <circle cx="52" cy="48" r="2.6" fill="#1f2937"/>
  <circle cx="45" cy="43" r="1.9" fill="#1f2937"/><circle cx="45.6" cy="42.4" r=".6" fill="#fff"/>
  <path d="M46 53q3 2 6 0" fill="none" stroke="#7a3b2e" stroke-width="1.1" stroke-linecap="round"/>`;

const cerdito = () => `
  <path d="M12 46c-7-3-8 5-1 4 3-.5 3-4 1-4" fill="none" stroke="#f472b6" stroke-width="2" stroke-linecap="round"/>
  <ellipse cx="30" cy="45" rx="17" ry="13" fill="#f9a8d4"/>
  <rect x="17" y="54" width="7" height="5" rx="2" fill="#f472b6"/><rect x="36" y="54" width="7" height="5" rx="2" fill="#f472b6"/>
  <path d="M18 18l-3-10 11 5zM42 18l3-10-11 5z" fill="#f472b6"/>
  <circle cx="30" cy="26" r="13" fill="#f9a8d4"/>
  <ellipse cx="30" cy="31" rx="7.5" ry="5.5" fill="#fbcfe8"/><circle cx="27.5" cy="31" r="1.2" fill="#be185d"/><circle cx="32.5" cy="31" r="1.2" fill="#be185d"/>
  <circle cx="23" cy="23" r="2.1" fill="#1f2937"/><circle cx="37" cy="23" r="2.1" fill="#1f2937"/><circle cx="23.6" cy="22.4" r=".7" fill="#fff"/><circle cx="37.6" cy="22.4" r=".7" fill="#fff"/>
  <circle cx="19" cy="29" r="3" fill="#fb7185" opacity=".4"/><circle cx="41" cy="29" r="3" fill="#fb7185" opacity=".4"/>`;

const ovejita = () => `
  <rect x="22" y="53" width="4.5" height="6" rx="2" fill="#374151"/><rect x="35" y="53" width="4.5" height="6" rx="2" fill="#374151"/>
  <g fill="#f8fafc" stroke="#e2e8f0" stroke-width=".8"><circle cx="16" cy="42" r="10"/><circle cx="44" cy="42" r="10"/><circle cx="30" cy="36" r="12"/><circle cx="22" cy="49" r="9"/><circle cx="38" cy="49" r="9"/></g>
  <ellipse cx="20" cy="27" rx="5" ry="3" fill="#374151" transform="rotate(20 20 27)"/><ellipse cx="40" cy="27" rx="5" ry="3" fill="#374151" transform="rotate(-20 40 27)"/>
  <ellipse cx="30" cy="29" rx="9" ry="10.5" fill="#4b5563"/>
  <circle cx="30" cy="17" r="6.5" fill="#f8fafc" stroke="#e2e8f0" stroke-width=".8"/>
  <circle cx="26" cy="27" r="2.2" fill="#fff"/><circle cx="34" cy="27" r="2.2" fill="#fff"/><circle cx="26.4" cy="27" r="1.1" fill="#1f2937"/><circle cx="34.4" cy="27" r="1.1" fill="#1f2937"/>
  <ellipse cx="30" cy="33" rx="2.6" ry="1.8" fill="#f9a8d4"/>`;

const zorro = () => `
  <path d="M42 52C58 52 62 38 54 32 54 44 46 44 40 46z" fill="#f97316"/><path d="M54 32c4 3 6 8 4 12-2-3-4-5-4-12z" fill="#fff7ed"/>
  <ellipse cx="28" cy="47" rx="13" ry="11" fill="#f97316"/><ellipse cx="28" cy="51" rx="7" ry="8" fill="#fff7ed"/>
  <ellipse cx="22" cy="57" rx="5" ry="2.5" fill="#1f2937"/><ellipse cx="34" cy="57" rx="5" ry="2.5" fill="#1f2937"/>
  <path d="M17 24L15 6l12 10zM43 24l2-18-12 10z" fill="#f97316"/><path d="M19 18l-1-8 6 5zM41 18l1-8-6 5z" fill="#1f2937"/>
  <circle cx="30" cy="26" r="13" fill="#f97316"/>
  <path d="M30 40C20 40 17 31 19 28c5 3 8 1 11 5 3-4 6-2 11-5 2 3-1 12-11 12z" fill="#fff7ed"/>
  <ellipse cx="30" cy="32.5" rx="2.4" ry="1.8" fill="#1f2937"/>
  <path d="M23 24l3 1.5M37 24l-3 1.5" stroke="#1f2937" stroke-width="2.4" stroke-linecap="round"/>`;

const panda = () => `
  <ellipse cx="30" cy="45" rx="16" ry="14" fill="#f8fafc" stroke="#e2e8f0"/>
  <ellipse cx="14" cy="46" rx="5" ry="9" fill="#1f2937" transform="rotate(12 14 46)"/><ellipse cx="46" cy="46" rx="5" ry="9" fill="#1f2937" transform="rotate(-12 46 46)"/>
  <ellipse cx="21" cy="57" rx="7" ry="3.6" fill="#1f2937"/><ellipse cx="39" cy="57" rx="7" ry="3.6" fill="#1f2937"/>
  <circle cx="19" cy="12" r="5.5" fill="#1f2937"/><circle cx="41" cy="12" r="5.5" fill="#1f2937"/>
  <circle cx="30" cy="24" r="14" fill="#f8fafc" stroke="#e2e8f0"/>
  <ellipse cx="23.5" cy="23" rx="4.2" ry="5.2" fill="#1f2937" transform="rotate(-20 23.5 23)"/><ellipse cx="36.5" cy="23" rx="4.2" ry="5.2" fill="#1f2937" transform="rotate(20 36.5 23)"/>
  <circle cx="24" cy="23" r="1.5" fill="#fff"/><circle cx="36" cy="23" r="1.5" fill="#fff"/>
  <ellipse cx="30" cy="30" rx="3.2" ry="2.2" fill="#1f2937"/><path d="M30 32v2M27 34.5q3 2 6 0" fill="none" stroke="#1f2937" stroke-width="1.2" stroke-linecap="round"/>`;

const raton = () => `
  <path d="M43 52c11 0 15-10 9-17" fill="none" stroke="#f4b6b0" stroke-width="2.4" stroke-linecap="round"/>
  <ellipse cx="30" cy="46" rx="14" ry="12" fill="#cbd5e1"/><ellipse cx="30" cy="50" rx="8" ry="7" fill="#f1f5f9"/>
  <circle cx="17" cy="19" r="7.5" fill="#cbd5e1"/><circle cx="17" cy="19" r="4.4" fill="#f9a8b8"/>
  <circle cx="43" cy="19" r="7.5" fill="#cbd5e1"/><circle cx="43" cy="19" r="4.4" fill="#f9a8b8"/>
  <ellipse cx="30" cy="28" rx="13" ry="11" fill="#cbd5e1"/><ellipse cx="30" cy="34" rx="6.5" ry="4.4" fill="#e2e8f0"/>
  <circle cx="30" cy="33" r="2" fill="#f472b6"/>
  <circle cx="24" cy="26" r="2.1" fill="#1f2937"/><circle cx="36" cy="26" r="2.1" fill="#1f2937"/><circle cx="24.6" cy="25.4" r=".7" fill="#fff"/><circle cx="36.6" cy="25.4" r=".7" fill="#fff"/>
  <g stroke="#94a3b8" stroke-width=".9" stroke-linecap="round"><path d="M24 34l-9-2M24 36l-9 3M36 34l9-2M36 36l9 3"/></g>
  <ellipse cx="22" cy="57" rx="4.5" ry="2.5" fill="#f4b6b0"/><ellipse cx="38" cy="57" rx="4.5" ry="2.5" fill="#f4b6b0"/>`;

const buho = () => `
  <path d="M24 57h5M31 57h5" stroke="#f59e0b" stroke-width="2.4" stroke-linecap="round"/>
  <ellipse cx="30" cy="40" rx="16" ry="19" fill="#92400e"/>
  <ellipse cx="15" cy="42" rx="5" ry="12" fill="#78350f" transform="rotate(8 15 42)"/><ellipse cx="45" cy="42" rx="5" ry="12" fill="#78350f" transform="rotate(-8 45 42)"/>
  <ellipse cx="30" cy="45" rx="10" ry="13" fill="#fde68a"/>
  <path d="M23 40q3 3 6 0M31 40q3 3 6 0M24 48q3 3 6 0M32 48q3 3 6 0M27 55q3 3 6 0" fill="none" stroke="#d6a74c" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M18 14l-2-10 9 6zM42 14l2-10-9 6z" fill="#78350f"/>
  <circle cx="30" cy="22" r="13" fill="#92400e"/>
  <circle cx="23" cy="22" r="6.4" fill="#fff7ed" stroke="#f59e0b" stroke-width="1.5"/><circle cx="37" cy="22" r="6.4" fill="#fff7ed" stroke="#f59e0b" stroke-width="1.5"/>
  <circle cx="23" cy="22.4" r="3.2" fill="#111827"/><circle cx="37" cy="22.4" r="3.2" fill="#111827"/><circle cx="24" cy="21.2" r="1" fill="#fff"/><circle cx="38" cy="21.2" r="1" fill="#fff"/>
  <path d="M27.5 26.5l2.5 5.5 2.5-5.5z" fill="#f59e0b"/>`;

const DRAW = { cactus, margarita, pez, pollito, hamster, raton, canario, patito, tortuga, erizo, gato, bonsai, cerdito, conejo, ovejita, buho, loro, zorro, perro, panda };

/** Dibujo local (caja 60×60) de una mascota en la etapa dada. */
export const petSvg = (species, stage = 2, mood = 'ok') => DRAW[species](stage, mood) + (mood === 'angry' ? angryOverlay(species) : '');

/** Miniatura completa (para la tienda y las listas): siempre en etapa adulta salvo que se pida otra. */
export const petThumb = (species, stage = 2, cls = 'thumb', mood = 'ok') => `<svg class="${cls}" viewBox="0 0 60 60" aria-hidden="true">${petSvg(species, stage, mood)}</svg>`;

// Elementos sueltos de la escena (cajas locales): caca, moneda y corazón.
export const POOP = { w: 20, h: 16, svg: '<path d="M10 15C3 15 2 10 5 8.5 3.5 5 7 3 9 4 10 1 15 1 15.5 5 19 6 18 11 14 12.5 13.5 15 12 15 10 15z" fill="#8b5a2b"/><path d="M6 10.5q4 2.5 8 0M7 7q3 1.6 6 0" stroke="#6b4423" stroke-width="1.2" fill="none" stroke-linecap="round"/><circle cx="15" cy="2" r="1.1" fill="#365314"/><path d="M17 1l2-1" stroke="#365314" stroke-width=".8"/>' };
export const COIN = { w: 20, h: 20, svg: '<circle cx="10" cy="10" r="9" fill="#f5b301" stroke="#c78a00" stroke-width="1.4"/><circle cx="10" cy="10" r="6" fill="none" stroke="#c78a00" stroke-width="1.2"/><path d="M10 6v8M8 8.2c0-1 .9-1.6 2-1.6s2 .6 2 1.6-.9 1.4-2 1.6-2 .6-2 1.6.9 1.6 2 1.6 2-.6 2-1.6" fill="none" stroke="#c78a00" stroke-width="1.2" stroke-linecap="round"/><path d="M5 6a6 6 0 0 1 4-3" stroke="#fff" stroke-opacity=".7" stroke-width="1.6" fill="none" stroke-linecap="round"/>' };
export const HEART = { w: 14, h: 13, svg: '<path d="M7 12S1 8 1 4.5A3 3 0 0 1 7 3a3 3 0 0 1 6 1.5C13 8 7 12 7 12z" fill="#ef4444"/>' };
