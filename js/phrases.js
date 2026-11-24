// Frases de cada especie cuando el personaje interactúa con ella. Debe haber una por especie (lo comprueba un test).
import { SPECIES } from './catalog.js';

export const SOUNDS = {
  cactus: (n) => `Le echo un vistazo a ${n}… ¡con cuidado, que pincha!`,
  pez: (n) => `${n} nada feliz de un lado a otro.`,
  canario: (n) => `${n} canta una melodía solo para ti.`,
  gato: (n) => `${n} ronronea mientras lo acaricias.`,
  perro: (n) => `¡${n} mueve la cola como loco!`,
  margarita: (n) => `${n} se mece con la brisa y presume de pétalos.`,
  hamster: (n) => `${n} corre y corre sin parar.`,
  tortuga: (n) => `${n} asoma la cabeza muy despacito.`,
  bonsai: (n) => `Le das un toque de tijera a ${n}: ¡qué elegante!`,
  conejo: (n) => `${n} mueve la nariz y da un salto de alegría.`,
  loro: (n) => `${n} repite una frase que acaba de oír… ¡«artículo catorce»!`,
  pollito: (n) => `${n} hace «pío, pío» y te sigue a todas partes.`,
  patito: (n) => `${n} hace «cua, cua» y chapotea contento.`,
  erizo: (n) => `${n} se hace una bolita… y luego se asoma curioso.`,
  cerdito: (n) => `${n} gruñe feliz y se revuelca en el barro.`,
  ovejita: (n) => `${n} bala suavemente: ¡beee!`,
  zorro: (n) => `${n} te mira con ojos astutos y mueve la cola.`,
  panda: (n) => `${n} mordisquea bambú con cara de felicidad.`,
  raton: (n) => `${n} se asoma entre los libros y mordisquea un trocito de queso.`,
  buho: (n) => `${n} gira la cabeza y te mira muy serio: «uuuh».`,
  abeja: (n) => `${n} zumba alrededor del tarro de miel.`,
  pinguino: (n) => `${n} da pasitos graciosos y aletea contento.`,
  paloma: (n) => `${n} arrulla: «cu-curucú».`,
  camaleon: (n) => `${n} cambia de color de la emoción.`,
};

/** Frase para una especie; si algún día falta, una genérica (nunca lanza). */
export const soundLine = (species, name) => (SOUNDS[species] ?? ((n) => `${n} te mira contento.`))(name);

export const speciesWithoutPhrase = () => Object.keys(SPECIES).filter((sp) => !SOUNDS[sp]);
