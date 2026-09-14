const CACHE_NAME = 'service-desk-cache-v1';
const STATIC_ASSETS = [
    './index.html',
    './rh_dashboard.html',
    './it_dashboard.html',
    './css/style.css',
    './css/rh_dashboard.css',
    './css/it_dashboard.css',
    './css/style_mobile.css',
    './js/ui.js',
    './js/login.js',
    './js/rh/rh_core.js',
    './js/rh/rh_directorio.js',
    './js/rh/rh_altas.js',
    './js/rh/rh_formatos.js',
    './js/rh/rh_multiple.js',
    './js/it/it_core.js',
    './js/it/it_altas.js',
    './js/notificaciones.js',
    './assets/safran_logo.png'
];

// Instalar Service Worker y cachear recursos estáticos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Cacheando archivos estáticos');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activar y limpiar cachés antiguos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[Service Worker] Limpiando caché antiguo', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Interceptar peticiones (Fetch)
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // No cachear peticiones a la API (siempre Network-Only)
    if (url.pathname.includes('/back/api/')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Estrategia Stale-While-Revalidate o Cache-First para el resto
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                // Devolver del caché, pero actualizar el caché en el fondo (Stale-While-Revalidate)
                fetch(event.request).then((networkResponse) => {
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse);
                    });
                }).catch(() => {});
                return cachedResponse;
            }
            return fetch(event.request);
        })
    );
});
