const CACHE_NAME = 'healthguard-v9';

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './login.html',
    './account.html',
    './chatbot.html',
    './style.css',
    './app.js',
    './assets/js/login.js',
    './assets/js/account.js',
    './assets/js/i18n.js',
    './manifest.json'
];

// On install, cache all assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

// On activate: cleanup old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.map((key) => {
                if (key !== CACHE_NAME) return caches.delete(key);
            })
        ))
    );
});

// Fetch strategy
self.addEventListener("fetch", (event) => {
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});

