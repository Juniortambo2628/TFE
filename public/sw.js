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
const VERSION = 'v2';
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

/*
 * Web push (Nov 2026). Pushes arrive EMPTY (App\Services\WebPushService):
 * the worker asks TFE, over the person's own session, for their newest
 * unread notification and shows that. Signed out, or nothing unread, it
 * shows a generic line: browsers require a visible notification for every
 * push, and a silent one gets the subscription revoked.
 */
self.addEventListener('push', (event) => {
    event.waitUntil((async () => {
        let n = null;
        try {
            const res = await fetch('/push/latest', {
                credentials: 'same-origin',
                headers: { Accept: 'application/json' },
                cache: 'no-store',
            });
            if (res.ok) n = (await res.json()).notification;
        } catch (e) { /* offline: fall through to the generic line */ }

        const title = n?.title || 'The Football Experience';
        await self.registration.showNotification(title, {
            body: n?.body || 'You have a new update on your trip.',
            icon: '/icons/icon-192.png',
            badge: '/icons/favicon-32.png',
            tag: n?.id || 'tfe-update',
            data: { url: n?.url || '/' },
        });
        if (n?.unread && self.navigator?.setAppBadge) {
            self.navigator.setAppBadge(n.unread).catch(() => {});
        }
    })());
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const target = new URL(event.notification.data?.url || '/', self.location.origin);
    if (target.origin !== self.location.origin) return;
    event.waitUntil((async () => {
        const open = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        const tab = open.find((c) => new URL(c.url).origin === self.location.origin);
        if (tab) {
            await tab.focus();
            return tab.navigate(target.href);
        }
        return self.clients.openWindow(target.href);
    })());
});
