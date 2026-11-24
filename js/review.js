// Preguntas dudosas: las marcas mientras estudias y luego exportas el informe para revisarlas contra el texto oficial.
import { MAX_FLAGGED } from './migrations.js';

/** Marca o desmarca una pregunta (muta el borrador). Devuelve true si queda marcada. */
export function toggleFlag(doc, questionId, nowMs) {
  if (doc.flagged[questionId]) {
    delete doc.flagged[questionId];
    return false;
  }
  doc.flagged[questionId] = nowMs;
  const keys = Object.keys(doc.flagged);
  if (keys.length > MAX_FLAGGED) {
    keys.sort((a, b) => doc.flagged[a] - doc.flagged[b]);
    for (const k of keys.slice(0, keys.length - MAX_FLAGGED)) delete doc.flagged[k];
  }
  return true;
}

export const clearFlags = (doc) => {
  doc.flagged = {};
};

/** Preguntas marcadas que existen en el banco, las más recientes primero. */
export function flaggedQuestions(doc, questions) {
  const byId = new Map(questions.map((q) => [q.id, q]));
  return Object.entries(doc.flagged)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => byId.get(id))
    .filter(Boolean);
}

/** Informe en texto para pegarlo o enviarlo: cada pregunta con sus opciones, la correcta y la explicación. */
export function flaggedReport(doc, questions) {
  const list = flaggedQuestions(doc, questions);
  if (!list.length) return 'No hay preguntas marcadas como dudosas.';
  const lines = [`Preguntas dudosas (${list.length}). Revisar contra el texto oficial del artículo indicado.`, ''];
  for (const q of list) {
    lines.push(`[${q.id}] ${q.titulo} · Art. ${q.articulo}`);
    lines.push(q.enunciado);
    q.opciones.forEach((o, i) => lines.push(`  ${'ABCD'[i]}) ${o}${i === q.correcta ? '   ← marcada como correcta' : ''}`));
    lines.push(`  Explicación: ${q.explicacion}`);
    lines.push('');
  }
  return lines.join('\n');
}
