// Estudio: tercera habitación (se compra). Despacho con escritorio, librería, ventana de día/noche y animales de biblioteca.
import { LAMPS, SPECIES, roomOf } from '../catalog.js';
import { STAGE_SCALE } from './pets.js';
import { avatarSvg, makePetDrawer, place, shadow, svgWrap } from './scene.js';
import { seasonSky } from './seasons.js';
import { stageOf } from '../shop.js';

const AVATAR_X = 336;
const FLOOR_Y = 266;
const LAMP_AT = { 'lampara-mesa': [100, 146] };
const LAMP_SPOT = { 'lampara-mesa': [112, 168] };

/** Animales con casa dentro del estudio: `spots` = [x, y, escala]. */
const HOMES = {
  raton: { tool: 'queso', spots: [[208, 288, 1], [226, 290, 1], [244, 288, 1]] },
  buho: { tool: 'posadero', spots: [[253, 150, 0.8], [263, 150, 0.8]] },
};
const GROUND = [[150, 284], [190, 288], [110, 288], [268, 282], [300, 288], [60, 288]];

/**
 * @param {{gender:'chico'|'chica', inventory?:object[], hopUid?:number|null, night?:boolean, lampOff?:boolean, outfit?:object, season?:string|null}} opts
 */
export function studySvg({ gender, inventory = [], hopUid = null, night = false, lampOff = false, outfit = {}, season = null }) {
  const has = new Set(inventory.filter((i) => !(i.itemId in SPECIES)).map((i) => i.itemId));
  const pets = inventory.filter((i) => i.itemId in SPECIES && roomOf(i.itemId) === 'estudio');
  const lamps = LAMPS.filter((id) => has.has(id) && roomOf(id) === 'estudio');
  const lit = night && lamps.length > 0 && !lampOff;
  const drawPet = makePetDrawer(hopUid);
  const out = [];

  // Pared, ventana y suelo
  out.push(`<rect class="wall" x="0" y="0" width="360" height="226"/>`);
  out.push(`<g class="window"><rect x="250" y="34" width="92" height="84" rx="4" fill="url(#${night ? 'sky-night' : 'sky'})"/>
    ${
      night
        ? `<g fill="#fff"><circle class="star s1" cx="266" cy="52" r="1.5"/><circle class="star s2" cx="290" cy="80" r="1.2"/><circle class="star s3" cx="318" cy="56" r="1.4"/><circle class="star s1" cx="330" cy="100" r="1.3"/><circle class="star s2" cx="272" cy="104" r="1.1"/></g><path d="M308 46a13 13 0 1 0 12 20 10 10 0 0 1-12-20z" fill="#f5f3d7"/>`
        : `<g class="cloud"><ellipse cx="282" cy="62" rx="16" ry="6" fill="#fff"/><ellipse cx="296" cy="57" rx="11" ry="6" fill="#fff"/></g><circle cx="322" cy="54" r="8" fill="#ffd34d"/>`
    }
    ${seasonSky(season, night, { x: 252, y: 36, w: 88, h: 80 })}
    <rect x="250" y="34" width="92" height="84" rx="4" fill="none" stroke="var(--frame)" stroke-width="6"/><line x1="296" y1="34" x2="296" y2="118" stroke="var(--frame)" stroke-width="4"/><line x1="250" y1="76" x2="342" y2="76" stroke="var(--frame)" stroke-width="4"/>
    <rect x="244" y="118" width="104" height="8" rx="3" fill="var(--frame)"/></g>`);
  out.push(`<rect class="floor" x="0" y="226" width="360" height="74"/>`);
  out.push(`<g stroke="var(--floor-line)" stroke-width="2"><line x1="0" y1="252" x2="360" y2="252"/><line x1="0" y1="278" x2="360" y2="278"/><line x1="70" y1="226" x2="40" y2="252"/><line x1="200" y1="226" x2="190" y2="252"/><line x1="300" y1="226" x2="320" y2="252"/><line x1="130" y1="252" x2="100" y2="278"/><line x1="250" y1="252" x2="260" y2="278"/></g>`);
  out.push(`<rect class="baseboard" x="0" y="220" width="360" height="9"/>`);

  // Pared y muebles (de atrás hacia delante)
  if (has.has('diploma')) out.push(place('diploma', 108, 52));
  if (has.has('estanteria-grande')) out.push(place('estanteria-grande', 8, 100));
  if (has.has('globo-terraqueo')) out.push(place('globo-terraqueo', 272, 206));
  if (has.has('posadero')) out.push(place('posadero', 240, 134));
  if (has.has('silla')) out.push(place('silla', 78, 196));
  if (has.has('escritorio')) out.push(place('escritorio', 100, 176));
  if (has.has('ordenador')) out.push(place('ordenador', 126, 142));
  if (has.has('libros')) out.push(place('libros', 192, 160));
  if (has.has('lampara-mesa')) out.push(`<g class="lamp ${lit ? 'lit' : ''}" data-lamp="lampara-mesa" role="button" aria-label="Encender o apagar el flexo">${place('lampara-mesa', ...LAMP_AT['lampara-mesa'])}</g>`);

  // Animales con casa y los del suelo
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
  if (has.has('queso')) out.push(place('queso', 200, 276));
  ground.slice(0, GROUND.length).forEach((p, i) => {
    const [x, y] = GROUND[i];
    out.push(shadow(x, y, 14 * STAGE_SCALE[stageOf(p.itemId, p.xp)] * (SPECIES[p.itemId].size ?? 1) + 4));
    out.push(drawPet(p, x, y, 1));
  });

  // Avatar
  out.push(shadow(AVATAR_X, FLOOR_Y, 34));
  out.push(`<g class="avatar" transform="translate(${AVATAR_X} ${FLOOR_Y})">${avatarSvg(gender, outfit)}</g>`);

  if (night) {
    out.push(`<rect class="night-shade" x="0" y="0" width="360" height="300" fill="#0a1033" opacity="${lit ? 0.2 : 0.52}" pointer-events="none"/>`);
    if (lit) {
      for (const id of lamps) out.push(`<circle class="glow" cx="${LAMP_SPOT[id][0]}" cy="${LAMP_SPOT[id][1]}" r="170" fill="url(#glow)" pointer-events="none"/>`);
      for (const id of lamps) out.push(`<g class="lamp-lit" pointer-events="none">${place(id, ...LAMP_AT[id])}</g>`);
    }
  }
  return svgWrap(out.join('\n'), { night, room: 'estudio', label: `Tu estudio de ${night ? 'noche' : 'día'}` });
}
