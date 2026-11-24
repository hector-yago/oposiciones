// Ropa: miniaturas para la tienda y el armario (caja 48×48) y cómo se ve puesta sobre el personaje
// (coordenadas del avatar: pies en (0,0), cabeza en (0,-108), torso entre y=-84 e y=-32).
const THUMB = {
  pajarita: '<path d="M24 24l-14-8v16zM24 24l14-8v16z" fill="#dc2626"/><circle cx="24" cy="24" r="4" fill="#991b1b"/>',
  gafas: '<g fill="#cfe8f5" fill-opacity=".5" stroke="#111827" stroke-width="3"><circle cx="14" cy="26" r="9"/><circle cx="34" cy="26" r="9"/><path d="M23 25h2" fill="none"/></g>',
  'camiseta-roja': '<path d="M14 6L2 14l6 10 6-4v24h20V20l6 4 6-10-12-8q-4 5-10 5T14 6z" fill="#ef4444"/>',
  'camiseta-amarilla': '<path d="M14 6L2 14l6 10 6-4v24h20V20l6 4 6-10-12-8q-4 5-10 5T14 6z" fill="#fbbf24"/><path d="M14 22h20v6H14z" fill="#c60b1e"/>',
  bufanda: '<path d="M6 14q18 12 36 0v10q-18 12-36 0z" fill="#dc2626"/><rect x="30" y="22" width="10" height="22" rx="4" fill="#b91c1c"/><path d="M33 30h4M33 36h4" stroke="#fecaca" stroke-width="2"/>',
  gorra: '<path d="M6 30C6 12 42 12 42 30z" fill="#dc2626"/><path d="M4 30h30q10 0 12 8-14-4-42-2z" fill="#b91c1c"/><circle cx="24" cy="14" r="2.2" fill="#fecaca"/>',
  'gafas-sol': '<g fill="#111827"><ellipse cx="14" cy="26" rx="10" ry="8"/><ellipse cx="34" cy="26" rx="10" ry="8"/></g><path d="M24 24h0M4 24l-2-4M44 24l2-4" stroke="#111827" stroke-width="3"/><path d="M8 22l5-2M28 22l5-2" stroke="#fff" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/>',
  birrete: '<path d="M2 20L24 10l22 10-22 10z" fill="#111827"/><path d="M12 25v10q12 6 24 0V25l-12 5z" fill="#1f2937"/><path d="M42 21v14" stroke="#fbbf24" stroke-width="2.5"/><circle cx="42" cy="37" r="3.5" fill="#fbbf24"/>',
  traje: '<path d="M14 6L2 14l6 10 6-4v24h20V20l6 4 6-10-12-8-10 14z" fill="#1f2937"/><path d="M18 6l6 16 6-16z" fill="#fff"/><path d="M22 10l2 22 2-22z" fill="#dc2626"/>',
  corona: '<path d="M6 36V12l9 10 9-14 9 14 9-10v24z" fill="#fbbf24" stroke="#d97706" stroke-width="2"/><circle cx="24" cy="12" r="3" fill="#ef4444"/><circle cx="6" cy="12" r="2.4" fill="#3b82f6"/><circle cx="42" cy="12" r="2.4" fill="#22c55e"/>',
};
export const CLOTHES_THUMB = Object.fromEntries(Object.entries(THUMB).map(([id, svg]) => [id, { w: 48, h: 48, svg }]));

const TOP_COLOR = { 'camiseta-roja': '#ef4444', 'camiseta-amarilla': '#fbbf24', traje: '#1f2937' };

function topSvg(id, gender) {
  const color = TOP_COLOR[id];
  const body = gender === 'chica' ? `<path d="M-17 -84 L17 -84 L30 -26 L-30 -26Z" fill="${color}"/>` : `<rect x="-21" y="-84" width="42" height="52" rx="14" fill="${color}"/>`;
  const sleeves = `<rect x="${gender === 'chica' ? -27 : -29}" y="-80" width="9" height="17" rx="4" fill="${color}"/><rect x="${gender === 'chica' ? 18 : 20}" y="-80" width="9" height="17" rx="4" fill="${color}"/>`;
  const extra =
    id === 'traje'
      ? '<path d="M-7 -84L0 -62 7 -84z" fill="#fff"/><path d="M-2 -80l2 16 2-16z" fill="#dc2626"/><path d="M0 -84v22" stroke="#4b5563" stroke-width="1.2"/>'
      : id === 'camiseta-amarilla'
        ? `<rect x="${gender === 'chica' ? -22 : -21}" y="-62" width="${gender === 'chica' ? 44 : 42}" height="9" fill="#c60b1e"/>`
        : '';
  return `${body}${sleeves}${extra}`;
}

const NECK = {
  bufanda: '<path d="M-15 -92q15 9 30 0v8q-15 9 -30 0z" fill="#dc2626"/><rect x="7" y="-88" width="8" height="24" rx="3.5" fill="#b91c1c"/>',
  pajarita: '<path d="M0 -86l-11 -6v12zM0 -86l11 -6v12z" fill="#dc2626"/><circle cx="0" cy="-86" r="3" fill="#991b1b"/>',
};
const FACE = {
  gafas: '<g fill="#cfe8f5" fill-opacity=".45" stroke="#111827" stroke-width="2"><circle cx="-9" cy="-108" r="7.5"/><circle cx="9" cy="-108" r="7.5"/><path d="M-1.5 -108h3" fill="none"/></g><path d="M-16.5 -108l-8 -2M16.5 -108l8 -2" stroke="#111827" stroke-width="2"/>',
  'gafas-sol': '<g fill="#111827"><ellipse cx="-9" cy="-108" rx="8" ry="6.5"/><ellipse cx="9" cy="-108" rx="8" ry="6.5"/></g><path d="M-1 -109h2M-17 -109l-7 -2M17 -109l7 -2" stroke="#111827" stroke-width="2"/><path d="M-13 -111l4 -1.4M5 -111l4 -1.4" stroke="#fff" stroke-opacity=".6" stroke-width="1.8" stroke-linecap="round"/>',
};
const HAT = {
  gorra: '<path d="M-26 -118C-26 -146 26 -146 26 -118z" fill="#dc2626"/><ellipse cx="0" cy="-118" rx="29" ry="5.5" fill="#b91c1c"/><circle cx="0" cy="-142" r="2.4" fill="#fecaca"/>',
  birrete: '<path d="M-32 -131L0 -143 32 -131 0 -119z" fill="#111827"/><path d="M-17 -126v9q17 8 34 0v-9l-17 6z" fill="#1f2937"/><path d="M28 -132v14" stroke="#fbbf24" stroke-width="2.4"/><circle cx="28" cy="-116" r="3.4" fill="#fbbf24"/>',
  corona: '<path d="M-19 -133V-152l9.5 10 9.5-16 9.5 16 9.5-10V-133z" fill="#fbbf24" stroke="#d97706" stroke-width="1.5"/><circle cx="0" cy="-146" r="2.4" fill="#ef4444"/><circle cx="-19" cy="-152" r="2" fill="#3b82f6"/><circle cx="19" cy="-152" r="2" fill="#22c55e"/>',
};

/** Ropa puesta: va después del dibujo base del personaje. */
export function outfitSvg(outfit = {}, gender = 'chico') {
  return [outfit.top ? topSvg(outfit.top, gender) : '', NECK[outfit.neck] ?? '', FACE[outfit.face] ?? '', HAT[outfit.hat] ?? ''].join('');
}
