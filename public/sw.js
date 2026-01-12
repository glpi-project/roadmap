const CACHE_NAME = "glpi-roadmap-v1768224103";

// Install event: skip waiting to activate immediately
self.addEventListener("install", (event) => {
    self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                }),
            );
        }),
    );
    self.clients.claim();
});

// Fetch event: Dynamic caching for all requests
self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests and external domains
    if (
        event.request.method !== "GET" ||
        !url.origin.includes(self.location.origin)
    ) {
        return;
    }

    // Strategy for Fonts and Images: Cache First
    if (url.pathname.includes("/fonts/") || url.pathname.includes("/pics/")) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;
                return fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return networkResponse;
                });
            }),
        );
        return;
    }

    // Strategy for Everything else (JS, CSS, HTML, Data): Stale-While-Revalidate
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Network error - silent fail
                });

            return cachedResponse || fetchPromise;
        }),
    );
});
