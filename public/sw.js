// Remove the legacy Create React App service worker and its cached bundles.
// ChatHDI now runs on Next.js, so caching /static/js/bundle.js can serve an
// obsolete application shell and hide the current server-rendered app.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) =>
        Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
      ),
      self.registration.unregister(),
    ]).then(() =>
      self.clients.matchAll({ type: 'window' }).then((clients) =>
        Promise.all(clients.map((client) => client.navigate(client.url)))
      )
    )
  );
});
