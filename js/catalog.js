// Catálogo de la tienda (datos puros). Los dibujos están en js/art/items.js y js/art/pets.js.
export const CATEGORIES = [
  { id: 'vivos', name: 'Seres vivos' },
  { id: 'herramientas', name: 'Herramientas' },
  { id: 'accesorios', name: 'Accesorios' },
];

// Mascotas: etapas por XP acumulada (cría → joven → adulto), herramienta principal (+50 % de crecimiento)
// y extras (+25 % cada uno). Cuanto más cara la mascota, más tarda en crecer. `max` = ejemplares por especie.
export const SPECIES = {
  cactus: { tool: 'regadera', extras: [], stages: [0, 10, 30], max: 3 },
  pez: { tool: 'pecera', extras: [], stages: [0, 15, 45], max: 3 },
  canario: { tool: 'jaula', extras: [], stages: [0, 20, 60], max: 2 },
  gato: { tool: 'cuenco-agua', extras: ['rascador', 'cama'], stages: [0, 30, 90], max: 2 },
  perro: { tool: 'cuenco-agua', extras: ['cama', 'juguete'], stages: [0, 40, 120], max: 2 },
};
export const STAGE_NAMES = ['Cría', 'Joven', 'Adulto'];

export const CATALOG = [
  { id: 'cactus', cat: 'vivos', name: 'Cactus', price: 1, desc: 'Resistente y poco exigente. Crece más deprisa con una regadera.' },
  { id: 'pez', cat: 'vivos', name: 'Pez', price: 5, desc: 'Nada tranquilo. Crece más deprisa con una pecera.' },
  { id: 'canario', cat: 'vivos', name: 'Canario', price: 10, desc: 'Canta cuando estudias. Crece más deprisa con una jaula.' },
  { id: 'gato', cat: 'vivos', name: 'Gato', price: 20, desc: 'Independiente y mimoso. Le gustan el cuenco, el rascador y la cama.' },
  { id: 'perro', cat: 'vivos', name: 'Perro', price: 50, desc: 'El mejor compañero de estudio. Le gustan el cuenco, la cama y la pelota.' },

  { id: 'regadera', cat: 'herramientas', name: 'Regadera', price: 3, desc: 'Para cuidar tus cactus.' },
  { id: 'cuenco-agua', cat: 'herramientas', name: 'Cuenco de agua', price: 4, desc: 'Para gatos y perros.' },
  { id: 'juguete', cat: 'herramientas', name: 'Pelota', price: 6, desc: 'Para jugar con tu perro.' },
  { id: 'pecera', cat: 'herramientas', name: 'Pecera', price: 8, desc: 'Casa para tus peces.' },
  { id: 'jaula', cat: 'herramientas', name: 'Jaula', price: 10, desc: 'Casa para tus canarios.' },
  { id: 'cama', cat: 'herramientas', name: 'Cama', price: 12, desc: 'Para gatos y perros.' },
  { id: 'rascador', cat: 'herramientas', name: 'Rascador', price: 15, desc: 'Para tu gato.' },

  { id: 'cuadro', cat: 'accesorios', name: 'Cuadro', price: 5, desc: 'Da vida a la pared.' },
  { id: 'planta', cat: 'accesorios', name: 'Maceta', price: 6, desc: 'Un toque de verde.' },
  { id: 'reloj', cat: 'accesorios', name: 'Reloj de pared', price: 7, desc: 'Para controlar el tiempo de estudio.' },
  { id: 'alfombra', cat: 'accesorios', name: 'Alfombra', price: 8, desc: 'Más calidez para el suelo.' },
  { id: 'cortinas', cat: 'accesorios', name: 'Cortinas', price: 9, desc: 'Para la ventana.' },
  { id: 'lampara', cat: 'accesorios', name: 'Lámpara', price: 10, desc: 'Para estudiar de noche.' },
  { id: 'estanteria', cat: 'accesorios', name: 'Estantería', price: 12, desc: 'Llena de libros.' },
  { id: 'sofa', cat: 'accesorios', name: 'Sofá', price: 25, desc: 'Para descansar entre test y test.' },
  { id: 'tele', cat: 'accesorios', name: 'Televisión', price: 30, desc: 'Un descanso bien merecido.' },
  { id: 'trofeo', cat: 'accesorios', name: 'Trofeo de estudio', price: 40, desc: 'Para los más constantes.' },
];

// Objetos exclusivos: no se venden; salen de la caja misteriosa semanal (ver js/daily.js).
export const EXCLUSIVES = [
  { id: 'guirnalda', cat: 'exclusivos', name: 'Guirnalda de luces', price: 0, desc: 'Luces de fiesta para el techo.' },
  { id: 'bandera', cat: 'exclusivos', name: 'Bandera de España', price: 0, desc: 'Un detalle patriótico para la pared.' },
  { id: 'mapa', cat: 'exclusivos', name: 'Mapa de España', price: 0, desc: 'Con sus provincias y comunidades.' },
  { id: 'globos', cat: 'exclusivos', name: 'Globos', price: 0, desc: 'Para celebrar tus logros.' },
  { id: 'libro-ce', cat: 'exclusivos', name: 'La Constitución', price: 0, desc: 'Tu ejemplar de estudio en la repisa.' },
];

export const BY_ID = Object.fromEntries([...CATALOG, ...EXCLUSIVES].map((i) => [i.id, i]));
export const isPet = (itemId) => itemId in SPECIES;
