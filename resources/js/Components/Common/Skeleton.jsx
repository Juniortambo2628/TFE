import React from 'react';

/**
 * Skeleton — the ONE shimmer placeholder primitive (Sprint 53).
 *
 * Everything that waits on data draws itself out of these: a plain `<Skeleton>`
 * block, `<SkeletonText>` for copy, and the layout skeletons below, which
 * mirror the real page's structure so the swap from placeholder to content
 * doesn't move anything on screen.
 *
 * Styling lives in `resources/css/primitives.css` under `.tfe-skeleton*` —
 * never inline a shimmer gradient at a callsite.
 */
export default function Skeleton({ width, height, radius, className = '', style, circle = false, ...rest }) {
    return (
        <span
            className={`tfe-skeleton${circle ? ' tfe-skeleton--circle' : ''} ${className}`.trim()}
            aria-hidden="true"
            style={{
                width,
                height,
                borderRadius: circle ? '50%' : radius,
                ...style,
            }}
            {...rest}
        />
    );
}

/** A paragraph of shimmer lines. The last line is short, like real text. */
export function SkeletonText({ lines = 3, className = '' }) {
    return (
        <span className={`tfe-skeleton-text ${className}`.trim()} aria-hidden="true">
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton key={i} height={12} width={i === lines - 1 ? '58%' : '100%'} />
            ))}
        </span>
    );
}

/** The dashboard hero band that opens nearly every role page. */
export function SkeletonHero() {
    return (
        <div className="tfe-skeleton-hero" aria-hidden="true">
            <Skeleton height={14} width={180} />
            <Skeleton height={30} width="46%" />
            <Skeleton height={14} width="62%" />
        </div>
    );
}

/** A row of `.tfe-tile` stat cards. */
export function SkeletonTiles({ count = 4 }) {
    return (
        <div className="tfe-stat-grid" aria-hidden="true">
            {Array.from({ length: count }).map((_, i) => (
                <div className="tfe-skeleton-tile" key={i}>
                    <Skeleton height={32} width={32} radius={10} />
                    <Skeleton height={26} width="55%" />
                    <Skeleton height={11} width="75%" />
                </div>
            ))}
        </div>
    );
}

/** A `.tfe-slab`-shaped content card with an optional header. */
export function SkeletonSlab({ lines = 4, header = true, height }) {
    return (
        <div className="tfe-skeleton-slab" style={height ? { minHeight: height } : undefined} aria-hidden="true">
            {header && (
                <div className="tfe-skeleton-slab__head">
                    <Skeleton height={14} width={150} />
                    <Skeleton height={26} width={90} radius={999} />
                </div>
            )}
            <SkeletonText lines={lines} />
        </div>
    );
}

/** A card grid, matching the ListingGrid default view. */
export function SkeletonCards({ count = 6 }) {
    return (
        <div className="tfe-skeleton-cards" aria-hidden="true">
            {Array.from({ length: count }).map((_, i) => (
                <div className="tfe-skeleton-card" key={i}>
                    <Skeleton height={140} radius={0} className="tfe-skeleton-card__media" />
                    <div className="tfe-skeleton-card__body">
                        <Skeleton height={15} width="72%" />
                        <Skeleton height={11} width="94%" />
                        <Skeleton height={11} width="48%" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/** A `.tfe-table`-shaped list. */
export function SkeletonTable({ rows = 6, cols = 4 }) {
    return (
        <div className="tfe-skeleton-table" aria-hidden="true">
            {Array.from({ length: rows }).map((_, r) => (
                <div className="tfe-skeleton-table__row" key={r}>
                    {Array.from({ length: cols }).map((_, c) => (
                        <Skeleton key={c} height={12} width={c === 0 ? '80%' : '55%'} />
                    ))}
                </div>
            ))}
        </div>
    );
}

/** The SplitEditorLayout shape: form column + sticky preview column. */
export function SkeletonSplitEditor() {
    return (
        <div className="tfe-split-grid" aria-hidden="true">
            <div className="tfe-editor-stack">
                <SkeletonSlab lines={5} />
                <SkeletonSlab lines={3} />
            </div>
            <div>
                <div className="tfe-split-preview">
                    <Skeleton height={11} width={90} />
                    <div className="tfe-skeleton-slab">
                        <Skeleton circle width={72} height={72} style={{ margin: '0 auto 14px' }} />
                        <Skeleton height={15} width="60%" style={{ margin: '0 auto 8px' }} />
                        <Skeleton height={11} width="45%" style={{ margin: '0 auto' }} />
                    </div>
                </div>
            </div>
        </div>
    );
}
