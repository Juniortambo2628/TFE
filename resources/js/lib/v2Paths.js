/**
 * The /v2 twins of the public pages (UX review, Nov 2026).
 *
 * A visitor who opens /v2/about should stay in v2 when they click on to the
 * partners or a listing, or the comparison the testers are making falls
 * apart halfway through. Every public page that has a twin is listed here
 * once; `toV2()` maps a link onto it and leaves everything else (the
 * dashboards, sign-in, external sites) alone.
 *
 * JSX-free so `node --test` loads it (tests/JS/v2Paths.test.mjs). The server
 * side of the same list is the `v2.` route group in routes/web.php.
 */

// A path is twinned when it is one of these, or starts with one plus "/".
const TWINNED = ['/about', '/features', '/services', '/news', '/contact', '/partners', '/tournaments', '/listings', '/learn', '/tribes'];

// Inside a twinned prefix, but no v2 page: these stay where they are.
const NOT_TWINNED = [/^\/tribes\/[^/]+\/join\/?$/, /^\/news\/[^/]+/];

/** True on a v2 page: /v2, /v2/…, or an audience walkthrough. */
export function isV2Path(path = '') {
    const p = String(path).split(/[?#]/)[0];
    return p === '/v2' || p.startsWith('/v2/') || /^\/for-(fans|partners|schools)\/?$/.test(p);
}

/** The path a v2 page would link to instead (or the path itself). */
export function v2PathFor(path) {
    if (path === '/' || path === '') return '/v2';
    if (isV2Path(path)) return path;
    if (NOT_TWINNED.some((re) => re.test(path))) return path;
    const twinned = TWINNED.some((t) => path === t || path.startsWith(`${t}/`));
    return twinned ? `/v2${path}` : path;
}

/**
 * Map an href onto its v2 twin. Relative and same-origin absolute links are
 * mapped (keeping query and hash); anything else — another site, mailto:,
 * a bare #anchor — comes back unchanged.
 */
export function toV2(href, origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost') {
    if (!href || typeof href !== 'string') return href;
    if (href.startsWith('#') || /^(mailto|tel|javascript):/i.test(href)) return href;

    let url;
    try {
        url = new URL(href, origin);
    } catch {
        return href;
    }
    if (url.origin !== origin) return href;

    const mapped = v2PathFor(url.pathname);
    if (mapped === url.pathname) return href;

    const rest = `${url.search}${url.hash}`;
    // Hand back the same shape we were given: absolute stays absolute.
    return /^[a-z][a-z0-9+.-]*:/i.test(href) ? `${url.origin}${mapped}${rest}` : `${mapped}${rest}`;
}
