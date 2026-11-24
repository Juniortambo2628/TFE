import React, { Suspense, lazy, useMemo, useState } from 'react';

import Skeleton from '@/Components/Common/Skeleton';
import { nextViewpoint, resolveTiers, viewpoint } from '@/lib/stadiumBowl';
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
 * Clicking a tier (on the map or in the legend) flies the camera to that
 * stand and opens a card with a still of the view from it; "View from seat"
 * then sits the camera in the tier, and "Another view" moves round the
 * ground. The sightline is approximate — the bowl is generic, not a replica —
 * and the card says so.
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
    // { tierKey, viewKey, seat } — where the camera is, or null for the overview.
    const [focus, setFocus] = useState(null);
    const [still, setStill] = useState(null);

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

    const focusTier = (tier) => {
        if (!tier) return;

        setTooltip(null);
        setFocus((f) => ({
            tierKey: tier.key,
            viewKey: f?.viewKey ?? viewpoint().key,
            seat: false,
        }));
        handleSelect(tier);
    };

    const switchVenue = (slug) => {
        setActiveSlug(slug);
        setFocus(null);
        setStill(null);
    };

    const focused = focus ? tiers.find((t) => t.key === focus.tierKey) || null : null;
    const spot = focus ? viewpoint(focus.viewKey) : null;

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
                            onChange={(e) => switchVenue(e.target.value)}
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
                        highlightKey={hovered ?? focus?.tierKey ?? null}
                        onHover={handleHover}
                        onSelect={focusTier}
                        view={focused ? focus : null}
                        onSnapshot={setStill}
                    />
                </Suspense>

                {focused && (
                    <FocusCard
                        tier={focused}
                        spot={spot}
                        seat={focus.seat}
                        still={still}
                        live={live}
                        currency={bowl.currency}
                        isSelected={selectedTierKey === focused.key}
                        canPick={canPick}
                        onSit={() => setFocus((f) => ({ ...f, seat: true }))}
                        onStand={() => setFocus((f) => ({ ...f, seat: false }))}
                        onNext={() => setFocus((f) => ({ ...f, viewKey: nextViewpoint(f.viewKey).key }))}
                        onClose={() => { setFocus(null); setStill(null); }}
                    />
                )}

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

                {!focused && (
                    <p className="tfe-bowl__hint">Drag to rotate · scroll or pinch to zoom · tap a tier to fly there</p>
                )}
            </div>

            <ul className="tfe-bowl__legend">
                {tiers.map((tier) => {
                    const isSelected = canPick
                        ? selectedTierKey === tier.key
                        : focus?.tierKey === tier.key;
                    const soldOut = Boolean(tier.isSoldOut);

                    // Every row is a button now: on a surface that sells
                    // nothing it still flies the camera to the tier, which is
                    // also the keyboard way into the view from it.
                    return (
                        <li key={tier.key}>
                            <button
                                type="button"
                                className={[
                                    'tfe-bowl__legend-row',
                                    'is-pickable',
                                    hovered === tier.key ? 'is-hovered' : '',
                                    isSelected ? 'is-active' : '',
                                    soldOut ? 'is-soldout' : '',
                                ].filter(Boolean).join(' ')}
                                onMouseEnter={() => setHovered(tier.key)}
                                onMouseLeave={() => setHovered(null)}
                                onClick={() => focusTier(tier)}
                                aria-pressed={isSelected}
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
                            </button>
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
 * The stage overlay for a focused tier — the recording's "ticket card": which
 * tier, where in the ground, what it costs, and a still of the view from it.
 * In the seat itself the still is redundant (you are looking at it), so the
 * card shrinks to the controls.
 */
function FocusCard({
    tier, spot, seat, still, live, currency, isSelected, canPick,
    onSit, onStand, onNext, onClose,
}) {
    const soldOut = Boolean(tier.isSoldOut);
    const priced = tier.price !== null && tier.price !== undefined;

    let figure = `${formatNumber(Number(tier.capacity || 0))} seats`;
    if (soldOut) figure = 'Sold out';
    else if (live && tier.booked !== null) figure = `${Math.round(tier.booked * 100)}% booked`;

    return (
        <section
            className={`tfe-bowl__card${seat ? ' is-seat' : ''}`}
            aria-label={`${tier.name} — ${spot.label}`}
        >
            {!seat && (
                <div className="tfe-bowl__card-view">
                    {still
                        ? <img src={still} alt={`Approximate view from ${tier.name}, ${spot.label.toLowerCase()}`} />
                        : <span className="tfe-bowl__card-view-empty" aria-hidden="true" />}
                    <span className="tfe-bowl__card-tag">Your view</span>
                </div>
            )}

            <div className="tfe-bowl__card-body">
                <div className="tfe-bowl__card-head">
                    <div className="tfe-bowl__card-ident">
                        <span className="tfe-bowl__card-eyebrow">{spot.label}</span>
                        <strong className="tfe-bowl__card-title">{tier.name}</strong>
                    </div>
                    {priced && (
                        <span className="tfe-bowl__card-price">{formatMoney(tier.price, currency)}</span>
                    )}
                </div>

                <p className="tfe-bowl__card-meta">
                    {figure}
                    {seat && ' · approximate sightline'}
                </p>

                <div className="tfe-bowl__card-actions">
                    {seat ? (
                        <button type="button" className="tfe-btn tfe-btn--sm" onClick={onStand}>
                            <i className="fas fa-arrow-up" aria-hidden="true" /> Stand view
                        </button>
                    ) : (
                        <button type="button" className="tfe-btn tfe-btn--sm" onClick={onSit}>
                            <i className="fas fa-eye" aria-hidden="true" /> View from seat
                        </button>
                    )}
                    <button type="button" className="tfe-btn tfe-btn--sm" onClick={onNext}>
                        <i className="fas fa-sync-alt" aria-hidden="true" /> Another view
                    </button>
                    {canPick && isSelected && (
                        <span className="tfe-pill tfe-pill--approved">Selected</span>
                    )}
                </div>
            </div>

            <button
                type="button"
                className="tfe-btn tfe-btn--icon tfe-btn--sm tfe-bowl__card-close"
                onClick={onClose}
                aria-label="Back to the whole stadium"
            >
                <i className="fas fa-times" aria-hidden="true" />
            </button>
        </section>
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
