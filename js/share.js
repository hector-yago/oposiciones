// Compartir la casa como imagen y mover los datos entre dispositivos con un «código» de texto. Lógica pura (sin DOM).
export const SHARE_VARS = ['wall', 'floor', 'floor-line', 'frame', 'base', 'grass', 'grass-dark', 'hill', 'hill2'];

/**
 * Convierte el SVG de la escena en un SVG autónomo (sin variables CSS ni hojas de estilo externas),
 * para poder dibujarlo en un canvas y compartirlo como imagen.
 * @param {string} svg
 * @param {Record<string,string>} vars valores resueltos de --wall, --floor…
 */
export function inlineSceneStyles(svg, vars) {
  const get = (name) => vars[name] || '#888';
  let out = svg.replace(/var\(--([\w-]+)\)/g, (_, name) => get(name));
  const css = `.wall{fill:${get('wall')}}.floor{fill:${get('floor')}}.baseboard{fill:${get('base')}}.grass{fill:${get('grass')}}`;
  out = out.replace(/<svg\b([^>]*)>/, (m) => `${m}<style>${css}</style>`);
  return out;
}

const CODE_PREFIX = 'OPO1:';

/** Texto JSON → código copiable (base64 de UTF-8 con prefijo). */
export function encodeCode(jsonText) {
  const bytes = new TextEncoder().encode(jsonText);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return CODE_PREFIX + btoa(bin);
}

/** Código → texto JSON. Lanza un error legible si no es un código válido. */
export function decodeCode(code) {
  const text = String(code ?? '').trim().replace(/\s+/g, '');
  if (!text.startsWith(CODE_PREFIX)) throw new Error('Ese texto no es un código de Oposiciones (debe empezar por OPO1:).');
  try {
    const bin = atob(text.slice(CODE_PREFIX.length));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('El código está incompleto o dañado. Cópialo de nuevo entero.');
  }
}

/** Filtros de color de las variantes raras (los mismos que usa la hoja de estilos). */
export const VARIANT_FILTERS = {
  azul: 'hue-rotate(170deg) saturate(1.1)',
  dorado: 'sepia(0.75) saturate(2.4) hue-rotate(-8deg) brightness(1.08)',
  arcoiris: 'hue-rotate(290deg) saturate(1.9)',
};
