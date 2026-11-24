// Extractor genérico de leyes del BOE (XML de la API de legislación consolidada) → artículos en texto plano.
// Usa SIEMPRE la última versión vigente de cada bloque (incluye todas las reformas).
// Sirve para la Constitución y para cualquier otra ley con la misma estructura (título, capítulo, artículo, párrafo).

const clean = (s) =>
  s
    .replace(/<br\s*\/?>/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const titleCase = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

/** «TÍTULO PRELIMINAR» → «Título Preliminar»; «CAPÍTULO II» → «Capítulo II» (los números romanos se conservan). */
export function groupLabel(raw) {
  const m = raw.match(/^(T[ÍI]TULO|CAP[ÍI]TULO|SECCI[ÓO]N)\s*(.*)$/i);
  if (!m) return raw;
  const kind = titleCase(m[1].replace('TITULO', 'TÍTULO').replace('CAPITULO', 'CAPÍTULO').replace('SECCION', 'SECCIÓN'));
  const rest = m[2].replace(/\.\s.*$/, '').trim(); // «III. Del procedimiento» → «III»; «1.ª» se conserva
  const isRoman = /^[IVXLC]+\b/i.test(rest);
  const first = rest.split(/\s+/)[0] ?? '';
  const label = isRoman ? first.toUpperCase() : /^(PRELIMINAR|PRELIMINARES)$/i.test(first) ? titleCase(first) : first;
  return `${kind} ${label}`.trim();
}

/**
 * @param {string} xml XML de la API (con todas las versiones de cada bloque)
 * @returns {{ articles: Record<string, {titulo:string, grupo:string, texto:string}>, lines: string[] }}
 */
export function extractLaw(xml) {
  const blocks = [...xml.matchAll(/<bloque\b[^>]*>([\s\S]*?)<\/bloque>/g)];
  const latest = blocks.map((b) => [...b[1].matchAll(/<version\b[^>]*>([\s\S]*?)<\/version>/g)].at(-1)?.[1] ?? '').join('\n');
  const re = /<p class="([^"]+)"[^>]*>([\s\S]*?)<\/p>/g;
  let titulo = 'Preliminar';
  let grupo = 'Título Preliminar';
  let current = null;
  const articles = {};
  const lines = [];
  let m;
  while ((m = re.exec(latest))) {
    const [, cls, body] = m;
    const t = clean(body);
    if (!t) continue;
    if (cls === 'titulo') {
      titulo = /PRELIMINAR/i.test(t) ? 'Preliminar' : t.replace(/^T[ÍI]TULO\s+/i, '');
      grupo = groupLabel(t);
      lines.push(`\n=== ${t} ===`);
    } else if (cls === 'titulo_num') {
      titulo = t.replace(/^T[ÍI]TULO\s+/i, '');
      grupo = groupLabel(t);
      lines.push(`\n=== ${t} ===`);
    } else if (['titulo_tit', 'capitulo_tit', 'capitulo_num', 'capitulo', 'seccion'].includes(cls)) lines.push(`--- ${t}`);
    else if (cls === 'articulo') {
      const n = t.match(/^Artículo\s+(\d+(?:\s+(?:bis|ter|quater|quinquies))?)/i)?.[1]?.replace(/\s+/g, ' ');
      if (n && !articles[n]) {
        current = { titulo, grupo, texto: '' };
        articles[n] = current;
        lines.push(`\nArtículo ${n}`);
      } else current = null;
    } else if ((cls === 'parrafo' || cls === 'parrafo_2') && current) {
      current.texto += `${current.texto ? '\n' : ''}${t}`;
      lines.push(t);
    }
  }
  return { articles, lines };
}
