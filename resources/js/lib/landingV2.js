// Pure helpers for landing page v2 and the walkthrough pages (UX review,
// 2 Nov 2026, Track C). JSX-free so `node --test` loads them
// (tests/JS/landingV2.test.mjs).

/**
 * What a CTA in config/landing_v2.php does. The config stores a small string
 * so the CMS can edit the label without touching the wiring:
 *
 *   planner          open the trip planner
 *   section:{id}     scroll to a section on this page
 *   link:{/path}     go to a path on this site
 *   route:{name}     go to a named Laravel route (resolved by the caller)
 *
 * Anything else — including an absolute or protocol-relative URL, which a
 * config edit must not be able to turn a button into — falls back to the
 * planner, the one action every page here offers.
 */
export function parseAction(action) {
    const value = String(action || '').trim();
    if (value === 'planner') return { kind: 'planner' };

    const [kind, ...rest] = value.split(':');
    const target = rest.join(':').trim();

    if (kind === 'section' && /^[a-z0-9-]+$/i.test(target)) return { kind: 'section', target };
    if (kind === 'link' && target.startsWith('/') && !target.startsWith('//')) return { kind: 'link', target };
    if (kind === 'route' && /^[a-z0-9._-]+$/i.test(target)) return { kind: 'route', target };

    return { kind: 'planner' };
}

/**
 * The section the "On this page" bar should mark, given where each section
 * starts (document offsets) and the scroll position. A section counts as
 * current once its top has passed `offset` pixels below the top of the
 * screen (the fixed header plus the bar itself). Before the first section,
 * nothing is current.
 *
 * @param {{id: string, top: number}[]} sections in page order
 */
export function activeSectionId(sections, scrollY, offset = 0) {
    const line = scrollY + offset + 1;
    let current = null;
    for (const s of sections) {
        if (typeof s.top !== 'number') continue;
        if (s.top <= line) current = s.id;
        else break;
    }
    return current;
}

/**
 * The facts strip: the server's counts paired with their labels, in the
 * label order, dropping any count the server left out (it drops zeros).
 * A label may be "singular|plural"; the count picks which, so one
 * tournament does not read "1 tournaments".
 */
export function factRows(facts = {}, labels = {}) {
    return Object.keys(labels || {})
        .filter((key) => Number(facts?.[key]) > 0)
        .map((key) => {
            const value = Number(facts[key]);
            const [one, many = one] = String(labels[key]).split('|');
            return { key, value, label: value === 1 ? one : many };
        });
}
