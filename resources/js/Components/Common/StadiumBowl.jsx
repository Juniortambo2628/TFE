import React, { Suspense, lazy, useMemo, useState } from 'react';

import Skeleton from '@/Components/Common/Skeleton';
import { resolveTiers } from '@/lib/stadiumBowl';
import { formatMoney, formatNumber } from '@/lib/utils';

import '../../../css/stadium-bowl.css';

// Lazily loaded so `three` lands in its own chunk and never reaches a page
// that doesn't draw a bowl. Every surface imports THIS file, not the canvas,
// so nobody has to remember to lazy-load it.
const StadiumBowlCanvas = lazy(() => import('@/Components/Common/StadiumBowlCanvas'));

/**
 * StadiumBowl — the 3D stadium seat map, chrome included.
 *
 * One component for every fan surface that shows a bowl. The payload comes
 * from `App\Services\StadiumBowlService`, which is the only thing that decides
 * what a venue is and how full it is; this file decides how that reads.
 *
 * Occupancy is shown ONLY where it is real. A payload with
 * `has_inventory: false` (a ground with no ticket rows) renders as a seating
 * layout with capacities and no percentages — the surfaces this replaced used
 * to invent a figure in that case.
 *
 * Props:
 *   bowls          array|object — one payload, or several to offer a switcher.
 *   height         number?      — canvas height in px.
 *   selectable     bool?        — allow picking a tier (fixture payloads only).
 *   selectedTierKey string?     — currently picked tier key.
 *   onTierSelect   fn?          — (tier) when a tier is picked.
 *   note           node?        — small print under the legend.
 */
export default function StadiumBowl({
    bowls,
    height = 420,
    selectable = false,
    selectedTierKey = null,
    onTierSelect,
    note,
}) {
    const list = useMemo(
        () => (Array.isArray(bowls) ? bowls : [bowls]).filter(Boolean),
        [bowls],
    );

    const [activeSlug, setActiveSlug] = useState(null);
    const [hovered, setHovered] = useState(null);
    const [tooltip, setTooltip] = useState(null);

    const bowl = useMemo(
        () => list.find((b) => b.slug === activeSlug) || list[0] || null,
        [list, activeSlug],
    );

    if (!bowl) return null;

    // The one tier list. The canvas builds its rings from exactly this, so a
    // tier clicked in the legend and a tier clicked in the 3D view hand
    // `onTierSelect` the same object — they used to hand over two different
    // shapes (`tier_id` from the raw payload vs `tierId` from the geometry),
    // and the legend's picks silently carried no tier id at all.
    const tiers = resolveTiers(bowl.tiers, bowl.capacity);
    const live = Boolean(bowl.has_inventory);
    // A tier is only purchasable when the payload is one fixture's own
    // inventory — an aggregate across a ground's fixtures has no single tier
    // row to buy from, so the service withholds `tier_id` and we must not
    // offer it.
    const canPick = selectable && bowl.source === 'fixture'
        && typeof onTierSelect === 'function';

    const handleHover = (tier, x, y) => {
        setHovered(tier ? tier.key : null);
        setTooltip(tier ? { tier, x, y } : null);
    };

    const handleSelect = (tier) => {
        if (!canPick || !tier || tier.isSoldOut || !tier.tierId) return;

        onTierSelect(tier);
    };

    return (
        <div className="tfe-bowl">
            <header className="tfe-bowl__head">
                <div className="tfe-bowl__ident">
                    <h4 className="tfe-bowl__name">{bowl.name}</h4>
                    <p className="tfe-bowl__meta">
                        {bowl.location}
                        {bowl.formerly && <> · formerly {bowl.formerly}</>}
                        {bowl.is_alternate && (
                            <span className="tfe-pill tfe-pill--info tfe-bowl__alt">Alternate venue</span>
                        )}
                    </p>

                    {list.length > 1 && (
                        <select
                            className="tfe-select tfe-select--sm tfe-bowl__switcher"
                            value={bowl.slug}
                            onChange={(e) => setActiveSlug(e.target.value)}
                            aria-label="Choose a venue"
                        >
                            {list.map((v) => (
                                <option key={v.slug} value={v.slug}>
                                    {v.name} — {formatNumber(Number(v.capacity || 0))} seats
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="tfe-bowl__stat">
                    {live ? (
                        <>
                            <div className="tfe-bowl__stat-value">{bowl.sold_pct}%</div>
                            <div className="tfe-bowl__stat-label">
                                {formatNumber(Number(bowl.sold || 0))} of{' '}
                                {formatNumber(Number(bowl.seats || 0))} seats booked
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="tfe-bowl__stat-value">
                                {formatNumber(Number(bowl.capacity || 0))}
                            </div>
                            <div className="tfe-bowl__stat-label">seats · no fixtures on sale yet</div>
                        </>
                    )}
                </div>
            </header>

            <div className="tfe-bowl__stage">
                <Suspense fallback={<Skeleton height={height} radius={14} />}>
                    <StadiumBowlCanvas
                        bowl={bowl}
                        height={height}
                        highlightKey={hovered}
                        onHover={handleHover}
                        onSelect={handleSelect}
                    />
                </Suspense>

                {tooltip && (
                    <div
                        className="tfe-bowl__tooltip"
                        style={{ left: tooltip.x, top: tooltip.y }}
                        role="status"
                    >
                        <strong>{tooltip.tier.name}</strong>
                        <span>
                            {live && tooltip.tier.booked !== null
                                ? `${Math.round(tooltip.tier.booked * 100)}% booked`
                                : `${formatNumber(Number(tooltip.tier.capacity || 0))} seats`}
                        </span>
                    </div>
                )}

                <p className="tfe-bowl__hint">Drag to rotate · scroll or pinch to zoom</p>
            </div>

            <ul className="tfe-bowl__legend">
                {tiers.map((tier) => {
                    const isSelected = selectedTierKey === tier.key;
                    const soldOut = Boolean(tier.isSoldOut);
                    const Row = canPick ? 'button' : 'div';

                    return (
                        <li key={tier.key}>
                            <Row
                                type={canPick ? 'button' : undefined}
                                className={[
                                    'tfe-bowl__legend-row',
                                    hovered === tier.key ? 'is-hovered' : '',
                                    isSelected ? 'is-active' : '',
                                    canPick ? 'is-pickable' : '',
                                    soldOut ? 'is-soldout' : '',
                                ].filter(Boolean).join(' ')}
                                onMouseEnter={() => setHovered(tier.key)}
                                onMouseLeave={() => setHovered(null)}
                                onClick={canPick ? () => handleSelect(tier) : undefined}
                                disabled={canPick && soldOut ? true : undefined}
                                aria-pressed={canPick ? isSelected : undefined}
                            >
                                <span
                                    className="tfe-bowl__swatch"
                                    style={{ background: swatch(tier) }}
                                    aria-hidden="true"
                                />
                                <span className="tfe-bowl__legend-name">{tier.name}</span>

                                {tier.price !== null && tier.price !== undefined && (
                                    <span className="tfe-bowl__legend-price">
                                        {formatMoney(tier.price, bowl.currency)}
                                    </span>
                                )}

                                <span className="tfe-bowl__legend-figure">
                                    {soldOut && 'Sold out'}
                                    {!soldOut && tier.booked !== null && `${Math.round(tier.booked * 100)}%`}
                                    {!soldOut && tier.booked === null && `${formatNumber(Number(tier.capacity || 0))} seats`}
                                </span>
                            </Row>
                        </li>
                    );
                })}
            </ul>

            {note && <p className="tfe-bowl__note">{note}</p>}

            {!live && (
                <p className="tfe-bowl__note">
                    Seating layout and capacities are this ground's own. Availability appears
                    once fixtures here go on sale.
                </p>
            )}
        </div>
    );
}

/**
 * A swatch is the resolved tier's own colour — the exact value the 3D ring is
 * built from. Do not reintroduce a CSS-variable or hex copy of this palette;
 * `BASE_TIERS` in `lib/stadiumBowl.js` is the one place tier colour lives.
 */
function swatch(tier) {
    return `#${Number(tier.color || 0).toString(16).padStart(6, '0')}`;
}
