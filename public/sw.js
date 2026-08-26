// Kleider Care Service Worker for Instant Loading & Offline Resilience
const CACHE_NAME = 'kc-static-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/kc-logo.png',
  '/kc logo transparent.svg',
  '/10kg stack.jpeg',
  '/10kglggiantwasher.png',
  '/giantelectricdryer.png',
  '/giantgasdryer.png',
  '/titanwasher.png',
  '/titanelectricdryer.png',
  '/titangasdryer.png',
  '/softmount_speedqueen.png',
  '/seko-3p.png',
  '/seko-4p.png',
  '/emi_banner.png'
];

// Install Event: Pre-cache critical core shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching partial failure:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Cleanup older caches
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

// Fetch Event: Cache-First for static assets & Stale-While-Revalidate for navigation/data
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests and external third-party API mutations
  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/auth') || url.pathname.startsWith('/api/payment') || url.pathname.startsWith('/api/orders')) {
    return; // Pass through live transactional auth/payment/orders
  }

  // Static Assets (JS, CSS, PNG, JPEG, SVG, WEBP, WOFF2) -> Cache-First with background fetch
  const isStaticAsset =
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff2|ico)$/i) ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('lh3.googleusercontent.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached asset immediately and update in background
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          }).catch(() => {/* Ignore offline fetch errors */});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return networkResponse;
        }).catch(() => {
          // Fallback for failed images
          if (request.destination === 'image') {
            return caches.match('/kc-logo.png');
          }
        });
      })
    );
    return;
  }

  // HTML Navigation Requests -> Network-First with Cache fallback for offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
  }
});
