/**
 * Web push, browser half (Nov 2026). JSX-free so `node --test` loads it.
 * The server half is App\Services\WebPushService; pushes carry no payload.
 */

/** 'unsupported' | 'install-first' | 'blocked' | 'available' */
export function pushSupport(env = globalThis) {
    const nav = env.navigator;
    if (!nav || !('serviceWorker' in nav) || !env.PushManager || !env.Notification) {
        // iPhone Safari has no PushManager until the site is on the Home
        // Screen; say so rather than "not supported".
        if (isIosSafari(nav?.userAgent) && !isStandalone(env)) return 'install-first';
        return 'unsupported';
    }
    if (env.Notification.permission === 'denied') return 'blocked';
    return 'available';
}

function isIosSafari(ua = '') {
    return /iP(hone|ad|od)/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

function isStandalone(env) {
    return Boolean(env.matchMedia?.('(display-mode: standalone)').matches || env.navigator?.standalone);
}

/** The VAPID key as the Uint8Array PushManager.subscribe() wants. */
export function keyToBytes(base64url) {
    const pad = '='.repeat((4 - (base64url.length % 4)) % 4);
    const b64 = (base64url + pad).replace(/-/g, '+').replace(/_/g, '/');
    const raw = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
}

/** What the server stores: the endpoint and the two keys, nothing else. */
export function subscriptionPayload(sub) {
    const json = typeof sub?.toJSON === 'function' ? sub.toJSON() : sub;
    return { endpoint: json?.endpoint, keys: { p256dh: json?.keys?.p256dh ?? null, auth: json?.keys?.auth ?? null } };
}

export async function currentSubscription() {
    const reg = await navigator.serviceWorker.getRegistration();
    return reg ? reg.pushManager.getSubscription() : null;
}

export async function turnOn(publicKey, post) {
    if ((await Notification.requestPermission()) !== 'granted') return false;
    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(publicKey) });
    await post(subscriptionPayload(sub));
    return true;
}

export async function turnOff(remove) {
    const sub = await currentSubscription();
    if (!sub) return;
    await remove({ endpoint: sub.endpoint });
    await sub.unsubscribe();
}
