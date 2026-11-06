/*
 * TFE service worker (installable website, Nov 2026 — docs/proposals/mobile-app.md, phase 0).
 *
 * Deliberately small, and deliberately does NOT cache pages:
 *  - Page navigations always go to the network. Pages carry a person's own
 *    plans, bookings and savings (the savings pages are no-store), and a
 *    cached copy would show stale prices or someone else's session after a
 *    sign-out. Offline, a navigation gets the offline page instead of the
 *    browser's error.
 *  - Built assets (/build/assets/*) are content-hashed, so they are cached
 *    first and kept: a new deploy has new file names.
 *  - Images (/assets, /stadiums, /icons, /tournament-*) are served from the
 *    cache while being refreshed, with a cap on how many are kept.
 *  - Everything else — POSTs, Inertia's JSON visits, /api, other sites —
 *    is left alone.
 *
 * Bump VERSION when this file's caching rules change; old caches are
 * deleted on activate.
 */
const VERSION = 'v1';
const SHELL = `tfe-shell-${VERSION}`;
const ASSETS = `tfe-assets-${VERSION}`;
const IMAGES = `tfe-images-${VERSION}`;
const OFFLINE_URL = '/offline.html';
const IMAGE_LIMIT = 120;

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(SHELL)
            .then((cache) => cache.addAll([OFFLINE_URL, '/icons/icon-192.png', '/manifest.webmanifest']))
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys
                .filter((k) => k.startsWith('tfe-') && ![SHELL, ASSETS, IMAGES].includes(k))
                .map((k) => caches.delete(k))))
            .then(() => self.clients.claim()),
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;

    // A full page load: network, and the offline page if there is none.
    // Inertia's in-app visits are XHRs with X-Inertia and never land here
    // as navigations.
    if (req.mode === 'navigate') {
        event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
        return;
    }

    if (url.pathname.startsWith('/build/assets/')) {
        event.respondWith(cacheFirst(req, ASSETS));
        return;
    }

    if (/^\/(assets|stadiums|icons|tournament-trophies|tournament-organizers-card-visuals)\//.test(url.pathname)
        && /\.(png|jpe?g|webp|avif|gif|svg|woff2?)$/i.test(url.pathname)) {
        event.respondWith(staleWhileRevalidate(req, IMAGES, event));
    }
});

async function cacheFirst(req, name) {
    const cache = await caches.open(name);
    const hit = await cache.match(req);
    if (hit) return hit;
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
}

async function staleWhileRevalidate(req, name, event) {
    const cache = await caches.open(name);
    // Any of our caches: the offline page's own icon is stored with the
    // shell on install, and must still show with no network.
    const hit = (await cache.match(req)) || (await caches.match(req));
    const refresh = fetch(req).then(async (res) => {
        if (res.ok) {
            await cache.put(req, res.clone());
            await trim(cache, IMAGE_LIMIT);
        }
        return res;
    }).catch(() => hit);
    if (hit) {
        event.waitUntil(refresh);
        return hit;
    }
    return refresh;
}

async function trim(cache, limit) {
    const keys = await cache.keys();
    for (let i = 0; i < keys.length - limit; i += 1) await cache.delete(keys[i]);
}
