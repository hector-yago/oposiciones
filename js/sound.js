// Efectos de sonido sencillos con Web Audio (sin ficheros). Se pueden desactivar en Ajustes.
// Sin AudioContext (tests, navegadores antiguos) no hacen nada.
const TONES = {
  right: [[660, 0.08], [880, 0.12]],
  wrong: [[260, 0.12], [196, 0.2]],
  coin: [[988, 0.07], [1319, 0.16]],
  grow: [[523, 0.08], [659, 0.08], [784, 0.08], [1047, 0.2]],
  buy: [[784, 0.07], [1047, 0.12]],
  box: [[392, 0.08], [523, 0.08], [659, 0.08], [784, 0.08], [1047, 0.25]],
  ach: [[659, 0.09], [784, 0.09], [988, 0.09], [1319, 0.22]],
  pass: [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.3]],
  fail: [[330, 0.15], [262, 0.15], [196, 0.3]],
};
export const SOUND_NAMES = Object.keys(TONES);

let enabled = true;
let audio = null;

export const setEnabled = (v) => {
  enabled = Boolean(v);
};
export const isEnabled = () => enabled;

function context() {
  const Ctor = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (!Ctor) return null;
  try {
    audio ??= new Ctor();
    if (audio.state === 'suspended') audio.resume?.();
    return audio;
  } catch {
    return null;
  }
}

/** Reproduce un efecto por su nombre. Devuelve true si se ha lanzado. */
export function play(name) {
  const seq = TONES[name];
  if (!enabled || !seq) return false;
  const c = context();
  if (!c) return false;
  let t = c.currentTime;
  for (const [freq, dur] of seq) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = name === 'wrong' || name === 'fail' ? 'triangle' : 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.09, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    t += dur * 0.9;
  }
  return true;
}
