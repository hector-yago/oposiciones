// Service worker: la app funciona sin conexión. Red primero (siempre la última versión si hay conexión) y caché de respaldo.
const VERSION = '0.5.0'; // sincronizado por tools/sync-version.mjs
const CACHE = `oposiciones-${VERSION}`;
const SHELL = [
  './',
  'index.html',
  'css/styles.css',
  'js/app.js',
  'js/version.js',
  'js/store.js',
  'js/migrations.js',
  'js/economy.js',
  'js/scheduler.js',
  'js/catalog.js',
  'js/theme-boot.js',
  'js/phrases.js',
  'js/art/study.js',
  'js/sound.js',
  'js/review.js',
  'js/notifications.js',
  'js/backup.js',
  'data/ce-articulos.json',
  'js/art/seasons.js',
  'js/art/clothes.js',
  'js/art/garden.js',
  'js/share.js',
  'js/breed.js',
  'js/seasons.js',
  'js/goal.js',
  'js/minigames.js',
  'js/exam.js',
  'js/missions.js',
  'js/study.js',
  'js/art/items.js',
  'js/art/pets.js',
  'js/achievements.js',
  'js/stats.js',
  'js/joker.js',
  'js/daily.js',
  'js/shop.js',
  'js/art/scene.js',
  'data/temas.json',
  'data/ce.json',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('oposiciones-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))),
  );
});
