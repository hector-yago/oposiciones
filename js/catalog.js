// Catálogo de la tienda (datos). En F1 solo se muestra; la compra llega en F2.
// Los iconos son emojis provisionales; F2 los sustituye por SVG propios.
export const CATEGORIES = [
  { id: 'vivos', name: 'Seres vivos' },
  { id: 'herramientas', name: 'Herramientas' },
  { id: 'accesorios', name: 'Accesorios' },
];

export const CATALOG = [
  { id: 'cactus', cat: 'vivos', name: 'Cactus', price: 1, icon: '🌵', desc: 'Resistente y poco exigente.' },
  { id: 'pez', cat: 'vivos', name: 'Pez', price: 5, icon: '🐟', desc: 'Necesita una pecera.' },
  { id: 'canario', cat: 'vivos', name: 'Canario', price: 10, icon: '🐤', desc: 'Canta cuando estudias. Necesita jaula.' },
  { id: 'gato', cat: 'vivos', name: 'Gato', price: 20, icon: '🐱', desc: 'Independiente y mimoso.' },
  { id: 'perro', cat: 'vivos', name: 'Perro', price: 50, icon: '🐶', desc: 'El mejor compañero de estudio.' },

  { id: 'regadera', cat: 'herramientas', name: 'Regadera', price: 3, icon: '🚿', desc: 'Para cuidar tus plantas.' },
  { id: 'cuenco-agua', cat: 'herramientas', name: 'Cuenco de agua', price: 4, icon: '🥣', desc: 'Para gatos y perros.' },
  { id: 'juguete', cat: 'herramientas', name: 'Pelota', price: 6, icon: '🎾', desc: 'Para jugar con tu mascota.' },
  { id: 'pecera', cat: 'herramientas', name: 'Pecera', price: 8, icon: '🫧', desc: 'Casa para tus peces.' },
  { id: 'jaula', cat: 'herramientas', name: 'Jaula', price: 10, icon: '🪺', desc: 'Casa para tus pájaros.' },
  { id: 'cama', cat: 'herramientas', name: 'Cama', price: 12, icon: '🛏️', desc: 'Para dormir a gusto.' },
  { id: 'rascador', cat: 'herramientas', name: 'Rascador', price: 15, icon: '🪵', desc: 'Para gatos con ganas de marcha.' },

  { id: 'cuadro', cat: 'accesorios', name: 'Cuadro', price: 5, icon: '🖼️', desc: 'Da vida a la pared.' },
  { id: 'planta', cat: 'accesorios', name: 'Maceta', price: 6, icon: '🪴', desc: 'Un toque de verde.' },
  { id: 'reloj', cat: 'accesorios', name: 'Reloj de pared', price: 7, icon: '🕰️', desc: 'Para controlar el tiempo de estudio.' },
  { id: 'alfombra', cat: 'accesorios', name: 'Alfombra', price: 8, icon: '🟪', desc: 'Más calidez para el suelo.' },
  { id: 'cortinas', cat: 'accesorios', name: 'Cortinas', price: 9, icon: '🪟', desc: 'Para la ventana.' },
  { id: 'lampara', cat: 'accesorios', name: 'Lámpara', price: 10, icon: '💡', desc: 'Para estudiar de noche.' },
  { id: 'estanteria', cat: 'accesorios', name: 'Estantería', price: 12, icon: '📚', desc: 'Llena de libros.' },
  { id: 'sofa', cat: 'accesorios', name: 'Sofá', price: 25, icon: '🛋️', desc: 'Para descansar entre test y test.' },
  { id: 'tele', cat: 'accesorios', name: 'Televisión', price: 30, icon: '📺', desc: 'Un descanso bien merecido.' },
  { id: 'trofeo', cat: 'accesorios', name: 'Trofeo de estudio', price: 40, icon: '🏆', desc: 'Para los más constantes.' },
];
