const CACHE_NAME = 'notes-cache-v3';
const ASSETS = [
    './',
    './index.html',
    './app.js',
    './manifest.json',
    './icons/icon-72x72.png',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async cache => {
            await cache.addAll(ASSETS);

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
