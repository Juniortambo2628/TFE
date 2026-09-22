/**
 * Client-side stadium image resolution.
 *
 * The catalogue itself (slugs, aliases, coordinates) lives server-side in
 * config/stadiums.php. This module deliberately holds NO copy of it — it only
 * knows how to normalize a venue name the same way StadiumImageService::normalize()
 * does, then index into the resolved `stadiumImages` map that
 * HandleInertiaRequests shares on every page.
 *
 * That asymmetry is the point: a JS-side alias table would be a second source
 * of truth to keep in sync, which is exactly the maintenance trap the
 * PARTNER_TYPE_LABEL duplication already created elsewhere in this codebase.
 */

/**
 * Mirror of StadiumImageService::normalize().
 *
 * Lowercase, strip diacritics and punctuation, collapse whitespace, then drop
 * the generic nouns that vary freely between data sources. If you change this,
 * change the PHP side in the same commit — tests/JS/stadiumImages.test.mjs
 * asserts a shared set of fixtures against both.
 */
export function normalizeVenueName(name) {
    if (!name || typeof name !== 'string') return '';

    let n = name.toLowerCase().trim();

    // Strip diacritics (é -> e) so "Stade Général" style names match.
    n = n.normalize('NFD').replace(/[̀-ͯ]/g, '');

    // Punctuation to spaces, then collapse.
    n = n.replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();

    // Generic nouns carry no identifying signal.
    n = n.replace(/\b(stadium|stadia|arena|ground|complex|the)\b/g, ' ');
    n = n.replace(/\s+/g, ' ').trim();

    return n;
}

/**
 * Mirror of StadiumImageService::matches().
 *
 * Exact match, or one name fully containing the other — but a containment
 * match only counts when the shared run is at least two words. That guard is
 * what stops "Zanzibar Fumba Stadium" resolving to Amaan Stadium on the
 * strength of the single token "zanzibar": both are Zanzibar grounds, and
 * showing the wrong stadium's photo is worse than showing none.
 */
export function venueNamesMatch(a, b) {
    if (!a || !b) return false;
    if (a === b) return true;
    if (!a.includes(b) && !b.includes(a)) return false;

    const shorter = a.length <= b.length ? a : b;

    return shorter.split(' ').length >= 2;
}

/**
 * Resolve a venue name against the shared map.
 *
 * Exact normalized hit first, then a longest-first containment pass so a name
 * carrying a trailing locality ("Benjamin Mkapa Stadium, Dar es Salaam")
 * still lands. Returns null when nothing matches — every caller treats null
 * as "use your existing fallback", so an unmapped venue degrades to whatever
 * placeholder that surface already had.
 */
export function resolveStadiumImage(venueName, stadiumImages) {
    if (!stadiumImages) return null;

    const key = normalizeVenueName(venueName);
    if (!key) return null;

    if (stadiumImages[key]) return stadiumImages[key];

    const candidates = Object.keys(stadiumImages).sort((a, b) => b.length - a.length);
    for (const candidate of candidates) {
        if (venueNamesMatch(key, candidate)) {
            return stadiumImages[candidate];
        }
    }

    return null;
}

/**
 * Warm an image in the browser cache without rendering it.
 *
 * Used by the hero slider to fetch the *next* slide while the current one is
 * on screen, so the crossfade has a decoded bitmap to work with instead of
 * starting a network request at the moment it becomes visible. No-ops during
 * SSR and on falsy urls.
 */
export function preloadImage(url) {
    if (!url || typeof window === 'undefined') return;

    const img = new window.Image();
    img.decoding = 'async';
    img.src = url;
}
