// Catálogo de la tienda (datos puros). Los dibujos están en js/art/items.js y js/art/pets.js.
export const CATEGORIES = [
  { id: 'vivos', name: 'Seres vivos' },
  { id: 'herramientas', name: 'Herramientas' },
  { id: 'accesorios', name: 'Accesorios' },
];

// Mascotas: etapas por XP acumulada (cría → joven → adulto), herramienta principal (+50 % de crecimiento)
// y extras (+25 % cada uno). Cuanto más cara la mascota, más tarda en crecer. `max` = ejemplares por especie;
// `size` = tamaño relativo en la escena (los animales pequeños se dibujan más pequeños).
export const SPECIES = {
  cactus: { tool: 'regadera', extras: ['abono'], stages: [0, 10, 30], max: 3, size: 1 },
  margarita: { tool: 'regadera', extras: ['abono'], stages: [0, 8, 25], max: 3, size: 1 },
  pez: { tool: 'pecera', extras: [], stages: [0, 15, 45], max: 3, size: 1 },
  hamster: { tool: 'rueda', extras: ['comedero'], stages: [0, 18, 55], max: 2, size: 0.7 },
  canario: { tool: 'jaula', extras: [], stages: [0, 20, 60], max: 2, size: 1 },
  tortuga: { tool: 'terrario', extras: ['comedero'], stages: [0, 25, 75], max: 2, size: 0.8 },
  gato: { tool: 'cuenco-agua', extras: ['rascador', 'cama', 'cepillo', 'comedero'], stages: [0, 30, 90], max: 2, size: 1 },
  bonsai: { tool: 'regadera', extras: ['abono'], stages: [0, 35, 100], max: 2, size: 1 },
  conejo: { tool: 'conejera', extras: ['cepillo', 'comedero'], stages: [0, 35, 100], max: 2, size: 0.9 },
  loro: { tool: 'percha', extras: ['comedero'], stages: [0, 45, 130], max: 2, size: 0.9 },
  perro: { tool: 'cuenco-agua', extras: ['cama', 'juguete', 'cepillo', 'comedero'], stages: [0, 40, 120], max: 2, size: 1 },
};
/** Plantas: no ensucian; cuando se «enfadan» se marchitan. */
export const PLANTS = ['cactus', 'margarita', 'bonsai'];
export const STAGE_NAMES = ['Cría', 'Joven', 'Adulto'];

export const CATALOG = [
  // --- Seres vivos (de más barato a más caro) ---
  { id: 'cactus', cat: 'vivos', name: 'Cactus', price: 1, desc: 'Resistente y poco exigente. Crece más deprisa con una regadera.' },
  { id: 'margarita', cat: 'vivos', name: 'Margarita', price: 2, desc: 'Florece con tus aciertos y pierde pétalos si fallas. Le encanta la regadera.' },
  { id: 'pez', cat: 'vivos', name: 'Pez', price: 5, desc: 'Nada tranquilo. Crece más deprisa con una pecera.' },
  { id: 'hamster', cat: 'vivos', name: 'Hámster', price: 8, desc: 'Pequeño y activo. Crece más deprisa con una rueda.' },
  { id: 'canario', cat: 'vivos', name: 'Canario', price: 10, desc: 'Canta cuando estudias. Crece más deprisa con una jaula.' },
  { id: 'tortuga', cat: 'vivos', name: 'Tortuga', price: 14, desc: 'Lenta pero constante, como tú. Le gusta su terrario.' },
  { id: 'gato', cat: 'vivos', name: 'Gato', price: 20, desc: 'Independiente y mimoso. Le gustan el cuenco, el rascador, la cama y el cepillo.' },
  { id: 'bonsai', cat: 'vivos', name: 'Bonsái', price: 25, desc: 'Paciencia y calma. Crece muy despacio; ayudan la regadera y el abono.' },
  { id: 'conejo', cat: 'vivos', name: 'Conejo', price: 30, desc: 'Suave y juguetón. Necesita su conejera.' },
  { id: 'loro', cat: 'vivos', name: 'Loro', price: 40, desc: 'Charlatán y colorido. Necesita su percha.' },
  { id: 'perro', cat: 'vivos', name: 'Perro', price: 50, desc: 'El mejor compañero de estudio. Le gustan el cuenco, la cama, la pelota y el cepillo.' },

  // --- Herramientas ---
  { id: 'regadera', cat: 'herramientas', name: 'Regadera', price: 3, desc: 'Para cuidar tus plantas.' },
  { id: 'cuenco-agua', cat: 'herramientas', name: 'Cuenco de agua', price: 4, desc: 'Para gatos y perros.' },
  { id: 'abono', cat: 'herramientas', name: 'Abono', price: 4, desc: 'Extra para cactus, margaritas y bonsáis.' },
  { id: 'comedero', cat: 'herramientas', name: 'Comedero', price: 5, desc: 'Extra para casi todos los animales.' },
  { id: 'juguete', cat: 'herramientas', name: 'Pelota', price: 6, desc: 'Para jugar con tu perro.' },
  { id: 'cepillo', cat: 'herramientas', name: 'Cepillo', price: 6, desc: 'Extra para gatos, perros y conejos.' },
  { id: 'rueda', cat: 'herramientas', name: 'Rueda', price: 7, desc: 'Para que tu hámster corra.' },
  { id: 'pecera', cat: 'herramientas', name: 'Pecera', price: 8, desc: 'Casa para tus peces.' },
  { id: 'terrario', cat: 'herramientas', name: 'Terrario', price: 9, desc: 'Casa para tus tortugas.' },
  { id: 'jaula', cat: 'herramientas', name: 'Jaula', price: 10, desc: 'Casa para tus canarios.' },
  { id: 'cama', cat: 'herramientas', name: 'Cama', price: 12, desc: 'Para gatos y perros.' },
  { id: 'rascador', cat: 'herramientas', name: 'Rascador', price: 15, desc: 'Para tu gato.' },
  { id: 'conejera', cat: 'herramientas', name: 'Conejera', price: 16, desc: 'Casa para tus conejos.' },
  { id: 'percha', cat: 'herramientas', name: 'Percha', price: 18, desc: 'Un buen sitio para tu loro.' },

  // --- Accesorios ---
  { id: 'cuadro', cat: 'accesorios', name: 'Cuadro', price: 5, desc: 'Da vida a la pared.' },
  { id: 'planta', cat: 'accesorios', name: 'Maceta', price: 6, desc: 'Un toque de verde.' },
  { id: 'reloj', cat: 'accesorios', name: 'Reloj de pared', price: 7, desc: 'Para controlar el tiempo de estudio.' },
  { id: 'cojines', cat: 'accesorios', name: 'Cojines', price: 7, desc: 'Colores para el sofá.' },
  { id: 'alfombra', cat: 'accesorios', name: 'Alfombra', price: 8, desc: 'Más calidez para el suelo.' },
  { id: 'cortinas', cat: 'accesorios', name: 'Cortinas', price: 9, desc: 'Para la ventana.' },
  { id: 'lampara', cat: 'accesorios', name: 'Lámpara colgante', price: 10, desc: 'Ilumina la casa de noche. Toca la lámpara para encenderla o apagarla.' },
  { id: 'espejo', cat: 'accesorios', name: 'Espejo', price: 11, desc: 'Un espejo ovalado sobre la ventana.' },
  { id: 'estanteria', cat: 'accesorios', name: 'Estantería', price: 12, desc: 'Llena de libros.' },
  { id: 'lampara-pie', cat: 'accesorios', name: 'Lámpara de pie', price: 14, desc: 'Luz cálida para estudiar de noche. Toca para encenderla o apagarla.' },
  { id: 'monstera', cat: 'accesorios', name: 'Monstera', price: 16, desc: 'Una planta grande y frondosa.' },
  { id: 'radio', cat: 'accesorios', name: 'Radio', price: 18, desc: 'Música de fondo mientras estudias.' },
  { id: 'pizarra', cat: 'accesorios', name: 'Pizarra', price: 20, desc: 'Para repasar los artículos importantes.' },
  { id: 'sofa', cat: 'accesorios', name: 'Sofá', price: 25, desc: 'Para descansar entre test y test.' },
  { id: 'tele', cat: 'accesorios', name: 'Televisión', price: 30, desc: 'Un descanso bien merecido.' },
  { id: 'disco', cat: 'accesorios', name: 'Bola de discoteca', price: 35, desc: 'Para celebrar cada logro.' },
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

/** Objetos que dan luz de noche (se encienden y apagan tocándolos). */
export const LAMPS = ['lampara', 'lampara-pie'];

export const BY_ID = Object.fromEntries([...CATALOG, ...EXCLUSIVES].map((i) => [i.id, i]));
export const isPet = (itemId) => itemId in SPECIES;
export const isPlant = (itemId) => PLANTS.includes(itemId);
