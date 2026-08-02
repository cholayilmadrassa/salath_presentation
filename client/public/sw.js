const CACHE_NAME = 'salath-app-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/appLogo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bypass API, WebSockets, Vite dev modules, node_modules, HMR, chrome extensions, non-http
  if (
    !url.protocol.startsWith('http') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.includes('hot-update') ||
    url.protocol === 'chrome-extension:' ||
    event.request.headers.get('Upgrade') === 'websocket'
  ) {
    return;
  }

  // Network-first for HTML page navigation, Cache-first for static assets
  const isHtml = event.request.headers.get('accept')?.includes('text/html');

  if (isHtml) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch((err) => {
          // Graceful fallback for cancelled or failed static asset fetches
          return new Response('', { status: 408, statusText: 'Request Timed Out / Cancelled' });
        });
    })
  );
});

/* ──────── WEB PUSH NOTIFICATION HANDLERS ──────── */

self.addEventListener('push', (event) => {
  console.log('[SW PUSH EVENT RECEIVED]: Triggered by push server');
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
      console.log('[SW PUSH DATA PARSED]:', data);
    } catch (e) {
      data = { title: 'സ്വലാത്ത് ഓർമ്മപ്പെടുത്തൽ', body: event.data.text() };
    }
  } else {
    data = { title: 'സ്വലാത്ത് ഓർമ്മപ്പെടുത്തൽ', body: 'പുതിയ വിവരങ്ങൾ ലഭ്യമാണ്' };
  }

  const title = data.title || 'സ്വലാത്ത് ആപ്പ്';
  const options = {
    body: data.body || 'ക്ലിക്ക് ചെയ്ത് കൂടുതൽ അറിയാം',
    icon: data.icon || '/appLogo.png',
    badge: '/appLogo.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/dashboard',
      timestamp: Date.now(),
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log('[SW NOTIFICATION SHOWN]:', title))
      .catch((err) => console.error('[SW SHOW NOTIFICATION ERROR]:', err))
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url && 'focus' in client) {
          client.focus();
          if ('navigate' in client) {
            return client.navigate(targetUrl);
          }
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
