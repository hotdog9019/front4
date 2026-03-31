const CACHE_NAME = 'notes-cache-v2';
const ASSETS = [
    './',
    './index.html',
    './app.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async cache => {
            // Кэшируем локальные файлы
            await cache.addAll(ASSETS);

            // Кэшируем CDN отдельно (no-cors, т.к. сторонний ресурс)
            try {
                const cdnUrl = 'https://unpkg.com/chota@latest';
                const response = await fetch(cdnUrl, { mode: 'no-cors' });
                await cache.put(cdnUrl, response);
            } catch (e) {
                console.warn('CDN не закэшировался при установке:', e);
            }
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cached => {
            const networkFetch = fetch(event.request).then(response => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => cached);

            return cached || networkFetch;
        })
    );
});
