// Herramientas y accesorios en SVG propio. Cada objeto se dibuja en su caja local (0,0)-(w,h);
// la escena lo coloca con translate y la tienda lo usa como miniatura con viewBox = caja.
const B = (id) => `<defs><clipPath id="${id}"/></defs>`;
void B;

export const ITEM_ART = {
  // ----- Accesorios -----
  cuadro: {
    w: 44, h: 46,
    svg: `<rect width="44" height="46" rx="3" fill="#8b5a2b"/><rect x="4" y="4" width="36" height="38" fill="#bfe3ff"/><circle cx="30" cy="14" r="5" fill="#ffd34d"/><path d="M4 42l12-20 8 10 6-6 10 16z" fill="#4c9f70"/><path d="M4 42l12-20 4 6z" fill="#3b8259"/>`,
  },
  reloj: {
    w: 38, h: 38,
    svg: `<circle cx="19" cy="19" r="17" fill="#8b5a2b"/><circle cx="19" cy="19" r="14" fill="#fffdf5"/><g stroke="#374151" stroke-width="1.6" stroke-linecap="round"><path d="M19 7v3M19 28v3M7 19h3M28 19h3"/></g><path d="M19 19V11" stroke="#111827" stroke-width="2.2" stroke-linecap="round"/><path d="M19 19l6 3" stroke="#111827" stroke-width="1.8" stroke-linecap="round"/><circle cx="19" cy="19" r="1.6" fill="#b91c1c"/>`,
  },
  lampara: {
    w: 36, h: 56,
    svg: `<path d="M18 0v22" stroke="#374151" stroke-width="2"/><circle cx="18" cy="42" r="14" fill="#fde68a" opacity=".35"/><path d="M8 22h20l6 18H2z" fill="#f59e0b"/><path d="M8 22h20l2 6H6z" fill="#fbbf24"/><ellipse cx="18" cy="41" rx="8" ry="3" fill="#fff7c2"/>`,
  },
  estanteria: {
    w: 54, h: 80,
    svg: `<rect width="54" height="80" rx="3" fill="#8b5a2b"/><rect x="3" y="3" width="48" height="74" fill="#a9703a"/>
      <g fill="#ef4444"><rect x="6" y="9" width="6" height="17"/></g><g fill="#3b82f6"><rect x="13" y="6" width="6" height="20"/></g><g fill="#22c55e"><rect x="20" y="11" width="7" height="15"/></g><g fill="#eab308"><rect x="29" y="8" width="6" height="18"/></g><g fill="#a855f7"><rect x="36" y="12" width="8" height="14"/></g>
      <rect x="3" y="26" width="48" height="3" fill="#8b5a2b"/>
      <g fill="#14b8a6"><rect x="7" y="34" width="8" height="18"/></g><g fill="#f97316"><rect x="16" y="37" width="6" height="15"/></g><g fill="#6366f1"><rect x="23" y="32" width="7" height="20"/></g><circle cx="42" cy="46" r="6" fill="#e5e7eb"/><path d="M36 46h12" stroke="#9ca3af"/>
      <rect x="3" y="52" width="48" height="3" fill="#8b5a2b"/>
      <g fill="#ec4899"><rect x="7" y="60" width="7" height="15"/></g><g fill="#84cc16"><rect x="15" y="57" width="6" height="18"/></g><g fill="#0ea5e9"><rect x="22" y="62" width="9" height="13"/></g>`,
  },
  tele: {
    w: 62, h: 42,
    svg: `<rect width="62" height="38" rx="4" fill="#1f2937"/><rect x="3" y="3" width="56" height="32" rx="2" fill="#38bdf8"/><path d="M3 35l56-32v10L3 35z" fill="#7dd3fc" opacity=".55"/><circle cx="20" cy="22" r="5" fill="#fde047"/><path d="M3 35l14-12 10 8 12-9 20 13z" fill="#22c55e"/><rect x="22" y="38" width="18" height="4" rx="1.5" fill="#374151"/>`,
  },
  cortinas: {
    w: 148, h: 132,
    svg: `<rect x="-6" y="0" width="160" height="5" rx="2.5" fill="#8b5a2b"/>
      <path d="M0 5h20v118q-10 8-20 0z" fill="#e11d48"/><path d="M6 5v118M13 5v122" stroke="#9f1239" stroke-width="2" opacity=".5"/>
      <path d="M128 5h20v118q-10 8-20 0z" fill="#e11d48"/><path d="M135 5v122M142 5v118" stroke="#9f1239" stroke-width="2" opacity=".5"/>`,
  },
  alfombra: {
    w: 200, h: 22,
    svg: `<ellipse cx="100" cy="11" rx="100" ry="11" fill="#7c3aed"/><ellipse cx="100" cy="11" rx="86" ry="8.5" fill="#a78bfa"/><ellipse cx="100" cy="11" rx="70" ry="6" fill="#7c3aed"/><ellipse cx="100" cy="11" rx="52" ry="3.8" fill="#c4b5fd"/>`,
  },
  sofa: {
    w: 124, h: 60,
    svg: `<rect x="10" y="4" width="104" height="34" rx="12" fill="#0d9488"/><rect x="0" y="22" width="26" height="32" rx="10" fill="#0f766e"/><rect x="98" y="22" width="26" height="32" rx="10" fill="#0f766e"/><rect x="18" y="28" width="88" height="24" rx="8" fill="#14b8a6"/><path d="M62 30v22" stroke="#0f766e" stroke-width="1.5"/><rect x="8" y="52" width="8" height="8" rx="2" fill="#7c4f28"/><rect x="108" y="52" width="8" height="8" rx="2" fill="#7c4f28"/><rect x="24" y="14" width="22" height="18" rx="6" fill="#fbbf24"/>`,
  },
  planta: {
    w: 32, h: 62,
    svg: `<path d="M16 38c-12-4-14-18-10-30 8 4 12 14 10 30zM16 38c12-4 14-18 10-30-8 4-12 14-10 30zM16 38C10 28 12 14 16 4c4 10 6 24 0 34z" fill="#22a05b"/><path d="M16 38V10" stroke="#17824a" stroke-width="1.5" fill="none"/><path d="M7 40h18l-3 20H10z" fill="#c8693f"/><rect x="5" y="37" width="22" height="6" rx="2.5" fill="#dd7d4d"/>`,
  },
  trofeo: {
    w: 24, h: 32,
    svg: `<path d="M5 2h14v10a7 7 0 0 1-14 0z" fill="#fbbf24"/><path d="M5 5H1v3a5 5 0 0 0 5 5M19 5h4v3a5 5 0 0 1-5 5" fill="none" stroke="#f59e0b" stroke-width="2"/><rect x="10" y="18" width="4" height="7" fill="#f59e0b"/><rect x="5" y="25" width="14" height="5" rx="1.5" fill="#92400e"/><path d="M8 5v6" stroke="#fff" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/>`,
  },
  // ----- Herramientas nuevas -----
  rueda: {
    w: 34, h: 34,
    svg: `<rect x="3" y="30" width="28" height="4" rx="2" fill="#64748b"/><circle cx="17" cy="16" r="14" fill="none" stroke="#94a3b8" stroke-width="3"/><circle cx="17" cy="16" r="2.4" fill="#64748b"/><path d="M17 3v26M4 16h26M8 7l18 18M26 7L8 25" stroke="#cbd5e1" stroke-width="1.2"/>`,
  },
  terrario: {
    w: 58, h: 28,
    svg: `<rect x="1" y="2" width="56" height="24" rx="4" fill="#bfe9ff" fill-opacity=".35" stroke="#93c5fd" stroke-width="2"/><rect x="3" y="16" width="52" height="9" fill="#d6b58a"/><ellipse cx="18" cy="21" rx="12" ry="3.5" fill="#60a5fa"/><path d="M42 22c0-6 7-8 6-14-5 3-8 8-6 14z" fill="#3f9b54"/><circle cx="50" cy="21" r="2.2" fill="#9ca3af"/>`,
  },
  comedero: {
    w: 26, h: 12,
    svg: `<path d="M1 3h24l-4 8H5z" fill="#b45309"/><ellipse cx="13" cy="3" rx="12" ry="3" fill="#d97706"/><g fill="#92400e"><circle cx="8" cy="2" r="1.6"/><circle cx="13" cy="1.4" r="1.6"/><circle cx="18" cy="2.2" r="1.6"/></g>`,
  },
  abono: {
    w: 16, h: 24,
    svg: `<path d="M2 6h12l1 17H1z" fill="#84cc16"/><path d="M3 2h10l1 4H2z" fill="#65a30d"/><text x="8" y="17" text-anchor="middle" font-size="6.5" font-weight="800" fill="#365314">NPK</text>`,
  },
  cepillo: {
    w: 26, h: 10,
    svg: `<rect x="1" y="3" width="16" height="5" rx="2.5" fill="#a16207"/><rect x="15" y="1" width="10" height="8" rx="2" fill="#f59e0b"/><g stroke="#fff" stroke-width="1"><path d="M17 3v4M19.5 3v4M22 3v4"/></g>`,
  },
  conejera: {
    w: 56, h: 44,
    svg: `<path d="M2 14L28 2l26 12z" fill="#7c4f28"/><rect x="5" y="14" width="46" height="28" fill="#c8924f"/><rect x="9" y="20" width="22" height="22" fill="#6b4423"/><rect x="34" y="20" width="14" height="18" fill="#e9d8a6" stroke="#8b5a2b"/><path d="M34 26h14M34 32h14M41 20v18" stroke="#8b5a2b" stroke-width=".8"/><rect x="3" y="42" width="50" height="2" fill="#6b4423"/>`,
  },
  percha: {
    w: 32, h: 84,
    svg: `<rect x="14" y="20" width="4" height="60" fill="#8b5a2b"/><ellipse cx="16" cy="82" rx="13" ry="3" fill="#6b4423"/><rect x="0" y="16" width="32" height="5" rx="2.5" fill="#a9703a"/><circle cx="27" cy="36" r="3" fill="#ef4444"/><path d="M27 21v12" stroke="#9ca3af"/>`,
  },
  // ----- Accesorios nuevos -----
  'lampara-pie': {
    w: 24, h: 96,
    svg: `<ellipse cx="12" cy="93" rx="10" ry="3" fill="#374151"/><rect x="10.7" y="26" width="2.6" height="66" fill="#6b7280"/><path d="M4 4h16l4 24H0z" fill="#f59e0b"/><path d="M4 4h16l1 5H3z" fill="#fbbf24"/>`,
  },
  espejo: {
    w: 30, h: 38,
    svg: `<ellipse cx="15" cy="19" rx="14" ry="18" fill="#8b5a2b"/><ellipse cx="15" cy="19" rx="11.5" ry="15.5" fill="#cfe8f5"/><path d="M8 10q4-5 9-5" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>`,
  },
  cojines: {
    w: 44, h: 20,
    svg: `<rect x="1" y="3" width="20" height="16" rx="6" fill="#fb923c" transform="rotate(-8 11 11)"/><rect x="22" y="2" width="20" height="16" rx="6" fill="#f472b6" transform="rotate(7 32 10)"/><path d="M6 8l10 6M26 8l12 4" stroke="#fff" stroke-opacity=".5"/>`,
  },
  monstera: {
    w: 36, h: 74,
    svg: `<path d="M10 56h16l-3 17H13z" fill="#a8704a"/><rect x="8" y="52" width="20" height="6" rx="2.5" fill="#c58859"/><path d="M18 52V16M18 44C10 40 4 34 4 26M18 36c8-3 13-9 14-16M18 28C12 24 8 16 10 8" fill="none" stroke="#2f7d46" stroke-width="2"/>
      <ellipse cx="8" cy="26" rx="8" ry="11" fill="#2f9e5b" transform="rotate(-25 8 26)"/><ellipse cx="29" cy="22" rx="7.5" ry="11" fill="#38a965" transform="rotate(25 29 22)"/><ellipse cx="11" cy="11" rx="7" ry="9" fill="#2f9e5b" transform="rotate(-10 11 11)"/><ellipse cx="19" cy="9" rx="7" ry="10" fill="#38a965"/>
      <path d="M3 24l5 2M5 30l5-1M31 18l-5 3M30 25l-5-1M8 9l4 2M17 6l2 5" stroke="#1e6f3a" stroke-width="1.4" stroke-linecap="round"/>`,
  },
  radio: {
    w: 30, h: 22,
    svg: `<rect x="1" y="4" width="28" height="17" rx="3" fill="#b45309"/><circle cx="9" cy="13" r="4.5" fill="#fde68a" stroke="#78350f"/><rect x="16" y="8" width="11" height="3" fill="#78350f"/><circle cx="21" cy="16" r="1.6" fill="#78350f"/><circle cx="25" cy="16" r="1.6" fill="#78350f"/><path d="M6 4L22 0" stroke="#374151" stroke-width="1.2"/>`,
  },
  pizarra: {
    w: 48, h: 38,
    svg: `<rect width="48" height="38" rx="3" fill="#9ca3af"/><rect x="2.5" y="2.5" width="43" height="30" fill="#f8fafc"/><text x="8" y="13" font-size="7" font-weight="700" fill="#2563eb" font-family="Georgia,serif">Art. 14</text><path d="M8 19h32M8 24h24M8 29h28" stroke="#94a3b8" stroke-width="1.4" stroke-linecap="round"/><rect x="6" y="33.5" width="10" height="3" fill="#ef4444"/>`,
  },
  disco: {
    w: 26, h: 46,
    svg: `<path d="M13 0v14" stroke="#9ca3af"/><circle cx="13" cy="28" r="13" fill="#9ca3af"/><g stroke="#e5e7eb" stroke-width=".8"><path d="M0 28h26M13 15v26M3 20h20M3 36h20M7 17v22M19 17v22"/></g><circle cx="9" cy="23" r="3" fill="#fff" opacity=".6"/><circle cx="18" cy="33" r="2" fill="#7dd3fc" opacity=".8"/>`,
  },
  // ----- Exclusivos (caja misteriosa) -----
  guirnalda: {
    w: 348, h: 26,
    svg: `<path d="M0 3Q29 24 58 3T116 3T174 3T232 3T290 3T348 3" fill="none" stroke="#374151" stroke-width="1.6"/>
      <g><circle cx="29" cy="15" r="5.5" fill="#fde047"/><circle cx="87" cy="15" r="5.5" fill="#f87171"/><circle cx="145" cy="15" r="5.5" fill="#60a5fa"/><circle cx="203" cy="15" r="5.5" fill="#4ade80"/><circle cx="261" cy="15" r="5.5" fill="#f472b6"/><circle cx="319" cy="15" r="5.5" fill="#fb923c"/></g>
      <g opacity=".28"><circle cx="29" cy="15" r="9" fill="#fde047"/><circle cx="145" cy="15" r="9" fill="#60a5fa"/><circle cx="261" cy="15" r="9" fill="#f472b6"/></g>`,
  },
  bandera: {
    w: 48, h: 40,
    svg: `<rect x="0" y="0" width="48" height="3" rx="1.5" fill="#8b5a2b"/><path d="M4 3v3M44 3v3" stroke="#6b4423" stroke-width="1.5"/><rect x="4" y="6" width="40" height="8" fill="#c60b1e"/><rect x="4" y="14" width="40" height="16" fill="#ffc400"/><rect x="4" y="30" width="40" height="8" fill="#c60b1e"/><rect x="11" y="17" width="6" height="10" rx="1.5" fill="#b45309" opacity=".8"/>`,
  },
  mapa: {
    w: 44, h: 34,
    svg: `<rect width="44" height="34" rx="3" fill="#8b5a2b"/><rect x="3" y="3" width="38" height="28" fill="#7dd3fc"/><path d="M8 11l7-5h13l6 4v6l-4 6-7 4H15l-4-5-3-5z" fill="#f59e0b" stroke="#b45309" stroke-width="1"/><circle cx="36" cy="17" r="1.4" fill="#f59e0b"/><circle cx="33" cy="20" r="1.1" fill="#f59e0b"/><circle cx="35" cy="26" r="2.4" fill="#f59e0b"/><circle cx="19" cy="14" r="1.2" fill="#dc2626"/>`,
  },
  globos: {
    w: 28, h: 66,
    svg: `<g class="balloon-sway"><path d="M12 22q-3 22 2 44M20 20q4 22-2 46M9 24q-10 14-3 42" fill="none" stroke="#9ca3af" stroke-width="1"/>
      <ellipse cx="11" cy="12" rx="8" ry="10" fill="#ef4444"/><path d="M9 21l2 3 2-3z" fill="#ef4444"/><ellipse cx="8" cy="9" rx="2" ry="3" fill="#fff" opacity=".45"/>
      <ellipse cx="21" cy="11" rx="7.5" ry="9.5" fill="#3b82f6"/><path d="M19 19l2 3 2-3z" fill="#3b82f6"/><ellipse cx="18.5" cy="8" rx="1.8" ry="2.8" fill="#fff" opacity=".45"/>
      <ellipse cx="4" cy="24" rx="6" ry="8" fill="#facc15"/><path d="M2.5 31l1.5 2.5 1.5-2.5z" fill="#facc15"/></g>`,
  },
  'libro-ce': {
    w: 28, h: 26,
    svg: `<rect x="3" y="2" width="22" height="22" rx="2" fill="#b91c1c"/><rect x="3" y="2" width="4" height="22" rx="1" fill="#7f1d1d"/><rect x="9" y="6" width="13" height="2" fill="#fbbf24"/><text x="15.5" y="18" text-anchor="middle" font-size="8" font-weight="800" fill="#fbbf24" font-family="Georgia,serif">CE</text><rect x="1" y="24" width="26" height="2" fill="#8b5a2b"/>`,
  },
  // ----- Herramientas -----
  regadera: {
    w: 36, h: 26,
    svg: `<path d="M24 8l11-6v6l-8 6z" fill="#2563eb"/><path d="M7 8h18l2 16H5z" fill="#3b82f6"/><path d="M7 8c-5 0-5 10 0 10" fill="none" stroke="#1d4ed8" stroke-width="2.4"/><ellipse cx="16" cy="8" rx="9" ry="2.4" fill="#93c5fd"/><path d="M35 2l1 1" stroke="#93c5fd"/>`,
  },
  'cuenco-agua': {
    w: 34, h: 16,
    svg: `<path d="M1 4h32l-4 11H5z" fill="#ef4444"/><ellipse cx="17" cy="4" rx="16" ry="3.5" fill="#fecaca"/><ellipse cx="17" cy="4.4" rx="12.5" ry="2.4" fill="#60a5fa"/>`,
  },
  juguete: {
    w: 16, h: 16,
    svg: `<circle cx="8" cy="8" r="7.5" fill="#ef4444"/><path d="M1.5 6q6.5 5 13 0" fill="none" stroke="#fff" stroke-width="1.5"/><circle cx="5.5" cy="5" r="1.6" fill="#fff" opacity=".6"/>`,
  },
  pecera: {
    w: 62, h: 70,
    svg: `<rect x="4" y="52" width="54" height="16" rx="3" fill="#8b5a2b"/><rect x="2" y="2" width="58" height="50" rx="6" fill="#bfe9ff" fill-opacity=".45" stroke="#93c5fd" stroke-width="2.5"/><rect x="4.5" y="22" width="53" height="28" rx="4" fill="#38bdf8" opacity=".35"/><path d="M6 46h50" stroke="#d6a76a" stroke-width="4" stroke-linecap="round"/><circle cx="14" cy="44" r="2" fill="#d6a76a"/><path d="M50 46c-2-8 4-10 2-16M44 46c-1-6 3-8 1-12" stroke="#22c55e" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="12" cy="30" r="1.6" fill="#fff" opacity=".8"/><circle cx="16" cy="22" r="1.1" fill="#fff" opacity=".8"/><path d="M8 8q0 6 3 10" stroke="#fff" stroke-opacity=".6" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  },
  jaula: {
    w: 48, h: 80,
    svg: `<path d="M24 0v10" stroke="#9ca3af" stroke-width="2"/><circle cx="24" cy="12" r="4" fill="none" stroke="#9ca3af" stroke-width="2"/><path d="M10 22q14-12 28 0z" fill="#d4a017"/><g stroke="#d4a017" stroke-width="1.8"><path d="M10 22v42M17 22v42M24 22v42M31 22v42M38 22v42"/></g><rect x="6" y="62" width="36" height="8" rx="3" fill="#a16207"/><path d="M12 48h24" stroke="#8b5a2b" stroke-width="2.5" stroke-linecap="round"/>`,
  },
  cama: {
    w: 62, h: 22,
    svg: `<ellipse cx="31" cy="14" rx="31" ry="8" fill="#6366f1"/><ellipse cx="31" cy="11" rx="25" ry="6" fill="#a5b4fc"/><path d="M12 11q19 6 38 0" stroke="#818cf8" stroke-width="2" fill="none"/>`,
  },
  rascador: {
    w: 38, h: 104,
    svg: `<rect x="2" y="96" width="34" height="8" rx="2" fill="#8b5a2b"/><rect x="15" y="26" width="8" height="72" fill="#d6b27a"/><path d="M15 34h8M15 44h8M15 54h8M15 64h8M15 74h8M15 84h8" stroke="#b58a52" stroke-width="1.6"/><rect x="0" y="18" width="38" height="9" rx="3" fill="#8b5a2b"/><rect x="3" y="12" width="32" height="8" rx="3" fill="#a9703a"/><circle cx="31" cy="46" r="4" fill="#ef4444"/><path d="M31 27v15" stroke="#374151" stroke-width="1"/>`,
  },
};

/** Miniatura de un objeto (tienda y listas). */
export const itemThumb = (id, cls = 'thumb') => {
  const a = ITEM_ART[id];
  return a ? `<svg class="${cls}" viewBox="0 0 ${a.w} ${a.h}" aria-hidden="true">${a.svg}</svg>` : '';
};
