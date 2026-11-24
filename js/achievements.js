// Logros (lógica pura). Cada logro tiene un valor actual `val(ctx)` y un objetivo `target`; está hecho si val >= target.
// ctx = { doc, questions (banco completo), now }
import { CATALOG, EXCLUSIVES, SPECIES } from './catalog.js';
import { ownedIds, petsOf, stageOf } from './shop.js';
import { studyStreak } from './stats.js';
import { statusOf } from './scheduler.js';

const ACCESSORIES = CATALOG.filter((i) => i.cat === 'accesorios').map((i) => i.id);
const has = (ctx, ...ids) => ids.every((id) => ownedIds(ctx.doc).has(id));
const speciesCount = (ctx, sp) => petsOf(ctx.doc).filter((p) => p.itemId === sp).length;
const mastered = (ctx) => Object.values(ctx.doc.progress).filter((p) => statusOf(p) === 'mastered').length;
const adults = (ctx) => petsOf(ctx.doc).filter((p) => stageOf(p.itemId, p.xp) === 2).length;
const bool = (v) => (v ? 1 : 0);

/** Agrupa las preguntas por una clave y cuenta cuántas están dominadas. */
function masteryBy(ctx, keyOf) {
  const groups = new Map();
  for (const q of ctx.questions) {
    const k = keyOf(q);
    const g = groups.get(k) ?? { n: 0, ok: 0 };
    g.n += 1;
    if (statusOf(ctx.doc.progress[q.id]) === 'mastered') g.ok += 1;
    groups.set(k, g);
  }
  return [...groups.values()];
}
/** Títulos de la CE con todas sus preguntas dominadas (mínimo 5 preguntas en el título). */
const titlesMastered = (ctx) => masteryBy(ctx, (q) => `${q.tema}/${q.titulo}`).filter((g) => g.n >= 5 && g.ok === g.n).length;
/** Temas completos dominados (mínimo 20 preguntas en el tema). */
const temasMastered = (ctx) => masteryBy(ctx, (q) => q.tema).filter((g) => g.n >= 20 && g.ok === g.n).length;
/** % de dominio de un tema (0-100). */
const temaPct = (ctx, tema) => {
  const qs = ctx.questions.filter((q) => q.tema === tema);
  return qs.length ? Math.floor((qs.filter((q) => statusOf(ctx.doc.progress[q.id]) === 'mastered').length / qs.length) * 100) : 0;
};

const A = (id, group, name, desc, val, target = 1, art = {}) => ({ id, group, name, desc, val, target, art });
const answered = (c) => c.doc.stats.answered;
const correct = (c) => c.doc.stats.correct;
const care = (c) => c.doc.stats.care;

export const ACHIEVEMENTS = [
  // --- Preguntas: respondidas, acertadas y temas dominados ---
  A('answered_1', 'Preguntas', 'Primer paso', 'Responde tu primera pregunta.', answered, 1, { txt: '1' }),
  A('answered_50', 'Preguntas', '50 respondidas', 'Responde 50 preguntas.', answered, 50, { txt: '50' }),
  A('answered_100', 'Preguntas', '100 respondidas', 'Responde 100 preguntas.', answered, 100, { txt: '100' }),
  A('answered_250', 'Preguntas', '250 respondidas', 'Responde 250 preguntas.', answered, 250, { txt: '250' }),
  A('answered_500', 'Preguntas', '500 respondidas', 'Responde 500 preguntas.', answered, 500, { txt: '500' }),
  A('answered_1000', 'Preguntas', '1000 respondidas', 'Responde 1000 preguntas.', answered, 1000, { txt: '1K' }),
  A('answered_2500', 'Preguntas', 'Incansable', 'Responde 2500 preguntas.', answered, 2500, { txt: '2,5K' }),
  A('correct_10', 'Preguntas', 'Calentando', 'Acierta 10 preguntas.', correct, 10, { txt: '10✓' }),
  A('correct_50', 'Preguntas', 'Medio centenar', 'Acierta 50 preguntas.', correct, 50, { txt: '50✓' }),
  A('correct_100', 'Preguntas', 'Centenario', 'Acierta 100 preguntas.', correct, 100, { txt: '100✓' }),
  A('correct_250', 'Preguntas', 'Constante', 'Acierta 250 preguntas.', correct, 250, { txt: '250✓' }),
  A('correct_500', 'Preguntas', 'Medio millar', 'Acierta 500 preguntas.', correct, 500, { txt: '500✓' }),
  A('correct_1000', 'Preguntas', 'Mil aciertos', 'Acierta 1000 preguntas.', correct, 1000, { txt: '1K✓' }),
  A('mastered_25', 'Preguntas', 'Aprendiendo', 'Domina 25 preguntas (5 aciertos seguidos en cada una).', mastered, 25, { txt: '25★' }),
  A('mastered_100', 'Preguntas', 'Cien dominadas', 'Domina 100 preguntas.', mastered, 100, { txt: '100★' }),
  A('mastered_300', 'Preguntas', 'Trescientas dominadas', 'Domina 300 preguntas.', mastered, 300, { txt: '300★' }),
  A('title_mastered', 'Preguntas', 'Título dominado', 'Domina todas las preguntas de un Título de la Constitución.', titlesMastered, 1, { txt: '★' }),
  A('ce_half', 'Preguntas', 'Mitad de la Constitución', 'Domina el 50 % de las preguntas de la Constitución Española.', (c) => temaPct(c, 'ce'), 50, { txt: '50%' }),
  A('ce_mastered', 'Preguntas', 'Constitución dominada', 'Domina por completo el tema de la Constitución Española.', (c) => bool(temaPct(c, 'ce') >= 100), 1, { txt: 'CE' }),
  A('tema_mastered', 'Preguntas', 'Tema completo', 'Domina todas las preguntas de un tema entero.', temasMastered, 1, { txt: '100%' }),

  // --- Constancia ---
  A('streak_3', 'Constancia', 'Buena racha', 'Encadena 3 aciertos seguidos.', (c) => c.doc.streak.best, 3, { txt: '3' }),
  A('streak_10', 'Constancia', 'Racha perfecta', 'Completa una racha de 10 aciertos seguidos.', (c) => c.doc.streak.tens, 1, { txt: '10' }),
  A('streak_10x5', 'Constancia', 'Imparable', 'Completa 5 rachas de 10.', (c) => c.doc.streak.tens, 5, { txt: '5×' }),
  A('day_3', 'Constancia', 'Constancia', 'Estudia 3 días seguidos.', (c) => studyStreak(c.doc, c.now), 3, { txt: '3d' }),
  A('day_7', 'Constancia', 'Semana completa', 'Estudia 7 días seguidos.', (c) => studyStreak(c.doc, c.now), 7, { txt: '7d' }),
  A('day_30', 'Constancia', 'Un mes de estudio', 'Estudia 30 días seguidos.', (c) => studyStreak(c.doc, c.now), 30, { txt: '30d' }),
  A('login_7', 'Constancia', 'Visita diaria', 'Entra en la app 7 días seguidos.', (c) => c.doc.daily.streak, 7, { txt: '7' }),
  A('box_first', 'Constancia', 'Caja misteriosa', 'Abre tu primera caja misteriosa semanal.', (c) => c.doc.daily.opened, 1, { txt: '?' }),
  A('joker_first', 'Constancia', 'Un empujoncito', 'Usa el comodín 50 % por primera vez.', (c) => c.doc.joker.uses, 1, { txt: '50%' }),
  A('earned_50', 'Constancia', 'Ahorrador', 'Gana 50 monedas en total.', (c) => c.doc.stats.earned, 50, { txt: '50' }),
  A('earned_200', 'Constancia', 'Con posibles', 'Gana 200 monedas en total.', (c) => c.doc.stats.earned, 200, { txt: '200' }),
  A('earned_500', 'Constancia', 'Millonario', 'Gana 500 monedas en total.', (c) => c.doc.stats.earned, 500, { txt: '500' }),

  // --- Mascotas ---
  A('first_pet', 'Mascotas', 'Primer amigo', 'Consigue tu primera mascota.', (c) => petsOf(c.doc).length, 1, { pet: 'cactus' }),
  A('has_cactus', 'Mascotas', 'Pulgar verde', 'Consigue un cactus.', (c) => speciesCount(c, 'cactus'), 1, { pet: 'cactus' }),
  A('has_pez', 'Mascotas', 'Pececito', 'Consigue un pez.', (c) => speciesCount(c, 'pez'), 1, { pet: 'pez' }),
  A('has_canario', 'Mascotas', 'Música en casa', 'Consigue un canario.', (c) => speciesCount(c, 'canario'), 1, { pet: 'canario' }),
  A('has_gato', 'Mascotas', 'Amigo felino', 'Consigue un gato.', (c) => speciesCount(c, 'gato'), 1, { pet: 'gato' }),
  A('has_perro', 'Mascotas', '¡Consigue un perrito!', 'Consigue un perro.', (c) => speciesCount(c, 'perro'), 1, { pet: 'perro' }),
  A('zoo', 'Mascotas', 'Zoológico', 'Ten las 5 especies a la vez.', (c) => new Set(petsOf(c.doc).map((p) => p.itemId)).size, Object.keys(SPECIES).length, { pet: 'gato' }),
  A('pets_6', 'Mascotas', 'Casa llena de vida', 'Ten 6 mascotas a la vez.', (c) => petsOf(c.doc).length, 6, { pet: 'perro' }),
  A('pet_young', 'Mascotas', 'Va creciendo', 'Haz que una mascota llegue a la etapa joven.', (c) => petsOf(c.doc).filter((p) => stageOf(p.itemId, p.xp) >= 1).length, 1, { pet: 'canario' }),
  A('pet_adult', 'Mascotas', 'Ya es adulto', 'Haz que una mascota llegue a la etapa adulta.', adults, 1, { pet: 'perro' }),
  A('adults_3', 'Mascotas', 'Criador', 'Ten 3 mascotas adultas.', adults, 3, { pet: 'gato' }),

  // --- Cuidados ---
  A('calm_1', 'Cuidados', 'Mano amiga', 'Calma a una mascota enfadada.', (c) => care(c).calmed, 1, { pet: 'gato' }),
  A('calm_10', 'Cuidados', 'Encantador de animales', 'Calma a tus mascotas 10 veces.', (c) => care(c).calmed, 10, { pet: 'perro' }),
  A('clean_1', 'Cuidados', 'Manos a la caca', 'Limpia una caca.', (c) => care(c).cleaned, 1, { txt: '💩' }),
  A('clean_10', 'Cuidados', 'Casa limpia', 'Limpia 10 cacas.', (c) => care(c).cleaned, 10, { txt: '10' }),
  A('clean_50', 'Cuidados', 'Reluciente', 'Limpia 50 cacas.', (c) => care(c).cleaned, 50, { txt: '50' }),
  A('petcoin_1', 'Cuidados', 'Mascota afortunada', 'Recoge una moneda que te haya traído una mascota feliz.', (c) => care(c).coins, 1, { txt: '$' }),
  A('petcoin_10', 'Cuidados', 'Lluvia de monedas', 'Recoge 10 monedas de tus mascotas.', (c) => care(c).coins, 10, { txt: '10$' }),

  // --- Casa ---
  A('first_tool', 'Casa', 'Manos a la obra', 'Compra tu primera herramienta.', (c) => CATALOG.filter((i) => i.cat === 'herramientas' && has(c, i.id)).length, 1, { item: 'regadera' }),
  A('aquarium', 'Casa', 'Decora tu pecera', 'Ten una pecera con un pez dentro.', (c) => bool(has(c, 'pecera') && speciesCount(c, 'pez') > 0), 1, { item: 'pecera' }),
  A('cage', 'Casa', 'Un hogar con jaula', 'Ten una jaula con un canario.', (c) => bool(has(c, 'jaula') && speciesCount(c, 'canario') > 0), 1, { item: 'jaula' }),
  A('garden', 'Casa', 'Jardinero', 'Ten una regadera y un cactus.', (c) => bool(has(c, 'regadera') && speciesCount(c, 'cactus') > 0), 1, { item: 'regadera' }),
  A('dog_kit', 'Casa', 'Todo para tu perro', 'Ten un perro con cuenco, cama y pelota.', (c) => bool(has(c, 'cuenco-agua', 'cama', 'juguete') && speciesCount(c, 'perro') > 0), 1, { item: 'juguete' }),
  A('cat_kit', 'Casa', 'Paraíso gatuno', 'Ten un gato con cuenco, cama y rascador.', (c) => bool(has(c, 'cuenco-agua', 'cama', 'rascador') && speciesCount(c, 'gato') > 0), 1, { item: 'rascador' }),
  A('decor_5', 'Casa', 'Decorador', 'Compra 5 accesorios de decoración.', (c) => ACCESSORIES.filter((id) => has(c, id)).length, 5, { item: 'cuadro' }),
  A('decor_all', 'Casa', 'Casa de revista', 'Compra todos los accesorios.', (c) => ACCESSORIES.filter((id) => has(c, id)).length, ACCESSORIES.length, { item: 'trofeo' }),
  A('exclusive_1', 'Casa', 'Pieza única', 'Consigue un objeto exclusivo de la caja misteriosa.', (c) => EXCLUSIVES.filter((e) => has(c, e.id)).length, 1, { item: 'bandera' }),
  A('exclusive_all', 'Casa', 'Coleccionista', 'Consigue todos los objetos exclusivos.', (c) => EXCLUSIVES.filter((e) => has(c, e.id)).length, EXCLUSIVES.length, { item: 'mapa' }),
];

export const ACH_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

/** Valor actual acotado al objetivo, para barras de progreso. */
export const progressOf = (a, ctx) => Math.min(a.target, Math.max(0, a.val(ctx)));

/** Ids de logros cumplidos que aún no están registrados en el documento. */
export function newlyUnlocked(ctx) {
  return ACHIEVEMENTS.filter((a) => !ctx.doc.achievements[a.id] && a.val(ctx) >= a.target).map((a) => a.id);
}

/** Registra los logros (muta el borrador). */
export function unlock(doc, ids, nowMs) {
  for (const id of ids) doc.achievements[id] ??= nowMs;
}
