/**
 * flagAccent — derive a team's ring colour from its own flag (Sprint 54).
 *
 * Why derive rather than curate: a hand-written national-colour table would
 * cover ~90 nations across our three tournaments, every entry written from
 * memory, and a wrong colour on a fan's national ring is the same class of
 * embarrassment as a `finance_partner` badged "TRAVEL PARTNER". The flags are
 * committed, same-origin PNGs (`public/assets/Flags/{iso}.png`), so the real
 * colour is already on disk — we read it instead of guessing, and it cannot
 * drift from the artwork.
 *
 * `pickAccentFromPixels` is the whole decision and is pure, so it is unit
 * tested without a DOM (tests/JS/flagAccent.test.mjs). The browser half is a
 * thin canvas wrapper around it with a module + sessionStorage cache, so each
 * flag is sampled at most once per session.
 */

const CACHE_PREFIX = 'tfe-flag-accent:';

/** In-memory cache, and the in-flight promise so concurrent callers share one decode. */
const memo = new Map();
const inflight = new Map();

/**
 * Reduce raw RGBA pixels to one accent colour.
 *
 * Buckets colours coarsely (so JPEG-ish noise and anti-aliased edges collapse
 * together), then scores each bucket by how much of the flag it covers AND how
 * vivid it is. Pure area would hand back the white field on flags like Japan's
 * or Nigeria's; pure vividness would pick a one-pixel crest detail. The
 * product picks the colour a person would name.
 *
 * @param {Uint8ClampedArray|number[]} data RGBA quadruples.
 * @param {{minAlpha?: number}} [opts]
 * @returns {string|null} `#rrggbb`, or null when there is nothing usable.
 */
export function pickAccentFromPixels(data, opts = {}) {
    const minAlpha = opts.minAlpha ?? 128;
    if (!data || data.length < 4) return null;

    const buckets = new Map();

    for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a < minAlpha) continue;

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const chroma = max - min;

        // Near-white, near-black and near-grey are real flag colours but they
        // make a poor ring on a dark glass surface, and almost every flag has
        // a chromatic colour to offer instead. They are still counted — with a
        // heavy penalty — so an all-greyscale flag is not left with nothing.
        const greyish = chroma < 30 ? 0.04 : 1;

        // Quantise to 32-level channels: enough to keep red apart from orange,
        // coarse enough that shading in the same stripe lands in one bucket.
        const key = ((r >> 5) << 10) | ((g >> 5) << 5) | (b >> 5);
        const entry = buckets.get(key);
        if (entry) {
            entry.count += 1;
            entry.r += r;
            entry.g += g;
            entry.b += b;
        } else {
            buckets.set(key, { count: 1, r, g, b, chroma, greyish });
        }
    }

    if (buckets.size === 0) return null;

    let best = null;
    let bestScore = -1;
    let total = 0;
    for (const e of buckets.values()) total += e.count;

    for (const e of buckets.values()) {
        const share = e.count / total;
        // Vividness normalised 0..1, floored so a mid-grey is not exactly zero.
        const vividness = Math.max(e.chroma / 255, 0.01);
        const score = share * vividness * e.greyish;
        if (score > bestScore) {
            bestScore = score;
            best = e;
        }
    }

    if (!best) return null;

    return toHex(
        Math.round(best.r / best.count),
        Math.round(best.g / best.count),
        Math.round(best.b / best.count),
    );
}

/** Clamp a channel and render `#rrggbb`. */
export function toHex(r, g, b) {
    const c = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return `#${c(r)}${c(g)}${c(b)}`;
}

/**
 * Lift a derived colour until it reads on the dark dashboard canvas.
 * A very dark navy ring is invisible against `#0a0a0a`; this keeps the hue and
 * raises the lightness only as far as it has to.
 */
export function ensureReadable(hex, minLuminance = 0.32) {
    if (!hex) return hex;
    const m = /^#?([0-9a-f]{6})$/i.exec(hex);
    if (!m) return hex;

    let r = parseInt(m[1].slice(0, 2), 16);
    let g = parseInt(m[1].slice(2, 4), 16);
    let b = parseInt(m[1].slice(4, 6), 16);

    // Rec. 601 luma — close enough to perceived brightness for a 3px ring.
    const lumaOf = (rr, gg, bb) => (0.299 * rr + 0.587 * gg + 0.114 * bb) / 255;

    let luma = lumaOf(r, g, b);
    if (luma >= minLuminance) return toHex(r, g, b);

    if (luma > 0) {
        // Scale all three channels: keeps the hue exactly.
        const lift = minLuminance / luma;
        r = Math.min(255, r * lift);
        g = Math.min(255, g * lift);
        b = Math.min(255, b * lift);
        luma = lumaOf(r, g, b);
    }

    // Scaling alone can fall short once a channel clamps at 255 — a deep navy
    // hits the ceiling on blue while red and green are still near zero. Make
    // up the remainder by mixing toward white, which always reaches the floor
    // and only desaturates by however much was actually missing.
    if (luma < minLuminance) {
        const t = (minLuminance - luma) / (1 - luma);
        r += (255 - r) * t;
        g += (255 - g) * t;
        b += (255 - b) * t;
    }

    return toHex(r, g, b);
}

/** Read a cached accent without touching the network. */
function readCache(url) {
    if (memo.has(url)) return memo.get(url);
    try {
        const stored = sessionStorage.getItem(CACHE_PREFIX + url);
        if (stored) {
            memo.set(url, stored);
            return stored;
        }
    } catch {
        // sessionStorage blocked (private mode) — the in-memory cache still works.
    }
    return undefined;
}

function writeCache(url, value) {
    memo.set(url, value);
    try {
        if (value) sessionStorage.setItem(CACHE_PREFIX + url, value);
    } catch {
        // ignore
    }
}

/** Synchronous peek — what the component can paint on first render. */
export function cachedFlagAccent(url) {
    return url ? (readCache(url) ?? null) : null;
}

/**
 * Sample a flag image and resolve its accent colour.
 *
 * Resolves null (never rejects) when the image is missing, the canvas is
 * unavailable, or the browser refuses the pixel read — the caller falls back
 * to a neutral ring, which is a fine outcome, not an error worth surfacing.
 */
export function flagAccent(url) {
    if (!url) return Promise.resolve(null);

    const cached = readCache(url);
    if (cached !== undefined) return Promise.resolve(cached);
    if (inflight.has(url)) return inflight.get(url);

    const job = new Promise((resolve) => {
        if (typeof document === 'undefined' || typeof Image === 'undefined') {
            resolve(null);
            return;
        }

        const img = new Image();
        // Same-origin in practice, but a flag served from a CDN would taint
        // the canvas without this and throw on getImageData.
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            try {
                // 24px is plenty: we want stripe proportions, not detail, and
                // the downscale averages away compression noise for free.
                const size = 24;
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) { resolve(null); return; }

                ctx.drawImage(img, 0, 0, size, size);
                const { data } = ctx.getImageData(0, 0, size, size);
                const picked = pickAccentFromPixels(data);
                const accent = picked ? ensureReadable(picked) : null;
                writeCache(url, accent);
                resolve(accent);
            } catch {
                writeCache(url, null);
                resolve(null);
            } finally {
                inflight.delete(url);
            }
        };

        img.onerror = () => {
            writeCache(url, null);
            inflight.delete(url);
            resolve(null);
        };

        img.src = url;
    });

    inflight.set(url, job);
    return job;
}
