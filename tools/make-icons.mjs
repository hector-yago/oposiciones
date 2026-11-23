// Genera el logo (SVG) y los iconos PNG de la PWA sin dependencias: una casa blanca con una moneda dentro
// sobre degradado violeta→turquesa. Uso: node tools/make-icons.mjs
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';

const outDir = new URL('../icons/', import.meta.url);
mkdirSync(outDir, { recursive: true });

const C1 = [0x6d, 0x28, 0xd9];
const C2 = [0x0e, 0x9f, 0x9a];
const WHITE = [255, 255, 255];

// Geometría en coordenadas unitarias (0..1).
const ROOF = [[0.5, 0.17], [0.85, 0.5], [0.15, 0.5]];
const BODY = { x0: 0.25, x1: 0.75, y0: 0.47, y1: 0.82 };
const COIN = { cx: 0.5, cy: 0.64, r: 0.15, ring: 0.03 };

function inPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const inHouse = (x, y) => inPoly(x, y, ROOF) || (x >= BODY.x0 && x <= BODY.x1 && y >= BODY.y0 && y <= BODY.y1);
function isWhite(x, y) {
  const d = Math.hypot(x - COIN.cx, y - COIN.cy);
  if (d <= COIN.r - COIN.ring) return true; // moneda (blanca) dentro del hueco
  if (d <= COIN.r) return false; // hueco entre casa y moneda
  return inHouse(x, y);
}

function inRoundRect(x, y, r) {
  if (r <= 0) return true;
  const cx = Math.min(Math.max(x, r), 1 - r);
  const cy = Math.min(Math.max(y, r), 1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}
const bg = (u, v) => {
  const t = (u + v) / 2;
  return C1.map((c, i) => c + (C2[i] - c) * t);
};

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

function png(size, { radius, scale }) {
  const ss = 3;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const u = (x + (sx + 0.5) / ss) / size;
          const v = (y + (sy + 0.5) / ss) / size;
          if (!inRoundRect(u, v, radius)) continue;
          const bu = (u - 0.5) / scale + 0.5;
          const bv = (v - 0.5) / scale + 0.5;
          const col = isWhite(bu, bv) ? WHITE : bg(u, v);
          r += col[0]; g += col[1]; b += col[2]; a += 255;
        }
      }
      const n = ss * ss;
      const o = y * (size * 4 + 1) + 1 + x * 4;
      const cov = a / 255;
      raw[o] = cov ? Math.round(r / cov) : 0;
      raw[o + 1] = cov ? Math.round(g / cov) : 0;
      raw[o + 2] = cov ? Math.round(b / cov) : 0;
      raw[o + 3] = Math.round(a / n);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const files = {
  'icon-192.png': png(192, { radius: 0.2, scale: 1 }),
  'icon-512.png': png(512, { radius: 0.2, scale: 1 }),
  'icon-maskable-512.png': png(512, { radius: 0, scale: 0.72 }),
  'apple-touch-icon.png': png(180, { radius: 0, scale: 0.9 }),
};
for (const [name, buf] of Object.entries(files)) writeFileSync(new URL(name, outDir), buf);

const S = 512;
const f = (n) => (n * S).toFixed(1);
const pts = (poly) => poly.map(([x, y]) => `${f(x)},${f(y)}`).join(' ');
// SVG: casa (tejado + cuerpo) con hueco circular y moneda blanca encima (misma geometría que los PNG).
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6d28d9"/><stop offset="1" stop-color="#0e9f9a"/></linearGradient></defs>
<rect width="${S}" height="${S}" rx="${0.2 * S}" fill="url(#g)"/>
<polygon points="${pts(ROOF)}" fill="#fff"/>
<rect x="${f(BODY.x0)}" y="${f(BODY.y0)}" width="${f(BODY.x1 - BODY.x0)}" height="${f(BODY.y1 - BODY.y0)}" fill="#fff"/>
<circle cx="${f(COIN.cx)}" cy="${f(COIN.cy)}" r="${f(COIN.r)}" fill="url(#g)"/>
<circle cx="${f(COIN.cx)}" cy="${f(COIN.cy)}" r="${f(COIN.r - COIN.ring)}" fill="#fff"/>
</svg>
`;
writeFileSync(new URL('icon.svg', outDir), svg);
console.log('Iconos generados:', Object.keys(files).join(', '), 'icon.svg');
