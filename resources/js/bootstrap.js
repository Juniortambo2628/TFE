import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

/*
 * Sprint 35 — Laravel Echo + Reverb.
 *
 * Wires a global `window.Echo` instance when a broadcast key is
 * configured on the build. If VITE_REVERB_APP_KEY is empty the whole
 * block short-circuits, which means dev/test builds without a running
 * Reverb server pay zero cost and never open a phantom WebSocket.
 *
 * Reverb speaks the Pusher protocol so pusher-js is the correct
 * client library. Point Echo at your own Reverb host (self-hosted,
 * free) or swap `broadcaster: 'reverb'` for `'pusher'` and supply
 * VITE_PUSHER_APP_KEY / VITE_PUSHER_APP_CLUSTER instead if you'd
 * rather use hosted Pusher.
 */
const reverbKey = import.meta.env.VITE_REVERB_APP_KEY;
if (reverbKey) {
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
