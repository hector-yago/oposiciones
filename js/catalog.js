// Catálogo de la tienda (datos puros). Los dibujos están en js/art/items.js, js/art/pets.js y js/art/clothes.js.
export const CATEGORIES = [
  { id: 'vivos', name: 'Seres vivos' },
  { id: 'herramientas', name: 'Herramientas' },
  { id: 'accesorios', name: 'Accesorios' },
  { id: 'ropa', name: 'Ropa' },
  { id: 'jardin', name: 'Jardín' },
  { id: 'estudio', name: 'Estudio' },
  { id: 'cocina', name: 'Cocina' },
  { id: 'terraza', name: 'Terraza' },
];

// Mascotas: etapas por XP acumulada (cría → joven → adulto), herramienta principal (+50 % de crecimiento)
// y extras (+25 % cada uno). Cuanto más cara la mascota, más tarda en crecer. `max` = ejemplares por especie;
// `size` = tamaño relativo en la escena; `room` = dónde viven (por defecto el salón; las del jardín necesitan el jardín).
export const SPECIES = {
  cactus: { tool: 'regadera', extras: ['abono'], stages: [0, 10, 30], max: 3, size: 1 },
  margarita: { tool: 'regadera', extras: ['abono'], stages: [0, 8, 25], max: 3, size: 1 },
  pez: { tool: 'pecera', extras: [], stages: [0, 15, 45], max: 3, size: 1 },
  pollito: { tool: 'nido', extras: ['comedero'], stages: [0, 12, 35], max: 4, size: 0.6, room: 'jardin' },
  raton: { tool: 'queso', extras: ['comedero'], stages: [0, 12, 35], max: 3, size: 0.6, room: 'estudio' },
  hamster: { tool: 'rueda', extras: ['comedero'], stages: [0, 18, 55], max: 2, size: 0.7 },
  canario: { tool: 'jaula', extras: [], stages: [0, 20, 60], max: 2, size: 1 },
  patito: { tool: 'estanque', extras: ['comedero'], stages: [0, 18, 50], max: 3, size: 0.75, room: 'jardin' },
  tortuga: { tool: 'terrario', extras: ['comedero'], stages: [0, 25, 75], max: 2, size: 0.8 },
  erizo: { tool: 'cuenco-agua', extras: ['comedero'], stages: [0, 25, 70], max: 2, size: 0.7, room: 'jardin' },
  gato: { tool: 'cuenco-agua', extras: ['rascador', 'cama', 'cepillo', 'comedero'], stages: [0, 30, 90], max: 2, size: 1 },
  bonsai: { tool: 'regadera', extras: ['abono'], stages: [0, 35, 100], max: 2, size: 1 },
  cerdito: { tool: 'corral', extras: ['comedero', 'cepillo'], stages: [0, 35, 100], max: 2, size: 0.95, room: 'jardin' },
  conejo: { tool: 'conejera', extras: ['cepillo', 'comedero'], stages: [0, 35, 100], max: 2, size: 0.9 },
  ovejita: { tool: 'corral', extras: ['comedero', 'cepillo'], stages: [0, 40, 115], max: 3, size: 0.95, room: 'jardin' },
  buho: { tool: 'posadero', extras: ['comedero'], stages: [0, 45, 130], max: 2, size: 0.95, room: 'estudio' },
  loro: { tool: 'percha', extras: ['comedero'], stages: [0, 45, 130], max: 2, size: 0.9 },
  zorro: { tool: 'madriguera', extras: ['comedero', 'cepillo'], stages: [0, 50, 140], max: 2, size: 0.9, room: 'jardin' },
  perro: { tool: 'cuenco-agua', extras: ['cama', 'juguete', 'cepillo', 'comedero'], stages: [0, 40, 120], max: 2, size: 1 },
  panda: { tool: 'bambu', extras: ['comedero'], stages: [0, 60, 170], max: 2, size: 1, room: 'jardin' },
  abeja: { tool: 'tarro', extras: ['comedero'], stages: [0, 6, 18], max: 4, size: 0.55, room: 'cocina' },
  pinguino: { tool: 'cubo-hielo', extras: ['comedero'], stages: [0, 55, 150], max: 2, size: 0.95, room: 'cocina' },
  paloma: { tool: 'comedero-aves', extras: [], stages: [0, 14, 40], max: 3, size: 0.7, room: 'terraza' },
  camaleon: { tool: 'rama', extras: ['comedero'], stages: [0, 40, 115], max: 2, size: 0.9, room: 'terraza' },
};
/** Plantas: no ensucian; cuando se «enfadan» se marchitan. */
export const PLANTS = ['cactus', 'margarita', 'bonsai'];
export const STAGE_NAMES = ['Cría', 'Joven', 'Adulto'];
/** Habitaciones: el salón (siempre) y el jardín (se compra). */
export const ROOMS = [
  { id: 'casa', name: 'Salón' },
  { id: 'jardin', name: 'Jardín', req: 'jardin' },
  { id: 'estudio', name: 'Estudio', req: 'estudio' },
  { id: 'cocina', name: 'Cocina', req: 'cocina' },
  { id: 'terraza', name: 'Terraza', req: 'terraza' },
];

const J = 'jardin'; // los objetos del jardín necesitan haberlo comprado
const E = 'estudio'; // y los del estudio, el estudio
const C = 'cocina';
const R = 'terraza';

export const CATALOG = [
  // --- Seres vivos (de más barato a más caro) ---
  { id: 'cactus', cat: 'vivos', name: 'Cactus', price: 1, desc: 'Resistente y poco exigente. Crece más deprisa con una regadera.' },
  { id: 'margarita', cat: 'vivos', name: 'Margarita', price: 2, desc: 'Florece con tus aciertos y pierde pétalos si fallas. Le encanta la regadera.' },
  { id: 'abeja', cat: 'vivos', name: 'Abeja', price: 4, desc: 'Zumba sin parar. Vive en la cocina y necesita su tarro de miel.', req: C },
  { id: 'pez', cat: 'vivos', name: 'Pez', price: 5, desc: 'Nada tranquilo. Crece más deprisa con una pecera.' },
  { id: 'pollito', cat: 'vivos', name: 'Pollito', price: 6, desc: 'Pío, pío. Vive en el jardín y necesita su nido.', req: J },
  { id: 'paloma', cat: 'vivos', name: 'Paloma', price: 7, desc: 'Arrulla en la barandilla. Vive en la terraza y necesita su comedero.', req: R },
  { id: 'hamster', cat: 'vivos', name: 'Hámster', price: 8, desc: 'Pequeño y activo. Crece más deprisa con una rueda.' },
  { id: 'raton', cat: 'vivos', name: 'Ratón de biblioteca', price: 9, desc: 'Pequeño y leído. Vive en el estudio y adora el queso.', req: E },
  { id: 'canario', cat: 'vivos', name: 'Canario', price: 10, desc: 'Canta cuando estudias. Crece más deprisa con una jaula.' },
  { id: 'patito', cat: 'vivos', name: 'Patito', price: 12, desc: 'Cua, cua. Vive en el jardín y adora su estanque.', req: J },
  { id: 'tortuga', cat: 'vivos', name: 'Tortuga', price: 14, desc: 'Lenta pero constante, como tú. Le gusta su terrario.' },
  { id: 'erizo', cat: 'vivos', name: 'Erizo', price: 16, desc: 'Tímido y pinchudo. Vive en el jardín.', req: J },
  { id: 'gato', cat: 'vivos', name: 'Gato', price: 20, desc: 'Independiente y mimoso. Le gustan el cuenco, el rascador, la cama y el cepillo.' },
  { id: 'bonsai', cat: 'vivos', name: 'Bonsái', price: 25, desc: 'Paciencia y calma. Crece muy despacio; ayudan la regadera y el abono.' },
  { id: 'cerdito', cat: 'vivos', name: 'Cerdito', price: 28, desc: 'Rosado y revolcón. Vive en el jardín y necesita un corral.', req: J },
  { id: 'conejo', cat: 'vivos', name: 'Conejo', price: 30, desc: 'Suave y juguetón. Necesita su conejera.' },
  { id: 'ovejita', cat: 'vivos', name: 'Ovejita', price: 35, desc: 'Lanuda y tranquila. Vive en el jardín y necesita un corral.', req: J },
  { id: 'buho', cat: 'vivos', name: 'Búho', price: 38, desc: 'El sabio del estudio. Necesita su posadero.', req: E },
  { id: 'loro', cat: 'vivos', name: 'Loro', price: 40, desc: 'Charlatán y colorido. Necesita su percha.' },
  { id: 'camaleon', cat: 'vivos', name: 'Camaleón', price: 42, desc: 'Cambia de color con tu humor. Vive en la terraza y necesita una rama.', req: R },
  { id: 'zorro', cat: 'vivos', name: 'Zorro', price: 45, desc: 'Listo y astuto. Vive en el jardín y necesita su madriguera.', req: J },
  { id: 'perro', cat: 'vivos', name: 'Perro', price: 50, desc: 'El mejor compañero de estudio. Le gustan el cuenco, la cama, la pelota y el cepillo.' },
  { id: 'pinguino', cat: 'vivos', name: 'Pingüino', price: 55, desc: 'Elegante y friolero. Vive en la cocina (junto a la nevera) y necesita su cubo de hielo.', req: C },
  { id: 'panda', cat: 'vivos', name: 'Panda', price: 60, desc: 'El tesoro del jardín. Necesita bambú y mucha paciencia.', req: J },

  // --- Herramientas ---
  { id: 'regadera', cat: 'herramientas', name: 'Regadera', price: 3, desc: 'Para cuidar tus plantas.' },
  { id: 'cuenco-agua', cat: 'herramientas', name: 'Cuenco de agua', price: 4, desc: 'Para gatos, perros y erizos.' },
  { id: 'abono', cat: 'herramientas', name: 'Abono', price: 4, desc: 'Extra para cactus, margaritas y bonsáis.' },
  { id: 'comedero', cat: 'herramientas', name: 'Comedero', price: 5, desc: 'Extra para casi todos los animales.' },
  { id: 'juguete', cat: 'herramientas', name: 'Pelota', price: 6, desc: 'Para jugar con tu perro.' },
  { id: 'cepillo', cat: 'herramientas', name: 'Cepillo', price: 6, desc: 'Extra para gatos, perros, conejos y animales de granja.' },
  { id: 'tarro', cat: 'herramientas', name: 'Tarro de miel', price: 6, desc: 'La despensa de tus abejas.', req: C },
  { id: 'nido', cat: 'herramientas', name: 'Nido', price: 6, desc: 'Casa de tus pollitos.', req: J },
  { id: 'comedero-aves', cat: 'herramientas', name: 'Comedero de aves', price: 7, desc: 'Migas para tus palomas.', req: R },
  { id: 'rueda', cat: 'herramientas', name: 'Rueda', price: 7, desc: 'Para que tu hámster corra.' },
  { id: 'pecera', cat: 'herramientas', name: 'Pecera', price: 8, desc: 'Casa para tus peces.' },
  { id: 'terrario', cat: 'herramientas', name: 'Terrario', price: 9, desc: 'Casa para tus tortugas.' },
  { id: 'jaula', cat: 'herramientas', name: 'Jaula', price: 10, desc: 'Casa para tus canarios.' },
  { id: 'cama', cat: 'herramientas', name: 'Cama', price: 12, desc: 'Para gatos y perros.' },
  { id: 'estanque', cat: 'herramientas', name: 'Estanque', price: 14, desc: 'Un chapuzón para tus patitos.', req: J },
  { id: 'rascador', cat: 'herramientas', name: 'Rascador', price: 15, desc: 'Para tu gato.' },
  { id: 'rama', cat: 'herramientas', name: 'Rama', price: 16, desc: 'Un buen sitio para que tu camaleón se camufle.', req: R },
  { id: 'conejera', cat: 'herramientas', name: 'Conejera', price: 16, desc: 'Casa para tus conejos.' },
  { id: 'percha', cat: 'herramientas', name: 'Percha', price: 18, desc: 'Un buen sitio para tu loro.' },
  { id: 'cubo-hielo', cat: 'herramientas', name: 'Cubo de hielo', price: 20, desc: 'Para que tu pingüino esté fresquito.', req: C },
  { id: 'corral', cat: 'herramientas', name: 'Corral', price: 20, desc: 'Para cerditos y ovejitas.', req: J },
  { id: 'madriguera', cat: 'herramientas', name: 'Madriguera', price: 24, desc: 'El refugio de tu zorro.', req: J },
  { id: 'queso', cat: 'herramientas', name: 'Queso', price: 5, desc: 'El manjar favorito de tu ratón.', req: E },
  { id: 'posadero', cat: 'herramientas', name: 'Posadero', price: 22, desc: 'Un buen sitio para que tu búho vigile.', req: E },
  { id: 'bambu', cat: 'herramientas', name: 'Bambú', price: 28, desc: 'La comida favorita de tu panda.', req: J },

  // --- Accesorios del salón ---
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

  // --- Ropa (se equipa en el Armario; `slot` = dónde se lleva) ---
  { id: 'pajarita', cat: 'ropa', slot: 'neck', name: 'Pajarita', price: 5, desc: 'Elegancia para opositar.' },
  { id: 'gafas', cat: 'ropa', slot: 'face', name: 'Gafas', price: 6, desc: 'Aspecto de estudioso.' },
  { id: 'camiseta-roja', cat: 'ropa', slot: 'top', name: 'Camiseta roja', price: 6, desc: 'Un color con carácter.' },
  { id: 'camiseta-amarilla', cat: 'ropa', slot: 'top', name: 'Camiseta amarilla', price: 6, desc: 'Rojigualda, ¡a medias!' },
  { id: 'bufanda', cat: 'ropa', slot: 'neck', name: 'Bufanda', price: 7, desc: 'Para los días fríos de estudio.' },
  { id: 'gorra', cat: 'ropa', slot: 'hat', name: 'Gorra', price: 8, desc: 'Informal y práctica.' },
  { id: 'gafas-sol', cat: 'ropa', slot: 'face', name: 'Gafas de sol', price: 9, desc: 'Para mirar al futuro sin pestañear.' },
  { id: 'birrete', cat: 'ropa', slot: 'hat', name: 'Birrete', price: 20, desc: 'Solo para quien lo merece.' },
  { id: 'traje', cat: 'ropa', slot: 'top', name: 'Traje', price: 25, desc: 'Para el día del examen.' },
  { id: 'corona', cat: 'ropa', slot: 'hat', name: 'Corona', price: 40, desc: 'Reina o rey de las oposiciones.' },

  // --- Estudio (nueva habitación) ---
  { id: 'estudio', cat: 'estudio', name: 'Estudio', price: 50, desc: 'Desbloquea un despacho para opositar con sus muebles y animales de biblioteca.' },
  { id: 'libros', cat: 'estudio', name: 'Pila de libros', price: 8, desc: 'Temarios por todas partes.', req: E },
  { id: 'silla', cat: 'estudio', name: 'Silla', price: 10, desc: 'Para aguantar horas de estudio.', req: E },
  { id: 'lampara-mesa', cat: 'estudio', name: 'Flexo', price: 12, desc: 'Luz para estudiar de noche. Se enciende y apaga tocándolo.', req: E },
  { id: 'diploma', cat: 'estudio', name: 'Diploma', price: 15, desc: 'Un adelanto de lo que vendrá.', req: E },
  { id: 'globo-terraqueo', cat: 'estudio', name: 'Globo terráqueo', price: 18, desc: 'Para soñar con otros mundos.', req: E },
  { id: 'escritorio', cat: 'estudio', name: 'Escritorio', price: 20, desc: 'El centro de operaciones.', req: E },
  { id: 'estanteria-grande', cat: 'estudio', name: 'Librería grande', price: 24, desc: 'Cinco baldas de conocimiento.', req: E },
  { id: 'ordenador', cat: 'estudio', name: 'Ordenador', price: 28, desc: 'Para buscar la ley y hacer esquemas.', req: E },

  // --- Cocina (nueva habitación) ---
  { id: 'cocina', cat: 'cocina', name: 'Cocina', price: 45, desc: 'Desbloquea la cocina: muebles, electrodomésticos y animales de despensa.' },
  { id: 'fruta', cat: 'cocina', name: 'Frutero', price: 6, desc: 'Fruta fresca para los días de estudio.', req: C },
  { id: 'taburete', cat: 'cocina', name: 'Taburete', price: 8, desc: 'Para sentarse junto a la mesa.', req: C },
  { id: 'cafetera', cat: 'cocina', name: 'Cafetera', price: 9, desc: 'Combustible de opositor.', req: C },
  { id: 'lampara-cocina', cat: 'cocina', name: 'Lámpara de cocina', price: 12, desc: 'Ilumina la cocina de noche. Se enciende y apaga tocándola.', req: C },
  { id: 'mesa', cat: 'cocina', name: 'Mesa', price: 14, desc: 'Para comer y para repasar.', req: C },
  { id: 'nevera', cat: 'cocina', name: 'Nevera', price: 22, desc: 'Llena de cosas ricas.', req: C },
  { id: 'fogon', cat: 'cocina', name: 'Cocina de gas', price: 26, desc: 'Con su olla al fuego.', req: C },

  // --- Terraza (nueva habitación) ---
  { id: 'terraza', cat: 'terraza', name: 'Terraza', price: 70, desc: 'Desbloquea una terraza con vistas a la ciudad.' },
  { id: 'macetero', cat: 'terraza', name: 'Macetero', price: 8, desc: 'Flores en la barandilla.', req: R },
  { id: 'mesita-terraza', cat: 'terraza', name: 'Mesita', price: 10, desc: 'Un café al aire libre.', req: R },
  { id: 'farol-terraza', cat: 'terraza', name: 'Farol', price: 12, desc: 'Luz cálida para las noches de verano. Se enciende y apaga tocándolo.', req: R },
  { id: 'toldo', cat: 'terraza', name: 'Toldo', price: 18, desc: 'Sombra a rayas.', req: R },
  { id: 'barbacoa', cat: 'terraza', name: 'Barbacoa', price: 20, desc: 'Para celebrar el aprobado.', req: R },
  { id: 'hamaca', cat: 'terraza', name: 'Hamaca', price: 24, desc: 'Descanso entre temas.', req: R },
  { id: 'telescopio', cat: 'terraza', name: 'Telescopio', price: 30, desc: 'Para mirar las estrellas.', req: R },

  // --- Jardín (nueva habitación) ---
  { id: 'jardin', cat: 'jardin', name: 'Jardín', price: 40, desc: 'Desbloquea una nueva habitación al aire libre con sitio para animales de granja y más.' },
  { id: 'farola', cat: 'jardin', name: 'Farola', price: 12, desc: 'Ilumina el jardín de noche. Se enciende y apaga tocándola.', req: J },
  { id: 'banco', cat: 'jardin', name: 'Banco', price: 15, desc: 'Para sentarse a repasar al aire libre.', req: J },
  { id: 'huerto', cat: 'jardin', name: 'Huerto', price: 18, desc: 'Lechugas y zanahorias.', req: J },
  { id: 'columpio', cat: 'jardin', name: 'Columpio', price: 25, desc: 'Para despejar la mente.', req: J },
  { id: 'fuente', cat: 'jardin', name: 'Fuente', price: 30, desc: 'El agua siempre relaja.', req: J },
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
export const LAMPS = ['lampara', 'lampara-pie', 'farola', 'lampara-mesa', 'lampara-cocina', 'farol-terraza'];
/** Objetos de cada habitación (los que no figuran aquí son del salón). */
export const GARDEN_ITEMS = ['farola', 'banco', 'huerto', 'columpio', 'fuente', 'nido', 'estanque', 'corral', 'madriguera', 'bambu'];
export const STUDY_ITEMS = ['lampara-mesa', 'libros', 'silla', 'diploma', 'globo-terraqueo', 'escritorio', 'estanteria-grande', 'ordenador', 'queso', 'posadero'];
export const KITCHEN_ITEMS = ['fruta', 'taburete', 'cafetera', 'lampara-cocina', 'mesa', 'nevera', 'fogon', 'tarro', 'cubo-hielo'];
export const TERRACE_ITEMS = ['macetero', 'mesita-terraza', 'farol-terraza', 'toldo', 'barbacoa', 'hamaca', 'telescopio', 'comedero-aves', 'rama'];
export const CLOTHES = CATALOG.filter((i) => i.cat === 'ropa');

// Objetos sin prototipo: un id como «constructor» o «__proto__» (p. ej. en un fichero importado) no cuenta como artículo.
export const BY_ID = Object.assign(Object.create(null), Object.fromEntries([...CATALOG, ...EXCLUSIVES].map((i) => [i.id, i])));
Object.setPrototypeOf(SPECIES, null);
export const isPet = (itemId) => Object.hasOwn(SPECIES, itemId);
export const isPlant = (itemId) => PLANTS.includes(itemId);
/** Habitación donde se ve un objeto o mascota: 'casa' o 'jardin'. */
export const roomOf = (itemId) => (isPet(itemId) ? SPECIES[itemId].room ?? 'casa' : GARDEN_ITEMS.includes(itemId) ? 'jardin' : STUDY_ITEMS.includes(itemId) ? 'estudio' : KITCHEN_ITEMS.includes(itemId) ? 'cocina' : TERRACE_ITEMS.includes(itemId) ? 'terraza' : 'casa');
