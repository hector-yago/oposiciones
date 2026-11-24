// Misiones diarias y semanales. Lógica pura: se generan a partir de la fecha (sin azar visible: mismo día = mismas misiones).
import { dayKey } from './stats.js';

export const TITLES = ['Título Preliminar', 'Título I', 'Título II', 'Título III', 'Título IV', 'Título V', 'Título VI', 'Título VII', 'Título VIII', 'Título IX', 'Título X'];

const DAILY_POOL = [
  { type: 'answer', target: 10, reward: 2 },
  { type: 'answer', target: 20, reward: 3 },
  { type: 'correct', target: 8, reward: 3 },
  { type: 'correct', target: 15, reward: 4 },
  { type: 'streak', target: 5, reward: 3 },
  { type: 'titulo', target: 5, reward: 3 },
  { type: 'care', target: 2, reward: 2 },
  { type: 'game', target: 1, reward: 2 },
];
const WEEKLY_POOL = [
  { type: 'answer', target: 100, reward: 15 },
  { type: 'correct', target: 70, reward: 18 },
  { type: 'streak', target: 10, reward: 12 },
  { type: 'titulo', target: 20, reward: 15 },
  { type: 'exam', target: 1, reward: 12 },
  { type: 'days', target: 5, reward: 12 },
  { type: 'care', target: 10, reward: 10 },
];

/** Generador pseudoaleatorio determinista (mulberry32) a partir de una cadena. */
export function seeded(key) {
  let h = 1779033703;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 3432918353) << 13 | h >>> 19;
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Semana ISO (lunes a domingo) como «AAAA-Www». */
export function weekKey(ms) {
  const d = new Date(ms);
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const week = Math.ceil(((t - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7);
  return `${y}-W${String(week).padStart(2, '0')}`;
}

function pickMissions(pool, key, n, titles = TITLES) {
  const rng = seeded(key);
  const bag = [...pool];
  const out = [];
  while (out.length < n && bag.length) {
    const m = bag.splice(Math.floor(rng() * bag.length), 1)[0];
    const titulo = m.type === 'titulo' ? titles[Math.floor(rng() * titles.length)] : '';
    out.push({ id: `${m.type}-${m.target}${titulo ? `-${titulo}` : ''}`, type: m.type, target: m.target, titulo, progress: 0, reward: m.reward, claimed: false });
  }
  return out;
}

/** Días de la semana en curso en los que se ha estudiado. */
export function studyDaysThisWeek(doc, nowMs) {
  const now = new Date(nowMs);
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  let n = 0;
  for (let i = 0; i < 7; i++) {
    const k = dayKey(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i).getTime());
    if ((doc.stats.byDay[k]?.n ?? 0) > 0) n++;
  }
  return n;
}

/** Crea las misiones de hoy y de esta semana si hace falta (muta el borrador). Devuelve true si cambió algo. */
export function ensureMissions(doc, nowMs, titles = TITLES) {
  const day = dayKey(nowMs);
  const week = weekKey(nowMs);
  let changed = false;
  if (doc.missions.day !== day) {
    doc.missions.day = day;
    doc.missions.daily = pickMissions(DAILY_POOL, `d:${day}`, 3, titles);
    changed = true;
  }
  if (doc.missions.week !== week) {
    doc.missions.week = week;
    doc.missions.weekly = pickMissions(WEEKLY_POOL, `w:${week}`, 3, titles);
    changed = true;
  }
  return changed;
}

const active = (doc) => [...doc.missions.daily, ...doc.missions.weekly].filter((m) => !m.claimed);
const bump = (m, to) => {
  m.progress = Math.min(m.target, Math.max(m.progress, to));
};

/** Cuenta una respuesta en las misiones. `streakNow` = racha alcanzada con este acierto (antes de reiniciarse al llegar a 10). */
export function trackAnswer(doc, question, correct, streakNow, nowMs) {
  for (const m of active(doc)) {
    if (m.type === 'answer') bump(m, m.progress + 1);
    else if (m.type === 'correct' && correct) bump(m, m.progress + 1);
    else if (m.type === 'streak') bump(m, streakNow);
    else if (m.type === 'titulo' && correct && question.titulo === m.titulo) bump(m, m.progress + 1);
    else if (m.type === 'days') bump(m, studyDaysThisWeek(doc, nowMs));
  }
}

/** Cuenta un hecho suelto: 'care' (calmar/limpiar), 'game' (minijuego), 'exam' (examen). */
export function trackEvent(doc, type) {
  for (const m of active(doc)) if (m.type === type) bump(m, m.progress + 1);
}

export const isDone = (m) => m.progress >= m.target;

/** Cobra una misión terminada. Devuelve las monedas (0 si no se podía). */
export function claimMission(doc, list, id) {
  const m = doc.missions[list]?.find((x) => x.id === id);
  if (!m || m.claimed || !isDone(m)) return 0;
  m.claimed = true;
  doc.stats.missions += 1;
  doc.coins += m.reward;
  doc.stats.earned += m.reward;
  return m.reward;
}

export const missionText = (m) =>
  ({
    answer: `Responde ${m.target} preguntas`,
    correct: `Acierta ${m.target} preguntas`,
    streak: `Encadena ${m.target} aciertos seguidos`,
    titulo: `Acierta ${m.target} preguntas del ${m.titulo}`,
    care: `Cuida a tus mascotas ${m.target} ${m.target === 1 ? 'vez' : 'veces'} (calmar o limpiar)`,
    game: `Juega ${m.target} minijuego`,
    exam: `Haz ${m.target} examen`,
    days: `Estudia ${m.target} días esta semana`,
  })[m.type];
