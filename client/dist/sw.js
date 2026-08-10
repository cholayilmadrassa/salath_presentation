const CACHE_NAME = 'salath-app-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/appLogo.png'
];

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

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

  // Always Network-First to ensure users always receive fresh application updates
  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
          return new Response('', { status: 408, statusText: 'Offline / Network Request Failed' });
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
    (async () => {
      // Verify notification permission on the active origin
      if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
        console.warn('[SW PUSH BLOCKED]: Notification permission is not granted on origin (' + Notification.permission + ')');
        return;
      }
      try {
        await self.registration.showNotification(title, options);
        console.log('[SW NOTIFICATION SHOWN]:', title);
      } catch (err) {
        console.error('[SW SHOW NOTIFICATION ERROR]:', err.message || err);
      }
    })()
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
