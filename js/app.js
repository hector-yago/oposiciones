// Punto de entrada (andamiaje F0). La interfaz real llega en F1.
import { VERSION } from './version.js';

document.getElementById('app').innerHTML = `<main class="fatal"><h1>Oposiciones</h1><p>Versión ${VERSION}</p></main>`;

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
