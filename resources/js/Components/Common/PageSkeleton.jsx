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
 * PageSkeleton — renders the placeholder for a variant name. Which variant a
 * destination gets is decided by `lib/pageSkeleton`, kept separate so the
 * mapping is unit-testable without a DOM.
 */
export default function PageSkeleton({ variant = 'dashboard' }) {
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
