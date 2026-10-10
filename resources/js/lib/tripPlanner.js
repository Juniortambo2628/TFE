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
