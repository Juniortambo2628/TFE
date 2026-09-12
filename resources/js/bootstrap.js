import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

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
