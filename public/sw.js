/* Daily Tracker — service worker: offline cache + web push */
const CACHE = 'daily-tracker-v9-vite';
const ASSETS = [
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];
const CDN_HOSTS = ['cdn.jsdelivr.net'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Stale-while-revalidate: serve from cache instantly, refresh cache in the
// background so updated hashed Vite assets remain available offline.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const cacheable = url.origin === location.origin || CDN_HOSTS.includes(url.hostname);
  if (!cacheable) return;
  // Always check the network for navigations so an installed iPhone PWA does
  // not remain pinned to an old Vite index and hashed asset references.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(async (res) => {
        if (res.ok) (await caches.open(CACHE)).put('./', res.clone());
        return res;
      }).catch(async () => (await caches.open(CACHE)).match('./'))
    );
    return;
  }
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(e.request);
      const network = fetch(e.request).then((res) => {
        if (res && res.ok) cache.put(e.request, res.clone());
        return res;
      }).catch(() => null);
      return cached || network.then((res) => res || cache.match('./index.html'));
    })
  );
});

// ---- Web Push ----
self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (_) { data = { title: 'Daily Tracker', body: e.data && e.data.text() }; }
  const title = data.title || 'Daily Tracker';
  const options = {
    body: data.body || '',
    icon: './icons/icon-192.png',
    badge: './icons/badge-96.png',
    tag: data.tag || 'daily-tracker',
    data: { url: data.url || './' }
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      return clients.openWindow(e.notification.data?.url || './');
    })
  );
});
