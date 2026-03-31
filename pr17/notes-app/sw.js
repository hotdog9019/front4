const STATIC_CACHE_NAME = 'app-shell-v1';
const DYNAMIC_CACHE_NAME = 'dynamic-content-v1';

const APP_SHELL_ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './content/home.html',
  './content/about.html',
  './icons/icon-72x72.png',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE_NAME && key !== DYNAMIC_CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || caches.match('./content/home.html');
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

// Для статики – Cache First, для контента – Network First
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const contentPath = new URL('./content/', self.registration.scope).pathname;
  if (url.pathname.startsWith(contentPath)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});

self.addEventListener('push', (event) => {
  let data = { title: 'Новое уведомление', body: '' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || '',
    icon: new URL('./icons/icon-192x192.png', self.registration.scope).toString(),
    badge: new URL('./icons/icon-72x72.png', self.registration.scope).toString(),
    data: { reminderId: data.reminderId || null },
  };

  if (data.reminderId) {
    options.actions = [{ action: 'snooze', title: 'Отложить на 5 минут' }];
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Уведомление', options),
  );
});

self.addEventListener('notificationclick', (event) => {
  const reminderId = event.notification?.data?.reminderId;
  const action = event.action;

  event.notification.close();

  if (action === 'snooze' && reminderId) {
    event.waitUntil(
      fetch(`/snooze?reminderId=${encodeURIComponent(reminderId)}`, { method: 'POST' }).catch(
        () => {},
      ),
    );
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      if (list.length > 0) {
        list[0].focus();
        return;
      }
      return clients.openWindow(new URL('./', self.registration.scope).toString());
    }),
  );
});
