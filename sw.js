/* MamaMove Service Worker — v1.0 */

const CACHE_NAME = 'mamamove-v1';
const ASSETS = [
  './pregnancy-walk-reminder.html',
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

/* ── Fetch: cache-first with network fallback ────────────── */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

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
      }).catch(() => {
        /* Offline fallback for navigation requests */
        if (event.request.mode === 'navigate') {
          return caches.match('./pregnancy-walk-reminder.html');
        }
      });
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
      { action: 'walk',  title: "Let's walk" },
      { action: 'snooze', title: 'Snooze 5 min' }
    ],
    data: { url: './pregnancy-walk-reminder.html' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

/* ── Notification click handler ──────────────────────────── */
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const action = event.action;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      const existingClient = clientList.find(c => c.url.includes('pregnancy-walk-reminder'));

      if (existingClient) {
        existingClient.focus();
        existingClient.postMessage({ action: action || 'open' });
      } else {
        clients.openWindow('./pregnancy-walk-reminder.html');
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
