import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Sprint 44 — every AJAX POST rides on the CSRF-protected `web` middleware
// group. Belt-and-braces: pull the token off the meta blade injects on every
// page and pin it as the default X-CSRF-TOKEN so a request that fires before
// axios has read the XSRF cookie (or from a caller who bypassed the default
// interceptors) still validates. A 419 on a valid session usually means the
// bundle is holding a token from a prior login; a page refresh gets a new
// one, so the interceptor below surfaces a one-line explanation instead of
// silently failing.
const csrfMeta = document.querySelector('meta[name="csrf-token"]');
if (csrfMeta?.content) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfMeta.content;
}

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
