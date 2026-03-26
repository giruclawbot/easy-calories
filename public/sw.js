// Service Worker — Easy Calories
// Cache name includes build timestamp injected at deploy time via sw-version.js
// Falls back to date-based versioning if not available
const BUILD_VERSION = self.__BUILD_VERSION__ || new Date().toISOString().slice(0, 10);
const CACHE_NAME = `easy-calories-${BUILD_VERSION}`;

const PRECACHE_ASSETS = [
  '/manifest.json',
];

// Install: precache minimal assets, skip waiting immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_ASSETS))
  );
  // Take control immediately — don't wait for old SW to die
  self.skipWaiting();
});

// Activate: delete ALL old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => {
        console.log('[SW] Deleting old cache:', k);
        return caches.delete(k);
      }))
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - HTML pages → network-first (always fresh, fall back to cache if offline)
// - JS/CSS with hash → cache-first (immutable, safe to cache forever)
// - manifest.json, sw.js → network-first (always fresh)
// - Everything else → stale-while-revalidate
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip cross-origin requests (Firebase, USDA API, etc.)
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;

  // HTML pages — always network-first for freshness
  if (path === '/' || path.endsWith('.html') || !path.includes('.')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // JS/CSS with content hash (Next.js generates _next/static/... with hashes)
  // These are immutable — safe to cache aggressively
  if (path.includes('/_next/static/')) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // manifest.json and sw.js — always fresh
  if (path === '/manifest.json' || path === '/sw.js') {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Everything else — stale-while-revalidate
  event.respondWith(staleWhileRevalidate(event.request));
});

// Network-first: try network, fall back to cache
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline — please check your connection', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

// Cache-first: serve from cache, fetch if missing
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

// Stale-while-revalidate: serve cache immediately, update in background
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || await fetchPromise || new Response('Offline', { status: 503 });
}
