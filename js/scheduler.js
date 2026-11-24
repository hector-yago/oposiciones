// Repetición espaciada (cajas de Leitner). Lógica pura: recibe el reloj y el azar como parámetros.
//  - Cajas 1..5 con intervalos crecientes: lo que aciertas vuelve cada vez menos.
//  - Caja 0 = fallada: vuelve «de vez en cuando» (nunca antes de MIN_GAP preguntas) y con poco peso.
//  - Las nuevas se priorizan, pero se cuelan falladas y repasos según los pesos.
export const DAY_MS = 86400000;
export const INTERVAL_DAYS = [0, 1, 3, 7, 15, 30]; // índice = caja
export const MIN_GAP = 8; // preguntas mínimas antes de repetir una fallada
export const WEIGHTS = { new: 6, failed: 2, due: 3 };

export function newProgress() {
  return { box: -1, ok: 0, ko: 0, last: 0, due: 0, failedSeq: 0 };
}

/** Estado de una pregunta: 'new' | 'failed' | 'learning' (caja 1-4) | 'mastered' (caja 5). */
export function statusOf(p) {
  if (!p || (p.ok === 0 && p.ko === 0)) return 'new';
  if (p.box <= 0) return 'failed';
  return p.box >= 5 ? 'mastered' : 'learning';
}

/** Actualiza el progreso tras responder. `seq` = nº de respuestas dadas hasta ahora (incluida esta). */
export function updateProgress(prev, correct, nowMs, seq) {
  const p = { ...newProgress(), ...prev };
  p.last = nowMs;
  if (correct) {
    p.ok += 1;
    p.box = Math.min(5, Math.max(0, p.box) + 1);
    p.due = nowMs + INTERVAL_DAYS[p.box] * DAY_MS;
  } else {
    p.ko += 1;
    p.box = 0;
    p.due = nowMs;
    p.failedSeq = seq;
  }
  return p;
}

/**
 * Elige la siguiente pregunta.
 * @param {object[]} questions banco (con `id`)
 * @param {object} progress mapa id → progreso
 * @param {{now:number, seq:number, recent?:string[], rng?:()=>number}} ctx
 * @returns {object|null}
 */
export function pickNext(questions, progress, { now, seq, recent = [], rng = Math.random }) {
  const pool = questions.filter((q) => !q.retirada);
  if (!pool.length) return null;
  const avoid = new Set(recent.slice(-MIN_GAP));
  const groups = { new: [], failed: [], due: [] };
  for (const q of pool) {
    if (avoid.has(q.id)) continue;
    const p = progress[q.id];
    const st = statusOf(p);
    if (st === 'new') groups.new.push(q);
    else if (st === 'failed') {
      if (seq - (p.failedSeq ?? 0) >= MIN_GAP) groups.failed.push(q);
    } else if (p.due <= now) groups.due.push(q);
  }
  const kinds = Object.keys(groups).filter((k) => groups[k].length);
  if (kinds.length) {
    let r = rng() * kinds.reduce((s, k) => s + WEIGHTS[k], 0);
    let kind = kinds[kinds.length - 1];
    for (const k of kinds) {
      r -= WEIGHTS[k];
      if (r < 0) {
        kind = k;
        break;
      }
    }
    const list = groups[kind];
    return list[Math.min(list.length - 1, Math.floor(rng() * list.length))];
  }
  // Nada «toca»: repaso anticipado de lo que antes vencería (evita quedarse sin preguntas).
  // Una fallada reciente nunca se adelanta: solo entra si no hay otra cosa.
  const tooSoon = (q) => statusOf(progress[q.id]) === 'failed' && seq - (progress[q.id].failedSeq ?? 0) < MIN_GAP;
  const rest = pool.filter((q) => !avoid.has(q.id) && !tooSoon(q));
  const source = rest.length ? rest : pool;
  return [...source].sort((a, b) => (progress[a.id]?.due ?? 0) - (progress[b.id]?.due ?? 0))[0];
}
