/* MamaMove Service Worker — v1.0 */

const CACHE_NAME = 'mamamove-v1.1';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap'
];

/* ── Install: pre-cache core assets ─────────────────────── */
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        ASSETS.map(url =>
          cache.add(url).catch(err => console.warn('Cache miss:', url, err))
        )
      );
    })
  );
});

/* ── Activate: clear old caches ─────────────────────────── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── Fetch logic ─────────────────────────────────────────── */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Network-first for HTML pages (like index.html) to ensure updates are seen
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        return caches.match(event.request).then(cached => {
          return cached || caches.match('./index.html');
        });
      })
    );
    return;
  }

  // Cache-first for all other assets (fonts, icons, etc)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => null);
    })
  );
});

/* ── Push Notifications ──────────────────────────────────── */
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'MamaMove';
  const options = {
    body: data.body || "Time for a gentle walk, mama!",
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'mamamove-reminder',
    renotify: true,
    actions: [
      { action: 'walk', title: "Let's walk" },
      { action: 'snooze', title: 'Snooze 5 min' }
    ],
    data: { url: './index.html' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

/* ── Notification click handler ──────────────────────────── */
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const action = event.action;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      const existingClient = clientList.find(c => c.url.includes('index'));

      if (existingClient) {
        existingClient.focus();
        existingClient.postMessage({ action: action || 'open' });
      } else {
        clients.openWindow('./index.html');
      }
    })
  );
});

/* ── Background Sync (for logging walk data) ─────────────── */
self.addEventListener('sync', event => {
  if (event.tag === 'sync-walks') {
    event.waitUntil(syncWalkData());
  }
});

async function syncWalkData() {
  /* Placeholder — extend to POST walk logs to your backend */
  console.log('[MamaMove SW] Background sync triggered');
}
