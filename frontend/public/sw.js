const CACHE_NAME = 'learnstudio-pwa-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/images/logo.png',
  '/images/charlie-ai.png'
];

// Install Event: Pre-cache core static assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA Asset pre-cache warning:', err);
      });
    })
  );
});

// Activate Event: Clean up legacy caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network-first strategy for dynamic LMS API data and pages
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for API requests, extensions, or cross-origin calls
  if (url.pathname.startsWith('/api') || request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Cache successful GET responses for static assets and fonts
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|woff|woff2|css|js)$/)) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache when offline
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If offline and request is for a navigation page load, return home fallback if available
          if (request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Network offline and asset not cached', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});
