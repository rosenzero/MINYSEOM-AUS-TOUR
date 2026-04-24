/* Aus Tour service worker — offline support for static Next export */
const VERSION = 'v1';
const APP_CACHE = `aus-tour-app-${VERSION}`;
const ASSET_CACHE = `aus-tour-assets-${VERSION}`;

// App shell — pages that must be available offline.
// Note: trailingSlash: true in next.config, so these match the exported HTML.
const APP_SHELL = [
  '/',
  '/packing/',
  '/offline.html',
  '/manifest.webmanifest',
  '/icon-192.svg',
  '/icon-512.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_CACHE);
      // ignore individual failures so a single 404 doesn't abort install
      await Promise.all(
        APP_SHELL.map((url) =>
          cache.add(url).catch(() => undefined)
        )
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== APP_CACHE && k !== ASSET_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isNavigationRequest(req) {
  return req.mode === 'navigate' ||
    (req.method === 'GET' && req.headers.get('accept')?.includes('text/html'));
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/') ||
    /\.(?:js|css|woff2?|ttf|otf|png|jpg|jpeg|gif|webp|svg|ico|json|webmanifest)$/i.test(url.pathname)
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (isNavigationRequest(req)) {
    event.respondWith(handleNavigation(req));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(req, ASSET_CACHE));
    return;
  }
});

async function handleNavigation(req) {
  const cache = await caches.open(APP_CACHE);
  try {
    const fresh = await fetch(req);
    if (fresh && fresh.ok) cache.put(req, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(req);
    if (cached) return cached;
    // try stripped variants (e.g. root) before falling back
    const rootFallback = await cache.match('/');
    if (rootFallback) return rootFallback;
    const offline = await cache.match('/offline.html');
    if (offline) return offline;
    return new Response('offline', { status: 503, statusText: 'offline' });
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const fetchPromise = fetch(req)
    .then((res) => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}
