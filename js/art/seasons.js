// Decoración de temporada (Navidad, Halloween, verano, primavera). Se dibuja sobre el cielo de la ventana o del jardín
// y como pequeños objetos de la habitación. Solo SVG propio; sin coste ni compra.

/** Elementos animados dentro de una caja de cielo { x, y, w, h }. */
export function seasonSky(season, night, box) {
  const { x, y, w, h } = box;
  if (season === 'navidad') {
    const flakes = Array.from({ length: 14 }, (_, i) => {
      const fx = x + 6 + ((i * 37) % (w - 12));
      const fy = y + 4 + ((i * 53) % (h - 10));
      return `<circle class="snow s${(i % 3) + 1}" cx="${fx}" cy="${fy}" r="${1 + (i % 3) * 0.5}" fill="#fff"/>`;
    }).join('');
    return `<g class="season-sky">${flakes}</g>`;
  }
  if (season === 'halloween') {
    const bat = (bx, by, cls) => `<g class="bat ${cls}" transform="translate(${bx} ${by})"><path d="M0 0c-3-3-8-3-11 1 2 0 3 1 4 3 1-2 3-2 4-1 1-1 2-1 3 0 1-1 3-1 4 1 1-2 2-3 4-3-3-4-8-4-11-1z" fill="${night ? '#0b0b1a' : '#2d1b3d'}"/></g>`;
    return `<g class="season-sky">${bat(x + w * 0.3, y + h * 0.35, 'b1')}${bat(x + w * 0.7, y + h * 0.6, 'b2')}</g>`;
  }
  if (season === 'primavera') {
    const bf = (bx, by, c, cls) => `<g class="butterfly ${cls}" transform="translate(${bx} ${by})"><ellipse cx="-3" cy="0" rx="3.4" ry="2.4" fill="${c}"/><ellipse cx="3" cy="0" rx="3.4" ry="2.4" fill="${c}"/><rect x="-.5" y="-2" width="1" height="4" fill="#4b5563"/></g>`;
    return `<g class="season-sky">${bf(x + w * 0.35, y + h * 0.5, '#f472b6', 'f1')}${bf(x + w * 0.65, y + h * 0.3, '#fbbf24', 'f2')}</g>`;
  }
  if (season === 'verano' && !night) {
    // rayos de sol más grandes
    return `<g class="season-sky" opacity=".85"><g stroke="#fde047" stroke-width="2" stroke-linecap="round"><path d="M${x + w - 34} ${y + 6}v-4M${x + w - 34} ${y + 30}v4M${x + w - 46} ${y + 18}h-4M${x + w - 22} ${y + 18}h4M${x + w - 42} ${y + 10}l-3 -3M${x + w - 26} ${y + 26}l3 3M${x + w - 26} ${y + 10}l3 -3M${x + w - 42} ${y + 26}l-3 3"/></g></g>`;
  }
  return '';
}

/** Objetos pequeños de la habitación (en coordenadas absolutas del salón). */
export function seasonRoom(season) {
  if (season === 'navidad') {
    return `<g class="xmas-tree" transform="translate(304 196)"><rect x="16" y="52" width="8" height="10" fill="#6b4423"/><path d="M20 4L2 30h10L0 48h40L28 30h10z" fill="#15803d"/><path d="M20 4L9 22h22z" fill="#16a34a"/><path d="M20 -2l2 5 5 .5-4 3.5 1.2 5L20 9l-4.2 3 1.2-5-4-3.5 5-.5z" fill="#fde047"/><circle class="light l1" cx="12" cy="30" r="2.2" fill="#ef4444"/><circle class="light l2" cx="26" cy="22" r="2.2" fill="#3b82f6"/><circle class="light l3" cx="22" cy="38" r="2.2" fill="#fde047"/><circle class="light l1" cx="8" cy="44" r="2.2" fill="#f472b6"/><circle class="light l2" cx="32" cy="44" r="2.2" fill="#22c55e"/><rect x="2" y="56" width="12" height="9" fill="#ef4444"/><path d="M8 56v9M2 60h12" stroke="#fde047" stroke-width="1.4"/><rect x="28" y="58" width="10" height="7" fill="#3b82f6"/><path d="M33 58v7" stroke="#fff" stroke-width="1.4"/></g>`;
  }
  if (season === 'halloween') {
    return `<g transform="translate(134 126)"><ellipse cx="11" cy="14" rx="11" ry="9" fill="#f97316"/><path d="M5 8q6 3 12 0M11 5v-4" stroke="#c2410c" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M5 13l3-3 2 4zM17 13l-3-3-2 4zM7 18q4 3 8 0" fill="#fde047" stroke="#fde047"/></g><g stroke="#e5e7eb" stroke-width="1" fill="none" opacity=".7"><path d="M0 0L24 24M0 0L30 10M0 0L10 30M8 14q4 2 6 8M14 8q4 2 8 6M20 4q4 2 10 6"/></g>`;
  }
  if (season === 'primavera') {
    return `<g transform="translate(136 126)"><rect x="3" y="14" width="14" height="10" rx="2" fill="#38bdf8"/><path d="M6 14V4M10 14V2M14 14V6" stroke="#22c55e" stroke-width="1.6"/><circle cx="6" cy="3" r="3" fill="#f472b6"/><circle cx="10" cy="1" r="3" fill="#fbbf24"/><circle cx="14" cy="5" r="3" fill="#a78bfa"/></g>`;
  }
  if (season === 'verano') {
    return `<g transform="translate(250 270)"><circle cx="12" cy="12" r="11" fill="#fff" stroke="#e5e7eb"/><path d="M12 1a11 11 0 0 1 8 18l-8-7z" fill="#ef4444"/><path d="M1 12a11 11 0 0 1 11-11l0 11z" fill="#3b82f6"/><path d="M12 23a11 11 0 0 1-8-5l8-6z" fill="#fbbf24"/></g>`;
  }
  return '';
}

/** Decoración propia del jardín según la temporada (en coordenadas absolutas del jardín). */
export function seasonGarden(season) {
  if (season === 'navidad') {
    return `<g transform="translate(40 210)"><circle cx="16" cy="40" r="15" fill="#fff" stroke="#e5e7eb"/><circle cx="16" cy="18" r="11" fill="#fff" stroke="#e5e7eb"/><circle cx="12.5" cy="16" r="1.4" fill="#111827"/><circle cx="19.5" cy="16" r="1.4" fill="#111827"/><path d="M16 19l7 2-7 1z" fill="#f97316"/><rect x="6" y="3" width="20" height="3" fill="#111827"/><rect x="10" y="-6" width="12" height="10" fill="#111827"/><path d="M4 30q12 6 24 0" stroke="#dc2626" stroke-width="3" fill="none"/></g>`;
  }
  if (season === 'halloween') {
    return `<g transform="translate(20 252)"><ellipse cx="14" cy="14" rx="14" ry="11" fill="#f97316"/><path d="M14 4v-5" stroke="#65a30d" stroke-width="3" stroke-linecap="round"/><path d="M6 12l4-4 3 6zM22 12l-4-4-3 6zM8 20q6 4 12 0" fill="#fde047" stroke="#fde047"/></g>`;
  }
  if (season === 'primavera') {
    return `<g>${[30, 120, 210, 300, 340].map((x, i) => `<g transform="translate(${x} ${296 - (i % 2) * 6})"><path d="M0 0V-12" stroke="#22c55e" stroke-width="2"/><circle cx="0" cy="-14" r="4" fill="${['#f472b6', '#fbbf24', '#a78bfa', '#fb7185', '#38bdf8'][i]}"/><circle cx="0" cy="-14" r="1.5" fill="#fff7"/></g>`).join('')}</g>`;
  }
  if (season === 'verano') {
    return `<g transform="translate(28 214)"><path d="M0 30L34 0 68 30z" fill="#ef4444"/><path d="M17 30L34 0 51 30z" fill="#fff"/><rect x="32" y="28" width="4" height="40" fill="#8b5a2b"/></g>`;
  }
  return '';
}
