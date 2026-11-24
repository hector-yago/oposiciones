// Escena de la casa y avatar, en SVG propio. Los colores de pared/suelo salen de variables CSS (modo oscuro).
// Casa vacía: solo pared, ventana y suelo. Lo que compras aparece en huecos fijos; las mascotas crecen con las etapas.
import { ITEM_ART } from './items.js';
import { COIN, HEART, PET_BOX, POOP, STAGE_SCALE, petSvg } from './pets.js';
import { LAMPS, SPECIES } from '../catalog.js';
import { JOY_TARGET, isHappy, stageOf } from '../shop.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const SKIN = '#f2c9a5';
const AVATAR_X = 62;
const FLOOR_Y = 262;

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

const place = (id, x, y, extra = '') => (ITEM_ART[id] ? `<g class="obj obj-${id}" transform="translate(${x} ${y})" ${extra}>${ITEM_ART[id].svg}</g>` : '');

const shadow = (x, y, rx) => `<ellipse cx="${x}" cy="${y + 2}" rx="${rx}" ry="4" fill="#000" opacity=".14"/>`;

const poopAt = (uid, x, y) =>
  `<g class="poop" data-poop="${uid}" transform="translate(${x} ${y})" role="button" aria-label="Limpiar"><rect x="-4" y="-4" width="28" height="24" fill="transparent"/><g class="poop-in">${POOP.svg}</g></g>`;
const coinAt = (uid, x, y) =>
  `<g class="petcoin" data-petcoin="${uid}" transform="translate(${x - 12} ${y - 12})" role="button" aria-label="Coger moneda"><rect x="-6" y="-6" width="36" height="36" fill="transparent"/><g class="coin-in" transform="scale(1.2)">${COIN.svg}</g></g>`;
const heartAt = (x, y) => `<g class="heart" transform="translate(${x} ${y})">${HEART.svg}</g>`;

/** Animales que viven en su «casa» si tienes la herramienta; los que sobran (o sin casa) van al suelo. */
const HOMES = {
  hamster: { tool: 'rueda', spots: [[109, 294, 0.55]] },
  tortuga: { tool: 'terrario', spots: [[152, 296, 0.65], [176, 296, 0.65]] },
  conejo: { tool: 'conejera', spots: [[318, 276, 0.8], [342, 276, 0.8]] },
  loro: { tool: 'percha', spots: [[176, 192, 0.7]] },
};
const LAMP_SPOT = { lampara: [314, 44], 'lampara-pie': [308, 160] }; // dónde brilla cada lámpara

/** Hueco de las lámparas (para pulsarlas): su dibujo en la escena. */
const LAMP_AT = { lampara: [296, 0], 'lampara-pie': [296, 150] };

/** ¿Es de noche? De 18:00 a 06:00. */
export const isNightHour = (hour) => hour < 6 || hour >= 18;

/**
 * @param {{gender:'chico'|'chica', inventory?:object[], hopUid?:number|null, night?:boolean, lampOff?:boolean}} opts
 */
export function sceneSvg({ gender, inventory = [], hopUid = null, night = false, lampOff = false }) {
  const has = new Set(inventory.filter((i) => !(i.itemId in SPECIES)).map((i) => i.itemId));
  const pets = inventory.filter((i) => i.itemId in SPECIES);
  const avatar = gender === 'chica' ? avatarGirl() : avatarBoy();
  const out = [];
  const lamps = LAMPS.filter((id) => has.has(id));
  const lit = night && lamps.length > 0 && !lampOff;

  /** Una mascota con los pies en (x, y), con su estado: enfado, cacas (`messAt` da los huecos), corazón y moneda. */
  function drawPet(p, x, y, s = 1, messAt = null) {
    const stage = stageOf(p.itemId, p.xp);
    const k = STAGE_SCALE[stage] * s * (SPECIES[p.itemId].size ?? 1);
    const cls = [p.uid === hopUid ? 'hop' : '', p.mood === 'angry' ? 'angry' : ''].filter(Boolean).join(' ');
    let g = `<g class="pet ${cls}" data-pet="${p.uid}" transform="translate(${x - 30 * k} ${y - 58 * k}) scale(${k})" role="button" aria-label="${esc(p.name)}">
      <g class="pet-in"><rect x="0" y="0" width="${PET_BOX.w}" height="${PET_BOX.h}" fill="transparent"/>${petSvg(p.itemId, stage, p.mood)}</g></g>`;
    const spot = messAt ?? ((i) => ({ x: x + 14 * k + 11 * i, y: y - 12 }));
    for (let i = 0; i < p.mess; i++) {
      const c = spot(i);
      g += poopAt(p.uid, c.x, c.y);
    }
    if (p.coin) g += coinAt(p.uid, x, y - 64 * k - 6);
    else if (isHappy(p) && p.joy >= JOY_TARGET / 2) g += heartAt(x + 10 * k, y - 62 * k);
    return g;
  }

  const lampArt = (id) => `<g class="lamp ${lit ? 'lit' : ''}" data-lamp="${id}" role="button" aria-label="Encender o apagar la lámpara">${place(id, ...LAMP_AT[id])}</g>`;

  // Pared y ventana (día o noche)
  out.push(`<rect class="wall" x="0" y="0" width="360" height="226"/>`);
  out.push(`<g class="window">
    <rect x="36" y="36" width="118" height="112" rx="4" fill="url(#${night ? 'sky-night' : 'sky'})"/>
    ${
      night
        ? `<g class="stars" fill="#fff"><circle class="star s1" cx="52" cy="54" r="1.6"/><circle class="star s2" cx="72" cy="88" r="1.2"/><circle class="star s3" cx="62" cy="122" r="1.5"/><circle class="star s2" cx="108" cy="50" r="1.2"/><circle class="star s1" cx="138" cy="84" r="1.5"/><circle class="star s3" cx="122" cy="116" r="1.2"/><circle class="star s1" cx="144" cy="132" r="1.4"/><circle class="star s2" cx="86" cy="64" r="1"/><circle class="star s3" cx="100" cy="104" r="1.4"/><path class="star s2" d="M48 100l1.4 3 3 1.4-3 1.4-1.4 3-1.4-3-3-1.4 3-1.4z"/></g>
    <circle cx="124" cy="64" r="20" fill="#f5f3d7" opacity=".14"/><path d="M122 48a17 17 0 1 0 16 26 14 14 0 0 1-16-26z" fill="#f5f3d7"/><circle cx="118" cy="70" r="1.6" fill="#d9d6b0" opacity=".7"/><circle cx="124" cy="78" r="1.2" fill="#d9d6b0" opacity=".7"/>
    <g class="cloud" opacity=".25"><ellipse cx="78" cy="106" rx="20" ry="6" fill="#aab4e0"/><ellipse cx="92" cy="101" rx="13" ry="6" fill="#aab4e0"/></g>`
        : `<g class="cloud"><ellipse cx="78" cy="70" rx="20" ry="8" fill="#fff"/><ellipse cx="94" cy="64" rx="14" ry="8" fill="#fff"/></g>
    <circle cx="128" cy="58" r="9" fill="#ffd34d"/>`
    }
    <rect x="36" y="36" width="118" height="112" rx="4" fill="none" stroke="var(--frame)" stroke-width="7"/>
    <line x1="95" y1="36" x2="95" y2="148" stroke="var(--frame)" stroke-width="5"/>
    <line x1="36" y1="92" x2="154" y2="92" stroke="var(--frame)" stroke-width="5"/>
    <rect x="28" y="148" width="134" height="9" rx="3" fill="var(--frame)"/>
  </g>`);
  if (has.has('cortinas')) out.push(place('cortinas', 22, 28));

  // Decoración de pared y techo
  if (has.has('guirnalda')) out.push(place('guirnalda', 6, 0));
  if (has.has('disco')) out.push(place('disco', 60, 0));
  if (has.has('espejo')) out.push(place('espejo', 120, 2));
  if (has.has('lampara')) out.push(lampArt('lampara'));
  if (has.has('globos')) out.push(place('globos', 332, 4));
  if (has.has('reloj')) out.push(place('reloj', 184, 18));
  if (has.has('pizarra')) out.push(place('pizarra', 174, 56));
  if (has.has('cuadro')) out.push(place('cuadro', 176, 96));
  if (has.has('bandera')) out.push(place('bandera', 176, 148));
  if (has.has('mapa')) out.push(place('mapa', 102, 160));
  if (has.has('tele')) out.push(place('tele', 226, 98));
  if (has.has('estanteria')) out.push(place('estanteria', 296, 74));
  if (has.has('trofeo')) out.push(`<rect x="228" y="190" width="44" height="5" rx="2" fill="#8b5a2b"/>${place('trofeo', 238, 158)}`);
  if (has.has('libro-ce')) out.push(`<rect x="300" y="76" width="38" height="4" rx="2" fill="#8b5a2b"/>${place('libro-ce', 306, 50)}`);

  // Suelo
  out.push(`<rect class="floor" x="0" y="226" width="360" height="74"/>`);
  out.push(`<g stroke="var(--floor-line)" stroke-width="2"><line x1="0" y1="252" x2="360" y2="252"/><line x1="0" y1="278" x2="360" y2="278"/>
    <line x1="70" y1="226" x2="40" y2="252"/><line x1="200" y1="226" x2="190" y2="252"/><line x1="300" y1="226" x2="320" y2="252"/>
    <line x1="130" y1="252" x2="100" y2="278"/><line x1="250" y1="252" x2="260" y2="278"/><line x1="20" y1="278" x2="10" y2="300"/><line x1="180" y1="278" x2="170" y2="300"/><line x1="330" y1="278" x2="340" y2="300"/></g>`);
  out.push(`<rect class="baseboard" x="0" y="220" width="360" height="9"/>`);
  if (has.has('alfombra')) out.push(place('alfombra', 80, 250));

  // Muebles y herramientas del suelo (detrás de los animales)
  if (has.has('monstera')) out.push(place('monstera', 330, 192));
  if (has.has('lampara-pie')) out.push(lampArt('lampara-pie'));
  if (has.has('sofa')) out.push(place('sofa', 176, 204));
  if (has.has('cojines')) out.push(place('cojines', 190, 216));
  if (has.has('rascador')) out.push(place('rascador', 322, 160));
  if (has.has('conejera')) out.push(place('conejera', 300, 232));
  if (has.has('percha')) out.push(place('percha', 160, 172));
  if (has.has('cama')) out.push(place('cama', 222, 250));
  if (has.has('planta')) out.push(place('planta', 4, 204));
  if (has.has('pecera')) out.push(place('pecera', 98, 196));
  if (has.has('jaula')) out.push(place('jaula', 236, 0));
  if (has.has('cuenco-agua')) out.push(place('cuenco-agua', 168, 250));
  if (has.has('juguete')) out.push(place('juguete', 206, 254));
  if (has.has('regadera')) out.push(place('regadera', 18, 238));

  // Plantas pequeñas (cactus y margaritas) en la repisa de la ventana
  pets
    .filter((p) => p.itemId === 'cactus' || p.itemId === 'margarita')
    .slice(0, 4)
    .forEach((p, i) => out.push(drawPet(p, 100 + i * 18, 148, 0.65, (n) => ({ x: 88 + i * 18 + n * 9, y: 140 }))));

  // Peces: en la pecera si la tienes; si no, uno solo en una pecerita redonda
  const fish = pets.filter((p) => p.itemId === 'pez');
  if (has.has('pecera')) {
    fish.slice(0, 3).forEach((p, i) => out.push(`<g class="swim swim-${i}">${drawPet(p, 112 + i * 16, 242 - (i % 2) * 10, 0.5, (n) => ({ x: 104 + i * 18 + n * 8, y: 244 }))}</g>`));
  } else if (fish[0]) {
    out.push(`<g transform="translate(96 232)"><path d="M0 8a20 18 0 0 0 40 0z" fill="#bfe9ff" fill-opacity=".5" stroke="#93c5fd" stroke-width="2"/><rect x="6" y="6" width="28" height="3" fill="#bfe9ff" opacity=".6"/></g>`);
    out.push(`<g class="swim swim-0">${drawPet(fish[0], 116, 252, 0.45, (n) => ({ x: 106 + n * 9, y: 250 }))}</g>`);
  }

  // Canarios: en la jaula si la tienes; si no, en el suelo con los demás
  const canaries = pets.filter((p) => p.itemId === 'canario');
  if (has.has('jaula')) canaries.slice(0, 2).forEach((p, i) => out.push(drawPet(p, 236 + 16 + i * 17, 50, 0.5, (n) => ({ x: 242 + i * 17 + n * 8, y: 56 }))));

  // Animales con casa (hámster, tortuga, conejo, loro) y los del suelo (gato, perro, bonsái, canario sin jaula y sobrantes)
  const floor = pets.filter((p) => ['gato', 'perro', 'bonsai'].includes(p.itemId) || (p.itemId === 'canario' && !has.has('jaula')));
  for (const [species, home] of Object.entries(HOMES)) {
    const list = pets.filter((p) => p.itemId === species);
    if (has.has(home.tool)) {
      list.slice(0, home.spots.length).forEach((p, i) => out.push(drawPet(p, ...home.spots[i])));
      floor.push(...list.slice(home.spots.length));
    } else floor.push(...list);
  }
  floor.sort((a, b) => a.uid - b.uid);
  const slots = [
    ...[216, 256, 296, 336].map((x) => ({ x, y: FLOOR_Y, s: 1 })),
    ...[236, 276, 316].map((x) => ({ x, y: FLOOR_Y - 14, s: 0.9 })),
  ];
  const placed = floor.slice(0, slots.length).map((p, i) => ({ p, ...slots[i] }));
  for (const { p, x, y, s } of [...placed].sort((a, b) => a.y - b.y)) {
    out.push(shadow(x, y, 16 * STAGE_SCALE[stageOf(p.itemId, p.xp)] * s * (SPECIES[p.itemId].size ?? 1) + 4));
    out.push(drawPet(p, x, y, s));
  }

  // Herramientas pequeñas en primer plano
  if (has.has('rueda')) out.push(place('rueda', 92, 264));
  if (has.has('terrario')) out.push(place('terrario', 132, 272));
  if (has.has('comedero')) out.push(place('comedero', 196, 284));
  if (has.has('radio')) out.push(place('radio', 228, 276));
  if (has.has('abono')) out.push(place('abono', 4, 274));
  if (has.has('cepillo')) out.push(place('cepillo', 28, 288));

  // Avatar
  out.push(shadow(AVATAR_X, FLOOR_Y, 34));
  out.push(`<g class="avatar" transform="translate(${AVATAR_X} ${FLOOR_Y})">${avatar}</g>`);

  // Noche: la casa se oscurece; con una lámpara encendida se ilumina y brilla alrededor
  if (night) {
    out.push(`<rect class="night-shade" x="0" y="0" width="360" height="300" fill="#0a1033" opacity="${lit ? 0.2 : 0.52}" pointer-events="none"/>`);
    if (lit) {
      for (const id of lamps) out.push(`<circle class="glow" cx="${LAMP_SPOT[id][0]}" cy="${LAMP_SPOT[id][1]}" r="170" fill="url(#glow)" pointer-events="none"/>`);
      for (const id of lamps) out.push(`<g class="lamp-lit" pointer-events="none">${place(id, ...LAMP_AT[id])}</g>`);
    }
  }

  return `<svg class="scene ${night ? 'night' : 'day'}" viewBox="0 0 360 300" role="img" aria-label="Tu casa de ${night ? 'noche' : 'día'}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ec5fc"/><stop offset="1" stop-color="#e0f1ff"/></linearGradient>
    <linearGradient id="sky-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070d2e"/><stop offset="1" stop-color="#2d3b7c"/></linearGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".8"/><stop offset=".5" stop-color="#ffc861" stop-opacity=".28"/><stop offset="1" stop-color="#ffc861" stop-opacity="0"/></radialGradient>
  </defs>
  ${out.join('\n')}
</svg>`;
}
