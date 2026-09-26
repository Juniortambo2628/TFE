import React from 'react';
import {
    SkeletonHero,
    SkeletonTiles,
    SkeletonSlab,
    SkeletonCards,
    SkeletonTable,
    SkeletonSplitEditor,
} from '@/Components/Common/Skeleton';

/**
 * pageSkeleton — one place that decides which layout skeleton stands in for a
 * destination while its Inertia visit is in flight (Sprint 53).
 *
 * A navigation only knows the URL it is heading to, not the component that
 * will answer it, so the variant is matched on the path. The point is that the
 * placeholder has the SAME SHAPE as the page that lands: a hero band, then
 * tiles / cards / a table / a split editor. Getting the shape roughly right is
 * what stops the content "jumping" into place; getting it exactly right is not
 * required, and an unmatched path falls through to the generic dashboard
 * shape, which reads fine anywhere.
 *
 * Add a pattern here rather than wiring a skeleton into a page — every
 * dashboard route is covered from this one table.
 */

/** Ordered: the first pattern whose regex matches the path wins. */
const VARIANTS = [
    // Account / edit surfaces — these render through SplitEditorLayout.
    [/\/(profile|security|settings|account)(\/|$)/, 'split'],
    [/\/(edit|create)(\/|$)/, 'split'],
    [/\/(tournaments|partners)\/[^/]+$/, 'split'],

    // Directory + moderation surfaces — ListingGrid / .tfe-table.
    [/\/(users|messages|communication|approvals|listing-approvals|requests|loans|loan-applications|bookings|tickets|orders)(\/|$)/, 'table'],

    // Browse surfaces — card grids.
    [/\/(listings|partners|tribes|events|news|announcements|media|stories|feed|store|packages|itineraries|match-schedule|savings-goals)(\/|$)/, 'cards'],

    // Number-led surfaces.
    [/\/(dashboard|analytics|journey|wallet|predict)(\/|$)/, 'dashboard'],
];

/** Resolve a URL (or path) to a skeleton variant name. */
export function skeletonVariantFor(url) {
    if (!url) return 'dashboard';
    let path = String(url);
    try {
        // Accepts a full href or a bare path; the base is only used to parse.
        path = new URL(path, 'http://localhost').pathname;
    } catch {
        path = path.split('?')[0];
    }
    for (const [pattern, variant] of VARIANTS) {
        if (pattern.test(path)) return variant;
    }
    return 'dashboard';
}

/** Render the skeleton for a variant name. */
export function PageSkeleton({ variant = 'dashboard' }) {
    if (variant === 'split') {
        return (
            <>
                <SkeletonHero />
                <SkeletonSplitEditor />
            </>
        );
    }

    if (variant === 'table') {
        return (
            <>
                <SkeletonHero />
                <div className="tfe-skeleton-slab">
                    <SkeletonTable rows={7} />
                </div>
            </>
        );
    }

    if (variant === 'cards') {
        return (
            <>
                <SkeletonHero />
                <SkeletonCards count={6} />
            </>
        );
    }

    return (
        <>
            <SkeletonHero />
            <SkeletonTiles count={4} />
            <div className="tfe-skeleton-columns">
                <SkeletonSlab lines={6} />
                <SkeletonSlab lines={4} />
            </div>
        </>
    );
}

export default PageSkeleton;
