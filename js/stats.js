// Estadísticas (lógica pura). Los días son claves locales AAAA-MM-DD.
import { MAX_DAYS } from './migrations.js';

export function dayKey(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Suma una respuesta al historial diario (muta el borrador) y recorta lo antiguo. */
export function recordDay(doc, nowMs, correct) {
  const k = dayKey(nowMs);
  const d = (doc.stats.byDay[k] ??= { n: 0, ok: 0 });
  d.n += 1;
  if (correct) d.ok += 1;
  for (const old of Object.keys(doc.stats.byDay).sort().slice(0, -MAX_DAYS)) delete doc.stats.byDay[old];
}

/** Últimos `n` días (el último es hoy): [{ key, n, ok }]. */
export function lastDays(doc, nowMs, n = 7) {
  const out = [];
  const base = new Date(nowMs);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() - i);
    const key = dayKey(d.getTime());
    out.push({ key, n: doc.stats.byDay[key]?.n ?? 0, ok: doc.stats.byDay[key]?.ok ?? 0 });
  }
  return out;
}

/** Días consecutivos estudiando, contando hasta hoy (o hasta ayer si hoy aún no se ha estudiado). */
export function studyStreak(doc, nowMs) {
  const base = new Date(nowMs);
  let streak = 0;
  for (let i = 0; i < MAX_DAYS; i++) {
    const key = dayKey(new Date(base.getFullYear(), base.getMonth(), base.getDate() - i).getTime());
    if ((doc.stats.byDay[key]?.n ?? 0) > 0) streak++;
    else if (i > 0) break;
  }
  return streak;
}

/**
 * Dónde más fallas: agrega los fallos por artículo (nº de artículo sin apartado) con las preguntas del banco.
 * @returns {{articulo:string, titulo:string, ok:number, ko:number, pct:number}[]} ordenado de peor a mejor %
 */
export function byArticle(doc, questions, { minAnswers = 2, limit = 8 } = {}) {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const acc = new Map();
  for (const [id, p] of Object.entries(doc.progress)) {
    const q = byId.get(id);
    if (!q || p.ok + p.ko === 0) continue;
    const art = q.articulo.split('.')[0];
    const a = acc.get(art) ?? { articulo: art, titulo: q.titulo, ok: 0, ko: 0 };
    a.ok += p.ok;
    a.ko += p.ko;
    acc.set(art, a);
  }
  return [...acc.values()]
    .filter((a) => a.ok + a.ko >= minAnswers && a.ko > 0)
    .map((a) => ({ ...a, pct: Math.round((a.ok / (a.ok + a.ko)) * 100) }))
    .sort((a, b) => a.pct - b.pct || b.ko - a.ko)
    .slice(0, limit);
}
