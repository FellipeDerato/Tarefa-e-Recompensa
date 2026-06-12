const CACHE_NAME = 'tarefa-recompensa-v1';
const ASSETS = [
  './index.html',
  './tarefas_recompensa.html',
  './app.js',
  './style.css',
  './manifest.json',
  './media/icon-192.svg',
  './media/icon-512.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(resp => {
      if (resp) return resp;
      return fetch(e.request).catch(() => caches.match('./index.html'));
    })
  );
});
