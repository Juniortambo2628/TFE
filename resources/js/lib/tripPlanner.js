/**
 * Opening the public "Plan my trip" dialog from anywhere (Sprint 64).
 *
 * The dialog is mounted ONCE, by the public `Header`, so any CTA on any
 * public page opens the same instance without each page wiring its own.
 * JSX-free so `node --test` can load the pure helpers.
 */
export const OPEN_EVENT = 'tfe:plan-trip';

export function openTripPlanner(detail = {}) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail }));
}

/**
 * Rank packages against the visitor's trip: closest night count first, then
 * the ones that include a match they picked, then price. Sold-out rows go
 * last rather than vanishing — "nothing left" is worth knowing.
 */
export function rankPackages(packages = [], { nights = 7, matchIds = [] } = {}) {
    const picked = new Set(matchIds);
    const score = (p) => {
        const nightGap = Math.abs((Number(p.nights) || nights) - nights);
        const overlap = (p.included_match_ids || []).filter((id) => picked.has(id)).length;
        return (p.is_sold_out ? 1000 : 0) + nightGap - overlap * 3;
    };

    return [...packages].sort((a, b) => score(a) - score(b)
        || (Number(a.base_price) || 0) - (Number(b.base_price) || 0));
}

/** A package's price is per traveller; the trip total is for the group. */
export function packageTotal(pkg, groupSize = 1) {
    return (Number(pkg?.base_price) || 0) * Math.max(1, Number(groupSize) || 1);
}

/**
 * The planner remembers a visitor's answers between visits (Sprint 65), in
 * their own browser only. Storage can be missing or throw (private windows,
 * blocked site data), so every access is guarded and a failure just means
 * starting fresh.
 */
export const PREFS_KEY = 'tfe.planner.v1';
const PREF_FIELDS = ['mode', 'matchCount', 'matchIds', 'origin', 'groupSize', 'nights', 'flightClass', 'accommodation', 'currency', 'tournamentId'];

export function loadPlannerPrefs(storage = globalThis.localStorage) {
    try {
        const raw = storage?.getItem(PREFS_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        if (!parsed || typeof parsed !== 'object') return {};
        return Object.fromEntries(PREF_FIELDS.filter((k) => k in parsed).map((k) => [k, parsed[k]]));
    } catch {
        return {};
    }
}

export function savePlannerPrefs(prefs, storage = globalThis.localStorage) {
    try {
        const picked = Object.fromEntries(PREF_FIELDS.filter((k) => k in prefs).map((k) => [k, prefs[k]]));
        storage?.setItem(PREFS_KEY, JSON.stringify(picked));
    } catch {
        // Storage unavailable — nothing to remember, nothing broken.
    }
}

/**
 * The trip spread evenly over `months`, BEFORE interest. Shown beside the
 * estimate so financing is visible at the moment of deciding; the real
 * terms are the finance partner's to quote, so the copy says so.
 */
export function monthlyFrom(total, months = 12) {
    const n = Math.max(1, Math.floor(Number(months) || 1));
    return Math.ceil((Number(total) || 0) / n);
}

/**
 * Find the fixture a "Plan this match" hint names. Hints come from surfaces
 * whose match ids are NOT fixture ids (the landing hero numbers its rows), so
 * the match is by team names, both of which must appear. Returns null rather
 * than a guess — planning the wrong match is worse than asking.
 */
export function findFixtureByHint(fixtures = [], hint = {}) {
    const teams = (hint.teams || []).map((t) => String(t || '').trim().toLowerCase()).filter((t) => t && t !== 'tbd');
    if (teams.length < 2) return null;
    const has = (name, t) => {
        const n = String(name || '').toLowerCase();
        return n && (n === t || n.includes(t) || t.includes(n));
    };
    return fixtures.find((f) => teams.every((t) => has(f.homeTeam, t) || has(f.awayTeam, t))) || null;
}

/** The fixture with this id, compared as strings ("db_105" vs 105 vs "105"). */
export function findFixtureById(fixtures = [], id) {
    if (id === null || id === undefined || id === '') return null;
    return fixtures.find((f) => String(f.id) === String(id)) || null;
}
