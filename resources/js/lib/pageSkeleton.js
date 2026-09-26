/**
 * pageSkeleton — one place that decides which layout skeleton stands in for a
 * destination while its Inertia visit is in flight (Sprint 53).
 *
 * A navigation only knows the URL it is heading to, not the component that
 * will answer it, so the variant is matched on the path. The point is that the
 * placeholder has the SAME SHAPE as the page that lands: a hero band, then
 * tiles / cards / a table / a split editor. Getting the shape roughly right is
 * what stops content "jumping" into place; getting it exactly right is not
 * required, and an unmatched path falls through to the generic dashboard
 * shape, which reads fine anywhere.
 *
 * Add a pattern here rather than wiring a skeleton into a page — every
 * dashboard route is covered from this one table.
 *
 * Kept free of JSX so it stays unit-testable under node --test; the rendering
 * half lives in Components/Common/PageSkeleton.jsx.
 */

/** Ordered: the first pattern whose regex matches the path wins. */
export const SKELETON_VARIANTS = [
    // Account / edit surfaces — these render through SplitEditorLayout.
    [/\/(profile|security|settings|account)(\/|$)/, 'split'],
    [/\/(edit|create)(\/|$)/, 'split'],
    [/\/(tournaments|partners)\/[^/]+$/, 'split'],

    // Directory + moderation surfaces — ListingGrid table view / .tfe-table.
    [/\/(users|messages|communication|approvals|listing-approvals|requests|loans|loan-applications|bookings|tickets|orders)(\/|$)/, 'table'],

    // Browse surfaces — card grids.
    [/\/(listings|partners|tribes|events|news|announcements|media|stories|feed|store|packages|itineraries|match-schedule|savings-goals)(\/|$)/, 'cards'],

    // Number-led surfaces.
    [/\/(dashboard|analytics|journey|wallet|predict)(\/|$)/, 'dashboard'],
];

/** The variant used when nothing matches. */
export const DEFAULT_SKELETON_VARIANT = 'dashboard';

/**
 * Resolve a URL (a full href, a bare path, or a URL object) to a variant name.
 */
export function skeletonVariantFor(url) {
    if (!url) return DEFAULT_SKELETON_VARIANT;

    let path = typeof url === 'string' ? url : (url.pathname || String(url));
    try {
        // The base is only used so a bare path parses; it is never read.
        path = new URL(path, 'http://localhost').pathname;
    } catch {
        path = path.split('?')[0];
    }

    for (const [pattern, variant] of SKELETON_VARIANTS) {
        if (pattern.test(path)) return variant;
    }

    return DEFAULT_SKELETON_VARIANT;
}
