// Cocina: habitación que se compra. Azulejos, ventana de día/noche, nevera, fogón, mesa, abejas junto a su tarro de miel
// y un pingüino fresquito con su cubo de hielo.
import { LAMPS, SPECIES, roomOf } from '../catalog.js';
import { STAGE_SCALE } from './pets.js';
import { avatarSvg, makePetDrawer, place, shadow, svgWrap } from './scene.js';
import { seasonSky } from './seasons.js';
import { stageOf } from '../shop.js';

const AVATAR_X = 40;
const FLOOR_Y = 266;
const LAMP_AT = { 'lampara-cocina': [150, 0] };
const LAMP_SPOT = { 'lampara-cocina': [168, 42] };

/** Animales con casa: `spots` = [x, y, escala]. Las abejas revolotean (clase `swim`). */
const HOMES = {
  abeja: { tool: 'tarro', spots: [[158, 212, 1], [174, 218, 1], [146, 216, 1], [166, 226, 1]], flies: true },
  pinguino: { tool: 'cubo-hielo', spots: [[318, 254, 0.9], [342, 256, 0.9]] },
};
const GROUND = [[120, 284], [190, 288], [240, 286], [280, 290], [90, 290], [330, 292]];

/**
 * @param {{gender:'chico'|'chica', inventory?:object[], hopUid?:number|null, night?:boolean, lampOff?:boolean, outfit?:object, season?:string|null}} opts
 */
export function cocinaSvg({ gender, inventory = [], hopUid = null, night = false, lampOff = false, outfit = {}, season = null }) {
  const has = new Set(inventory.filter((i) => !(i.itemId in SPECIES)).map((i) => i.itemId));
  const pets = inventory.filter((i) => i.itemId in SPECIES && roomOf(i.itemId) === 'cocina');
  const lamps = LAMPS.filter((id) => has.has(id) && roomOf(id) === 'cocina');
  const lit = night && lamps.length > 0 && !lampOff;
  const drawPet = makePetDrawer(hopUid);
  const out = [];

  // Pared de azulejos, ventana y suelo
  out.push(`<rect class="wall" x="0" y="0" width="360" height="226"/>`);
  out.push(`<g stroke="var(--floor-line)" stroke-width="1.2" opacity=".25">${Array.from({ length: 12 }, (_, i) => `<line x1="${i * 30}" y1="0" x2="${i * 30}" y2="226"/>`).join('')}${Array.from({ length: 8 }, (_, i) => `<line x1="0" y1="${i * 30 + 16}" x2="360" y2="${i * 30 + 16}"/>`).join('')}</g>`);
  out.push(`<g class="window"><rect x="236" y="36" width="92" height="80" rx="4" fill="url(#${night ? 'sky-night' : 'sky'})"/>
    ${
      night
        ? `<g fill="#fff"><circle class="star s1" cx="252" cy="54" r="1.5"/><circle class="star s2" cx="276" cy="82" r="1.2"/><circle class="star s3" cx="304" cy="58" r="1.4"/><circle class="star s1" cx="316" cy="98" r="1.3"/></g><path d="M296 46a12 12 0 1 0 11 18 9 9 0 0 1-11-18z" fill="#f5f3d7"/>`
        : `<g class="cloud"><ellipse cx="266" cy="60" rx="15" ry="6" fill="#fff"/><ellipse cx="280" cy="55" rx="10" ry="6" fill="#fff"/></g><circle cx="308" cy="54" r="8" fill="#ffd34d"/>`
    }
    ${seasonSky(season, night, { x: 238, y: 38, w: 88, h: 76 })}
    <rect x="236" y="36" width="92" height="80" rx="4" fill="none" stroke="var(--frame)" stroke-width="6"/><line x1="282" y1="36" x2="282" y2="116" stroke="var(--frame)" stroke-width="4"/><line x1="236" y1="76" x2="328" y2="76" stroke="var(--frame)" stroke-width="4"/>
    <rect x="230" y="116" width="104" height="8" rx="3" fill="var(--frame)"/></g>`);
  out.push(`<rect class="floor" x="0" y="226" width="360" height="74"/>`);
  out.push(`<g stroke="var(--floor-line)" stroke-width="2"><line x1="0" y1="252" x2="360" y2="252"/><line x1="0" y1="278" x2="360" y2="278"/><line x1="70" y1="226" x2="40" y2="252"/><line x1="200" y1="226" x2="190" y2="252"/><line x1="300" y1="226" x2="320" y2="252"/><line x1="130" y1="252" x2="100" y2="278"/><line x1="250" y1="252" x2="260" y2="278"/></g>`);
  out.push(`<rect class="baseboard" x="0" y="220" width="360" height="9"/>`);

  // Muebles (de atrás hacia delante)
  if (has.has('lampara-cocina')) out.push(`<g class="lamp ${lit ? 'lit' : ''}" data-lamp="lampara-cocina" role="button" aria-label="Encender o apagar la lámpara">${place('lampara-cocina', ...LAMP_AT['lampara-cocina'])}</g>`);
  if (has.has('nevera')) out.push(place('nevera', 300, 138));
  if (has.has('fogon')) out.push(place('fogon', 74, 186));
  if (has.has('mesa')) out.push(place('mesa', 170, 200));
  if (has.has('fruta')) out.push(place('fruta', 184, 184));
  if (has.has('cafetera')) out.push(place('cafetera', 232, 170));
  if (has.has('taburete')) out.push(place('taburete', 262, 212));
  if (has.has('tarro')) out.push(place('tarro', 150, 226));
  if (has.has('cubo-hielo')) out.push(place('cubo-hielo', 296, 232));

  // Animales con casa y los del suelo
  const ground = [];
  const used = {};
  for (const p of pets) {
    const home = HOMES[p.itemId];
    if (home && has.has(home.tool)) {
      const taken = (used[home.tool] ??= 0);
      if (taken < home.spots.length) {
        used[home.tool] += 1;
        const drawn = drawPet(p, ...home.spots[taken]);
        out.push(home.flies ? `<g class="swim swim-${taken % 3}">${drawn}</g>` : drawn);
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

  out.push(shadow(AVATAR_X, FLOOR_Y, 34));
  out.push(`<g class="avatar" transform="translate(${AVATAR_X} ${FLOOR_Y})">${avatarSvg(gender, outfit)}</g>`);

  if (night) {
    out.push(`<rect class="night-shade" x="0" y="0" width="360" height="300" fill="#0a1033" opacity="${lit ? 0.2 : 0.52}" pointer-events="none"/>`);
    if (lit) {
      for (const id of lamps) out.push(`<circle class="glow" cx="${LAMP_SPOT[id][0]}" cy="${LAMP_SPOT[id][1]}" r="170" fill="url(#glow)" pointer-events="none"/>`);
      for (const id of lamps) out.push(`<g class="lamp-lit" pointer-events="none">${place(id, ...LAMP_AT[id])}</g>`);
    }
  }
  return svgWrap(out.join('\n'), { night, room: 'cocina', label: `Tu cocina de ${night ? 'noche' : 'día'}` });
}
