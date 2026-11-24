// Aplica el tema elegido antes de pintar (evita parpadeos). Es un script aparte para poder usar una CSP sin scripts «inline».
try {
  var t = localStorage.getItem('op-theme');
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
} catch (e) {
  /* sin localStorage */
}
