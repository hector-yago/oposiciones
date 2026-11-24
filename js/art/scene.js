// Escena de la casa y avatar, en SVG propio. Los colores salen de variables CSS (--wall, --floor…) para el modo oscuro.
// Casa vacía: solo pared, ventana y suelo. Los objetos de la tienda se añadirán en F2.

const SKIN = '#f2c9a5';

function avatarBoy() {
  return `
  <g class="av-legs"><rect x="-13" y="-36" width="11" height="34" rx="4" fill="#374151"/><rect x="2" y="-36" width="11" height="34" rx="4" fill="#374151"/>
    <ellipse cx="-8" cy="0" rx="10" ry="4.5" fill="#1f2937"/><ellipse cx="8" cy="0" rx="10" ry="4.5" fill="#1f2937"/></g>
  <g class="av-arm-l"><rect x="-29" y="-80" width="9" height="34" rx="4.5" fill="#3b82f6"/><circle cx="-24.5" cy="-45" r="5" fill="${SKIN}"/></g>
  <g class="av-arm-r"><rect x="20" y="-80" width="9" height="34" rx="4.5" fill="#3b82f6"/><circle cx="24.5" cy="-45" r="5" fill="${SKIN}"/></g>
  <rect x="-21" y="-84" width="42" height="52" rx="14" fill="#3b82f6"/>
  <rect x="-5" y="-92" width="10" height="9" rx="3" fill="${SKIN}"/>
  <circle cx="0" cy="-108" r="25" fill="${SKIN}"/>
  <path d="M-26 -112 C-28 -140 -4 -142 4 -138 C22 -142 30 -124 26 -110 C20 -120 8 -122 -2 -120 C-12 -118 -22 -116 -26 -112Z" fill="#3b2a20"/>
  ${face(-108)}`;
}

function avatarGirl() {
  return `
  <path d="M-27 -108 C-34 -70 -30 -52 -22 -46 L22 -46 C30 -52 34 -70 27 -108Z" fill="#6b4226"/>
  <g class="av-legs"><rect x="-10" y="-30" width="8" height="30" rx="4" fill="${SKIN}"/><rect x="2" y="-30" width="8" height="30" rx="4" fill="${SKIN}"/>
    <ellipse cx="-6" cy="0" rx="9" ry="4.5" fill="#be185d"/><ellipse cx="6" cy="0" rx="9" ry="4.5" fill="#be185d"/></g>
  <g class="av-arm-l"><rect x="-27" y="-80" width="8" height="32" rx="4" fill="${SKIN}"/><circle cx="-23" cy="-46" r="5" fill="${SKIN}"/></g>
  <g class="av-arm-r"><rect x="19" y="-80" width="8" height="32" rx="4" fill="${SKIN}"/><circle cx="23" cy="-46" r="5" fill="${SKIN}"/></g>
  <path d="M-17 -84 L17 -84 L30 -26 L-30 -26Z" fill="#e0679b"/>
  <rect x="-5" y="-92" width="10" height="9" rx="3" fill="${SKIN}"/>
  <circle cx="0" cy="-108" r="25" fill="${SKIN}"/>
  <path d="M-27 -108 C-30 -142 -2 -146 6 -138 C24 -142 32 -122 27 -106 C22 -122 8 -126 -4 -122 C-14 -120 -22 -114 -27 -108Z" fill="#6b4226"/>
  <circle cx="26" cy="-128" r="8" fill="#6b4226"/><circle cx="26" cy="-128" r="3.5" fill="#e0679b"/>
  ${face(-108)}`;
}

function face(cy) {
  return `<g class="av-eyes"><ellipse cx="-9" cy="${cy}" rx="3" ry="4" fill="#1f2937"/><ellipse cx="9" cy="${cy}" rx="3" ry="4" fill="#1f2937"/></g>
  <circle cx="-15" cy="${cy + 9}" r="4" fill="#f4a7a0" opacity=".55"/><circle cx="15" cy="${cy + 9}" r="4" fill="#f4a7a0" opacity=".55"/>
  <path d="M-6 ${cy + 11} Q0 ${cy + 17} 6 ${cy + 11}" fill="none" stroke="#7a3b2e" stroke-width="2.2" stroke-linecap="round"/>`;
}

/** @param {{gender:'chico'|'chica'}} opts */
export function sceneSvg({ gender }) {
  const avatar = gender === 'chica' ? avatarGirl() : avatarBoy();
  return `<svg class="scene" viewBox="0 0 360 300" role="img" aria-label="Tu casa, de momento vacía" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ec5fc"/><stop offset="1" stop-color="#e0f1ff"/></linearGradient></defs>
  <rect class="wall" x="0" y="0" width="360" height="226"/>
  <g class="window">
    <rect x="36" y="36" width="118" height="112" rx="4" fill="url(#sky)"/>
    <g class="cloud"><ellipse cx="78" cy="70" rx="20" ry="8" fill="#fff"/><ellipse cx="94" cy="64" rx="14" ry="8" fill="#fff"/></g>
    <circle cx="128" cy="58" r="9" fill="#ffd34d"/>
    <rect x="36" y="36" width="118" height="112" rx="4" fill="none" stroke="var(--frame)" stroke-width="7"/>
    <line x1="95" y1="36" x2="95" y2="148" stroke="var(--frame)" stroke-width="5"/>
    <line x1="36" y1="92" x2="154" y2="92" stroke="var(--frame)" stroke-width="5"/>
    <rect x="28" y="148" width="134" height="9" rx="3" fill="var(--frame)"/>
  </g>
  <rect class="floor" x="0" y="226" width="360" height="74"/>
  <g class="floor-lines" stroke="var(--floor-line)" stroke-width="2"><line x1="0" y1="252" x2="360" y2="252"/><line x1="0" y1="278" x2="360" y2="278"/>
    <line x1="70" y1="226" x2="40" y2="252"/><line x1="200" y1="226" x2="190" y2="252"/><line x1="300" y1="226" x2="320" y2="252"/>
    <line x1="130" y1="252" x2="100" y2="278"/><line x1="250" y1="252" x2="260" y2="278"/><line x1="20" y1="278" x2="10" y2="300"/><line x1="180" y1="278" x2="170" y2="300"/><line x1="330" y1="278" x2="340" y2="300"/></g>
  <rect class="baseboard" x="0" y="220" width="360" height="9"/>
  <ellipse cx="258" cy="262" rx="38" ry="8" fill="#000" opacity=".12"/>
  <g class="avatar" transform="translate(258 262)">${avatar}</g>
</svg>`;
}
