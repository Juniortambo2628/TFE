/**
 * The dashboard v2 toolbar's search (Naoa's floating toolbar): what counts
 * as a match. JSX- and DOM-free so `node --test` loads it
 * (tests/JS/pageFind.test.mjs); the toolbar applies it to the page's rows
 * and cards.
 */

/** Lower-case and strip accents, so "Gaborone" finds "Gabórone" and back. */
export function normalizeText(text = '') {
    return String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Every word of the query must appear somewhere in the text, in any order —
 * "nairobi pending" finds the pending Nairobi brief. An empty query matches
 * everything.
 */
export function matchesQuery(text, query) {
    const words = normalizeText(query).split(/\s+/).filter(Boolean);
    if (!words.length) return true;
    const hay = normalizeText(text);
    return words.every((w) => hay.includes(w));
}

/** "4 of 12 shown" / "12 shown" — the line under the search box. */
export function shownLabel(shown, total) {
    return shown === total ? `${total} shown` : `${shown} of ${total} shown`;
}
