import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Sprint 48 — CSRF token, resolved per request rather than pinned once.
//
// This used to read <meta name="csrf-token"> at module load and pin it as the
// default X-CSRF-TOKEN header. That header is the FIRST thing Laravel's
// VerifyCsrfToken checks, so once it went stale nothing else got a look in —
// and it goes stale on the first session regeneration, which is exactly what
// logging in does. Since Inertia never reloads the document, the meta tag kept
// the pre-login token for the rest of the visit and every axios POST after
// sign-in answered 419 (the cookie-consent write was the visible one).
//
// Laravel reissues a fresh XSRF-TOKEN cookie on every response, so reading it
// at request time is always current. The meta tag stays as a fallback for the
// first request of a brand-new session, before any cookie exists.
const readCookie = (name) => {
    const match = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]*)'));

    return match ? decodeURIComponent(match[2]) : null;
};

const csrfMeta = document.querySelector('meta[name="csrf-token"]')?.content ?? null;

window.axios.interceptors.request.use((config) => {
    const xsrf = readCookie('XSRF-TOKEN');

    if (xsrf) {
        // Laravel decrypts this one, so it survives session regeneration.
        config.headers['X-XSRF-TOKEN'] = xsrf;
        delete config.headers['X-CSRF-TOKEN'];
    } else if (csrfMeta) {
        config.headers['X-CSRF-TOKEN'] = csrfMeta;
    }

    return config;
});

let sessionExpiredNotified = false;
window.axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error?.response?.status;
        if (status === 419 && !sessionExpiredNotified) {
            sessionExpiredNotified = true;
            try {
                const { toast } = await import('sonner');
                toast.error('Your session expired — please refresh the page to continue.', {
                    duration: 8000,
                });
            } catch { /* toast is optional here */ }
        }
        return Promise.reject(error);
    },
);

/*
 * Sprint 35 — Laravel Echo, broadcaster-agnostic.
 *
 * We ship the same client for two backends:
 *
 *   - Self-hosted Reverb (VITE_REVERB_APP_KEY set) — Pusher-protocol,
 *     free, needs a long-lived PHP process. Ideal on a VPS you control.
 *   - Hosted Pusher (VITE_PUSHER_APP_KEY set) — cPanel-safe, free tier
 *     covers 100 concurrent + 200k msgs/day. Requires PUSHER_APP_CLUSTER.
 *
 * Whichever key is present on the build gets wired. If neither is set
 * (dev, tests, hosts that can't run WebSockets) the whole block short-
 * circuits and window.Echo stays undefined — DashboardHeader guards on
 * that so live-bell just becomes "fills on page navigation", nothing
 * throws.
 */
const reverbKey = import.meta.env.VITE_REVERB_APP_KEY;
const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY;

if (pusherKey) {
    const [{ default: Echo }, { default: Pusher }] = await Promise.all([
        import('laravel-echo'),
        import('pusher-js'),
    ]);
    window.Pusher = Pusher;
    window.Echo = new Echo({
        broadcaster: 'pusher',
        key: pusherKey,
        cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER ?? 'eu',
        forceTLS: (import.meta.env.VITE_PUSHER_SCHEME ?? 'https') === 'https',
        // Optional overrides when running Pusher-compat servers on a
        // custom host (soketi, etc.). Absent = talk to Pusher's cloud.
        wsHost: import.meta.env.VITE_PUSHER_HOST || undefined,
        wsPort: import.meta.env.VITE_PUSHER_PORT || undefined,
        wssPort: import.meta.env.VITE_PUSHER_PORT || undefined,
        enabledTransports: ['ws', 'wss'],
    });
} else if (reverbKey) {
    const [{ default: Echo }, { default: Pusher }] = await Promise.all([
        import('laravel-echo'),
        import('pusher-js'),
    ]);
    window.Pusher = Pusher;
    window.Echo = new Echo({
        broadcaster: 'reverb',
        key: reverbKey,
        wsHost: import.meta.env.VITE_REVERB_HOST,
        wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
        wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
        enabledTransports: ['ws', 'wss'],
    });
}
