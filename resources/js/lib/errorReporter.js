/**
 * Report uncaught browser errors to /client-errors (Sprint 69).
 *
 * `shouldReport` is the pure half (tested in tests/JS/errorReporter.test.mjs);
 * `installErrorReporter` wires it to window. Kept quiet on purpose:
 *
 *  - extension and third-party noise is dropped (the "serpBadge.js …
 *    Receiving end does not exist" line testers paste is an extension);
 *  - the same error is sent once per page load, and at most MAX_PER_PAGE
 *    in total, so a render loop cannot flood the endpoint;
 *  - nothing is sent from the bank-savings pages (the server drops them too);
 *  - the reporter swallows its own failures — it must never be the reason
 *    a page breaks.
 */
export const MAX_PER_PAGE = 10;
export const ENDPOINT = '/client-errors';

const SKIP_PAGES = [/^\/fan\/bank-savings/, /^\/sandbox-bank/];

const NOISE = [
    /Receiving end does not exist/i,
    /ResizeObserver loop/i,
    /^Script error\.?$/i,           // cross-origin script, no detail to act on
    /Non-Error promise rejection captured/i,
];

const FOREIGN_SOURCE = /^(chrome|moz|safari)(-web)?-extension:|^webkit-masked-url:/i;

export function shouldReport({ message, source, page, origin }, seen = new Set()) {
    if (!message) return false;
    if (seen.size >= MAX_PER_PAGE) return false;
    if (NOISE.some((re) => re.test(message))) return false;
    if (source && FOREIGN_SOURCE.test(source)) return false;
    // A script from another origin (an ad, an embed) is not ours to fix.
    if (source && origin && /^https?:/i.test(source) && !source.startsWith(origin)) return false;
    if (page && SKIP_PAGES.some((re) => re.test(page))) return false;

    const key = `${message}|${source || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
}

export function installErrorReporter(win = typeof window !== 'undefined' ? window : null) {
    if (!win || win.__tfeErrorReporter) return;
    win.__tfeErrorReporter = true;

    const seen = new Set();

    const send = (report) => {
        try {
            const page = win.location.pathname;
            const ok = shouldReport({ ...report, page, origin: win.location.origin }, seen);
            if (!ok) return;
            const body = JSON.stringify({ ...report, page: win.location.href });
            const blob = new Blob([body], { type: 'application/json' });
            if (!(win.navigator.sendBeacon && win.navigator.sendBeacon(ENDPOINT, blob))) {
                win.fetch(ENDPOINT, { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
            }
        } catch {
            /* never let the reporter throw */
        }
    };

    win.addEventListener('error', (e) => {
        // Resource load failures (an <img> 404) bubble here without a message;
        // those are the asset-path class of bug, worth a line too.
        const target = e.target;
        if (target && target !== win && (target.src || target.href)) {
            send({ kind: 'error', message: `Failed to load ${target.tagName?.toLowerCase()}: ${target.src || target.href}`, source: target.src || target.href });
            return;
        }
        send({
            kind: 'error',
            message: String(e.message || ''),
            source: e.filename || null,
            line: e.lineno || null,
            column: e.colno || null,
            stack: e.error && e.error.stack ? String(e.error.stack) : null,
        });
    }, true);

    win.addEventListener('unhandledrejection', (e) => {
        const r = e.reason;
        send({
            kind: 'unhandledrejection',
            message: String((r && r.message) || r || 'Unhandled rejection'),
            stack: r && r.stack ? String(r.stack) : null,
        });
    });
}
