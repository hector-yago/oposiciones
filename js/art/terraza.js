// Terraza: habitación que se compra. Vistas a la ciudad de día y de noche (con ventanas encendidas), barandilla, toldo,
// hamaca, barbacoa y telescopio; palomas en la barandilla y un camaleón en su rama.
import { LAMPS, SPECIES, roomOf } from '../catalog.js';
import { STAGE_SCALE } from './pets.js';
import { avatarSvg, makePetDrawer, place, shadow, svgWrap } from './scene.js';
import { seasonSky } from './seasons.js';
import { stageOf } from '../shop.js';

const AVATAR_X = 250;
const FLOOR_Y = 268;
const LAMP_AT = { 'farol-terraza': [286, 210] };
const LAMP_SPOT = { 'farol-terraza': [297, 222] };

const HOMES = {
  paloma: { tool: 'comedero-aves', spots: [[112, 178, 0.8], [134, 178, 0.8], [156, 178, 0.8]] },
  camaleon: { tool: 'rama', spots: [[46, 157, 0.9], [66, 160, 0.9]] },
};
const GROUND = [[70, 268], [120, 272], [170, 276], [210, 272], [330, 274]];
// Edificios del fondo: [x, y, ancho, alto]
const BUILDINGS = [[0, 112, 40, 80], [36, 92, 34, 100], [66, 122, 46, 70], [110, 102, 38, 90], [146, 128, 50, 64], [190, 86, 36, 106], [224, 118, 44, 74], [266, 98, 40, 94], [304, 124, 56, 68]];

/**
 * @param {{gender:'chico'|'chica', inventory?:object[], hopUid?:number|null, night?:boolean, lampOff?:boolean, outfit?:object, season?:string|null}} opts
 */
export function terrazaSvg({ gender, inventory = [], hopUid = null, night = false, lampOff = false, outfit = {}, season = null }) {
  const has = new Set(inventory.filter((i) => !(i.itemId in SPECIES)).map((i) => i.itemId));
  const pets = inventory.filter((i) => i.itemId in SPECIES && roomOf(i.itemId) === 'terraza');
  const lamps = LAMPS.filter((id) => has.has(id) && roomOf(id) === 'terraza');
  const lit = night && lamps.length > 0 && !lampOff;
  const drawPet = makePetDrawer(hopUid);
  const out = [];

  // Cielo y ciudad
  out.push(`<rect x="0" y="0" width="360" height="200" fill="url(#${night ? 'sky-night' : 'sky'})"/>`);
  if (night) {
    out.push(`<g fill="#fff">${Array.from({ length: 24 }, (_, i) => `<circle class="star s${(i % 3) + 1}" cx="${(i * 53 + 12) % 350}" cy="${(i * 31 + 8) % 100}" r="${1 + (i % 3) * 0.3}"/>`).join('')}</g><circle cx="300" cy="46" r="22" fill="#f5f3d7" opacity=".14"/><path d="M298 29a19 19 0 1 0 18 28 15 15 0 0 1-18-28z" fill="#f5f3d7"/>`);
  } else {
    out.push(`<circle cx="304" cy="46" r="15" fill="#ffd34d"/><g class="cloud"><ellipse cx="90" cy="52" rx="28" ry="10" fill="#fff"/><ellipse cx="112" cy="45" rx="18" ry="9" fill="#fff"/></g><ellipse cx="220" cy="78" rx="22" ry="7" fill="#fff" opacity=".85"/>`);
  }
  out.push(seasonSky(season, night, { x: 0, y: 0, w: 360, h: 150 }));
  out.push(BUILDINGS.map(([x, y, w, h], i) => `<g><rect x="${x}" y="${y}" width="${w}" height="${200 - y}" fill="${i % 2 ? 'var(--hill)' : 'var(--hill2)'}"/>${Array.from({ length: Math.floor((200 - y) / 18) }, (_, r) => Array.from({ length: Math.floor(w / 14) }, (_, c) => `<rect x="${x + 5 + c * 14}" y="${y + 6 + r * 18}" width="7" height="9" fill="${night && (r * 3 + c + i) % 3 !== 0 ? '#fde68a' : night ? '#334155' : '#bfdbfe'}" opacity="${night ? 0.9 : 0.7}"/>`).join('')).join('')}</g>`).join(''));

  // Toldo, barandilla y suelo
  if (has.has('toldo')) out.push(place('toldo', 0, 0));
  out.push(`<rect x="0" y="176" width="360" height="5" fill="var(--frame)"/><rect x="0" y="222" width="360" height="5" fill="var(--frame)"/><g fill="var(--frame)">${Array.from({ length: 31 }, (_, i) => `<rect x="${i * 12 + 4}" y="181" width="3.5" height="41"/>`).join('')}</g>`);
  out.push(`<rect class="floor" x="0" y="227" width="360" height="73"/>`);
  out.push(`<g stroke="var(--floor-line)" stroke-width="2"><line x1="0" y1="252" x2="360" y2="252"/><line x1="0" y1="278" x2="360" y2="278"/><line x1="60" y1="227" x2="30" y2="252"/><line x1="190" y1="227" x2="180" y2="252"/><line x1="310" y1="227" x2="330" y2="252"/></g>`);

  // Objetos (de atrás hacia delante)
  if (has.has('rama')) out.push(place('rama', 10, 126));
  if (has.has('comedero-aves')) out.push(`<line x1="120" y1="${has.has('toldo') ? 36 : 0}" x2="120" y2="140" stroke="#9ca3af" stroke-width="1.2"/>${place('comedero-aves', 106, 140)}`);
  if (has.has('macetero')) out.push(place('macetero', 8, 188));
  if (has.has('telescopio')) out.push(place('telescopio', 316, 150));
  if (has.has('hamaca')) out.push(place('hamaca', 180, 170));
  if (has.has('mesita-terraza')) out.push(place('mesita-terraza', 88, 208));
  if (has.has('barbacoa')) out.push(place('barbacoa', 140, 200));
  if (has.has('farol-terraza')) out.push(`<g class="lamp ${lit ? 'lit' : ''}" data-lamp="farol-terraza" role="button" aria-label="Encender o apagar el farol">${place('farol-terraza', ...LAMP_AT['farol-terraza'])}</g>`);

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
  ground.slice(0, GROUND.length).forEach((p, i) => {
    const [x, y] = GROUND[i];
    out.push(shadow(x, y, 14 * STAGE_SCALE[stageOf(p.itemId, p.xp)] * (SPECIES[p.itemId].size ?? 1) + 4));
    out.push(drawPet(p, x, y, 1));
  });

  out.push(shadow(AVATAR_X, FLOOR_Y, 34));
  out.push(`<g class="avatar" transform="translate(${AVATAR_X} ${FLOOR_Y})">${avatarSvg(gender, outfit)}</g>`);

  if (night) {
    out.push(`<rect class="night-shade" x="0" y="0" width="360" height="300" fill="#0a1033" opacity="${lit ? 0.28 : 0.45}" pointer-events="none"/>`);
    if (lit) {
      for (const id of lamps) out.push(`<circle class="glow" cx="${LAMP_SPOT[id][0]}" cy="${LAMP_SPOT[id][1]}" r="170" fill="url(#glow)" pointer-events="none"/>`);
      for (const id of lamps) out.push(`<g class="lamp-lit" pointer-events="none">${place(id, ...LAMP_AT[id])}</g>`);
    }
  }
  return svgWrap(out.join('\n'), { night, room: 'terraza', label: `Tu terraza de ${night ? 'noche' : 'día'}` });
}
