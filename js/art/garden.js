// Jardín: segunda habitación (se compra). Cielo de día/noche, valla, hierba, árbol y los animales de granja con sus casas.
import { LAMPS, SPECIES, roomOf } from '../catalog.js';
import { STAGE_SCALE } from './pets.js';
import { avatarSvg, makePetDrawer, place, shadow, svgWrap } from './scene.js';
import { seasonGarden, seasonSky } from './seasons.js';
import { stageOf } from '../shop.js';

const AVATAR_X = 60;
const FLOOR_Y = 266;
const LAMP_AT = { farola: [8, 150] };
const LAMP_SPOT = { farola: [20, 160] };

/** Animales del jardín con su casa: `spots` = [x, y, escala] de cada ejemplar dentro de ella. */
const HOMES = {
  pollito: { tool: 'nido', spots: [[108, 286, 0.9], [124, 290, 0.9], [140, 286, 0.9]] },
  patito: { tool: 'estanque', spots: [[196, 282, 0.9], [222, 288, 0.9], [248, 282, 0.9]] },
  cerdito: { tool: 'corral', spots: [[290, 238, 0.85], [316, 242, 0.85], [342, 238, 0.85]] },
  ovejita: { tool: 'corral', spots: [[290, 238, 0.85], [316, 242, 0.85], [342, 238, 0.85]] },
  zorro: { tool: 'madriguera', spots: [[122, 252, 0.85], [138, 256, 0.85]] },
  panda: { tool: 'bambu', spots: [[322, 286, 0.9], [350, 286, 0.9]] },
};
const GROUND = [[160, 244], [190, 248], [220, 246], [250, 250], [60, 292], [90, 296], [130, 264], [300, 266], [330, 270], [200, 294], [262, 292], [30, 296]];

/**
 * @param {{gender:'chico'|'chica', inventory?:object[], hopUid?:number|null, night?:boolean, lampOff?:boolean, outfit?:object, season?:string|null}} opts
 */
export function gardenSvg({ gender, inventory = [], hopUid = null, night = false, lampOff = false, outfit = {}, season = null }) {
  const has = new Set(inventory.filter((i) => !(i.itemId in SPECIES)).map((i) => i.itemId));
  const pets = inventory.filter((i) => i.itemId in SPECIES && roomOf(i.itemId) === 'jardin');
  const lamps = LAMPS.filter((id) => has.has(id) && roomOf(id) === 'jardin');
  const lit = night && lamps.length > 0 && !lampOff;
  const drawPet = makePetDrawer(hopUid);
  const out = [];

  // Cielo, astros y colinas
  out.push(`<rect x="0" y="0" width="360" height="190" fill="url(#${night ? 'sky-night' : 'sky'})"/>`);
  if (night) {
    out.push(`<g fill="#fff">${Array.from({ length: 22 }, (_, i) => `<circle class="star s${(i % 3) + 1}" cx="${(i * 47 + 20) % 350}" cy="${(i * 29 + 10) % 120}" r="${1 + (i % 3) * 0.3}"/>`).join('')}</g>`);
    out.push(`<circle cx="290" cy="46" r="24" fill="#f5f3d7" opacity=".14"/><path d="M288 28a20 20 0 1 0 20 30 16 16 0 0 1-20-30z" fill="#f5f3d7"/>`);
  } else {
    out.push(`<circle cx="300" cy="44" r="16" fill="#ffd34d"/><g class="cloud"><ellipse cx="90" cy="50" rx="30" ry="11" fill="#fff"/><ellipse cx="114" cy="42" rx="20" ry="10" fill="#fff"/></g><ellipse cx="220" cy="80" rx="24" ry="8" fill="#fff" opacity=".85"/>`);
  }
  out.push(seasonSky(season, night, { x: 0, y: 0, w: 360, h: 150 }));
  out.push(`<ellipse cx="60" cy="176" rx="130" ry="40" fill="var(--hill)"/><ellipse cx="270" cy="182" rx="150" ry="44" fill="var(--hill2)"/>`);

  // Árbol grande y valla
  out.push(`<g class="tree"><rect x="318" y="86" width="16" height="92" rx="4" fill="#7c4a21"/><circle cx="326" cy="72" r="34" fill="#2f9e5b"/><circle cx="300" cy="90" r="22" fill="#38a965"/><circle cx="350" cy="88" r="22" fill="#2f9e5b"/><circle cx="318" cy="56" r="16" fill="#46b872"/></g>`);
  out.push(`<rect class="grass" x="0" y="176" width="360" height="124"/>`);
  out.push(`<g fill="#c8924f">${Array.from({ length: 19 }, (_, i) => `<rect x="${i * 19 + 2}" y="148" width="9" height="34" rx="2"/>`).join('')}</g><rect x="0" y="158" width="360" height="5" fill="#a9703a"/><rect x="0" y="172" width="360" height="5" fill="#a9703a"/>`);
  out.push(`<g stroke="var(--grass-dark)" stroke-width="2" stroke-linecap="round">${Array.from({ length: 16 }, (_, i) => `<path d="M${(i * 41 + 14) % 350} ${210 + ((i * 17) % 80)}l-2 -6M${(i * 41 + 14) % 350} ${210 + ((i * 17) % 80)}l2 -6"/>`).join('')}</g>`);
  out.push(`<g>${[40, 150, 228, 330].map((x, i) => `<circle cx="${x}" cy="${222 + i * 15}" r="2.6" fill="${['#f472b6', '#fbbf24', '#fff', '#a78bfa'][i]}"/>`).join('')}</g>`);

  // Objetos del jardín (detrás de los animales)
  if (has.has('columpio')) out.push(place('columpio', 196, 122));
  if (has.has('fuente')) out.push(place('fuente', 150, 188));
  if (has.has('banco')) out.push(place('banco', 82, 176));
  if (has.has('farola')) out.push(`<g class="lamp ${lit ? 'lit' : ''}" data-lamp="farola" role="button" aria-label="Encender o apagar la farola">${place('farola', ...LAMP_AT.farola)}</g>`);
  if (has.has('madriguera')) out.push(place('madriguera', 102, 226));
  if (has.has('corral')) out.push(place('corral', 274, 200));
  if (has.has('huerto')) out.push(place('huerto', 262, 254));
  if (has.has('estanque')) out.push(place('estanque', 176, 262));
  if (has.has('nido')) out.push(place('nido', 100, 282));
  if (has.has('bambu')) out.push(place('bambu', 306, 238));
  out.push(seasonGarden(season));

  // Animales con casa y los demás por el suelo
  const ground = [];
  const used = {};
  for (const p of pets) {
    const home = HOMES[p.itemId];
    if (home && has.has(home.tool)) {
      const taken = (used[home.tool] ??= 0);
      if (taken < home.spots.length) {
        used[home.tool] += 1;
        out.push(drawPet(p, ...home.spots[taken]));
        continue;
      }
    }
    ground.push(p);
  }
  ground.slice(0, GROUND.length).forEach((p, i) => {
    const [x, y] = GROUND[i];
    out.push(shadow(x, y, 14 * STAGE_SCALE[stageOf(p.itemId, p.xp)] * (SPECIES[p.itemId].size ?? 1) + 4));
    out.push(drawPet(p, x, y, 1));
  });

  // Avatar
  out.push(shadow(AVATAR_X, FLOOR_Y, 34));
  out.push(`<g class="avatar" transform="translate(${AVATAR_X} ${FLOOR_Y})">${avatarSvg(gender, outfit)}</g>`);

  // Noche: se oscurece; con la farola encendida brilla
  if (night) {
    out.push(`<rect class="night-shade" x="0" y="0" width="360" height="300" fill="#0a1033" opacity="${lit ? 0.3 : 0.5}" pointer-events="none"/>`);
    if (lit) {
      for (const id of lamps) out.push(`<circle class="glow" cx="${LAMP_SPOT[id][0]}" cy="${LAMP_SPOT[id][1]}" r="170" fill="url(#glow)" pointer-events="none"/>`);
      for (const id of lamps) out.push(`<g class="lamp-lit" pointer-events="none">${place(id, ...LAMP_AT[id])}</g>`);
    }
  }
  return svgWrap(out.join('\n'), { night, room: 'jardin', label: `Tu jardín de ${night ? 'noche' : 'día'}` });
}
