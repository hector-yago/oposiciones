// Modo examen: preguntas sin pistas, con tiempo y nota (los fallos restan 1/3 de acierto, como en muchas oposiciones).
import { updateProgress } from './scheduler.js';
import { MAX_EXAMS } from './migrations.js';
import { recordDay } from './stats.js';
import { trackAnswer, trackEvent } from './missions.js';

export const EXAM_SIZES = [10, 20, 40, 100];
export const SECS_PER_QUESTION = 50;
export const PASS_MARK = 5;
export const PENALTY = 1 / 3;

/** Elige `n` preguntas distintas al azar. */
export function pickExam(questions, n, rng = Math.random) {
  const pool = questions.filter((q) => !q.retirada);
  const a = [...pool];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(n, a.length));
}

/** Nota sobre 10: (aciertos − fallos/3) / n × 10, nunca negativa. Las preguntas en blanco no restan. */
export function scoreOf({ ok, ko, n }) {
  if (n <= 0) return 0;
  return Math.max(0, Math.round(((ok - ko * PENALTY) / n) * 1000) / 100);
}

/** Monedas por aprobar: la parte entera de la nota (máx. 10); suspenso = 0. */
export const examCoins = (score) => (score >= PASS_MARK ? Math.min(10, Math.floor(score)) : 0);

export const timeLimit = (n) => n * SECS_PER_QUESTION;

/** Cuenta una respuesta del examen: progreso y estadísticas, pero sin monedas, racha ni efectos en mascotas. */
export function applyExamAnswer(doc, question, correct, nowMs) {
  doc.stats.answered += 1;
  const t = (doc.stats.byTitle[question.titulo] ??= { ok: 0, ko: 0 });
  doc.progress[question.id] = updateProgress(doc.progress[question.id], correct, nowMs, doc.stats.answered);
  recordDay(doc, nowMs, correct);
  if (correct) {
    t.ok += 1;
    doc.stats.correct += 1;
  } else t.ko += 1;
  trackAnswer(doc, question, correct, 0, nowMs);
}

/** Guarda el resultado y entrega la recompensa. Devuelve { score, coins, passed }. */
export function recordExam(doc, { n, ok, ko, blank, secs }, nowMs) {
  const score = scoreOf({ ok, ko, n });
  const coins = examCoins(score);
  doc.exams.push({ at: nowMs, n, ok, ko, blank, score, secs: Math.max(0, Math.round(secs)) });
  while (doc.exams.length > MAX_EXAMS) doc.exams.shift();
  doc.coins += coins;
  doc.stats.earned += coins;
  trackEvent(doc, 'exam');
  return { score, coins, passed: score >= PASS_MARK };
}

export function formatSecs(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
