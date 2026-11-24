import React, { Suspense, lazy, useMemo, useState } from 'react';

import Skeleton from '@/Components/Common/Skeleton';
import {
    blockAt,
    boxLayout,
    cheapestOpenBox,
    describeSeats,
    nextViewpoint,
    resolveTiers,
    upgradeFor,
    viewpoint,
} from '@/lib/stadiumBowl';
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
 * to invent a figure in that case. Each tier is drawn as its numbered blocks;
 * a block shows its OWN figures only where the payload has a row for it (one
 * fixture), and otherwise says the figure is its tier's.
 *
 * Clicking a block flies the camera to it and opens a card with a still of
 * the view from it; "View from seat" sits the camera there, the arrows step
 * along the tier block by block, and "Another view" jumps round the ground.
 * A legend row does the same for that tier's halfway-line block. The
 * sightline is approximate — the bowl is generic, not a replica — and the
 * card says so.
 *
 * Props:
 *   bowls             array|object — one payload, or several to offer a switcher.
 *   height            number?      — canvas height in px.
 *   selectable        bool?        — allow picking (fixture payloads only).
 *   selectedTierKey   string?      — currently picked tier key.
 *   selectedBlockCode string?      — currently picked block, or null for
 *                                    "best available" in that tier.
 *   onTierSelect      fn?          — (tier, block|null) when something is picked.
 *   seatMap           object?      — the selected block's seats from
 *                                    `fan.tickets.blocks.seats` ({ code, rows,
 *                                    per_row, last_row, taken: ["r:n"] }).
 *                                    With it, the camera closes in on the
 *                                    block and its seats can be picked.
 *   selectedSeats     array?       — [{ row, number }] picked in that block.
 *   onSeatToggle      fn?          — ({ row, number }) when a free seat is clicked.
 *   selectedBoxCode   string?      — the hospitality box picked, if any.
 *   onBoxSelect       fn?          — (box) when "Choose" is pressed on a box.
 *   note              node?        — small print under the legend.
 */
export default function StadiumBowl({
    bowls,
    height = 420,
    selectable = false,
    selectedTierKey = null,
    selectedBlockCode = null,
    onTierSelect,
    seatMap = null,
    selectedSeats = [],
    onSeatToggle,
    selectedBoxCode = null,
    onBoxSelect,
    note,
}) {
    const list = useMemo(
        () => (Array.isArray(bowls) ? bowls : [bowls]).filter(Boolean),
        [bowls],
    );

    const [activeSlug, setActiveSlug] = useState(null);
    const [hovered, setHovered] = useState(null);
    const [tooltip, setTooltip] = useState(null);
    // { tierKey, blockCode, viewKey, seat } — where the camera is, or null
    // for the overview. `viewKey` remembers the last named viewpoint so
    // "Another view" moves on from it.
    const [focus, setFocus] = useState(null);
    const [still, setStill] = useState(null);

    const bowl = useMemo(
        () => list.find((b) => b.slug === activeSlug) || list[0] || null,
        [list, activeSlug],
    );

    // Hospitality boxes, placed along the main stand. Memoised on the bowl so
    // the canvas builds them once and only repaints focus changes.
    const boxList = useMemo(
        () => (bowl ? boxLayout(resolveTiers(bowl.tiers, bowl.capacity), bowl.boxes, { cornerRatio: bowl.corner_ratio }) : []),
        [bowl],
    );
    const boxes = useMemo(
        () => (boxList.length ? { boxes: boxList, focusCode: focus?.boxCode ?? null, selectedCode: selectedBoxCode } : null),
        [boxList, focus?.boxCode, selectedBoxCode],
    );

    // The seats to draw: only the open block's, and only when it is the one
    // whose seat map we hold. Memoised so the canvas repaints rather than
    // rebuilding when nothing changed.
    const seatsOpen = Boolean(seatMap && focus && focus.blockCode === seatMap.code);
    const selectedKey = (selectedSeats || []).map((x) => `${x.row}:${x.number}`).join(',');
    const seats = useMemo(() => (seatsOpen ? {
        tierKey: focus.tierKey,
        blockCode: seatMap.code,
        grid: { rows: seatMap.rows, perRow: seatMap.per_row, lastRow: seatMap.last_row },
        taken: new Set(seatMap.taken || []),
        selected: new Set(selectedKey ? selectedKey.split(',') : []),
    } : null), [seatsOpen, focus?.tierKey, seatMap, selectedKey]);

    if (!bowl) return null;

    // The one tier list. The canvas builds its blocks from exactly this, so a
    // tier picked in the legend and a block picked in the 3D view hand
    // `onTierSelect` the same objects — they once handed over two different
    // shapes (`tier_id` from the raw payload vs `tierId` from the geometry),
    // and the legend's picks silently carried no tier id at all.
    const tiers = resolveTiers(bowl.tiers, bowl.capacity);
    const live = Boolean(bowl.has_inventory);
    // Purchasable only when the payload is one fixture's own inventory — an
    // aggregate across a ground's fixtures has no single row to buy from, so
    // the service withholds the ids and we must not offer it.
    const canPick = selectable && bowl.source === 'fixture'
        && typeof onTierSelect === 'function';

    const handleHover = (hit, x, y) => {
        setTooltip(hit ? { ...hit, x, y } : null);
    };

    /** A block can be bought on its own when it has a row and room. */
    const blockPickable = (block) => Boolean(block?.blockId) && !block.isSoldOut;

    const pick = (tier, block) => {
        if (!canPick || !tier || tier.isSoldOut || !tier.tierId) return;

        onTierSelect(tier, blockPickable(block) ? block : null);
    };

    const show = (tier, block, viewKey = null) => {
        if (!tier || !block) return;

        setTooltip(null);
        setFocus((f) => ({
            tierKey: tier.key,
            blockCode: block.code,
            viewKey,
            seat: f?.seat && f.tierKey === tier.key ? f.seat : false,
        }));
    };

    const canBook = canPick && typeof onBoxSelect === 'function';

    const showBox = (box) => {
        if (!box) return;

        setTooltip(null);
        setFocus((f) => ({ boxCode: box.code, seat: Boolean(f?.boxCode && f.seat) }));
    };

    // Clicking a block on the map picks THAT block; clicking a seat of the
    // open block toggles it; clicking a box shows it (a box costs thousands,
    // so it is only booked with an explicit "Choose").
    const onMapSelect = (tier, block, seat, box) => {
        if (box) {
            showBox(box);
            return;
        }

        if (seat) {
            if (!seat.taken && seatsOpen && typeof onSeatToggle === 'function') {
                onSeatToggle({ row: seat.row, number: seat.number });
            }
            return;
        }

        show(tier, block);
        pick(tier, block);
    };

    // A legend row picks the tier ("best available") and shows its block on
    // the halfway line.
    const onLegendSelect = (tier) => {
        const half = viewpoint('halfway');
        show(tier, blockAt(tier, half.angle), half.key);
        pick(tier, null);
    };

    const switchVenue = (slug) => {
        setActiveSlug(slug);
        setFocus(null);
        setStill(null);
    };

    const focusedBox = focus?.boxCode ? boxList.find((b) => b.code === focus.boxCode) || null : null;
    const focusedTier = focus?.tierKey ? tiers.find((t) => t.key === focus.tierKey) || null : null;
    const focusedBlock = focusedTier?.blocks.find((b) => b.code === focus.blockCode) || null;

    // The next tier up, offered once the fan has picked this tier: the real
    // price difference, and only where that tier still has seats.
    const upgrade = canPick && focusedTier && selectedTierKey === focusedTier.key
        ? upgradeFor(tiers, focusedTier.key, focusedBlock)
        : null;

    const takeUpgrade = () => {
        show(upgrade.tier, upgrade.block);
        pick(upgrade.tier, upgrade.block);
    };

    // From VIP there is no tier above; a box is the next step up.
    const boxOffer = canBook && focusedTier?.key === 'vip' ? cheapestOpenBox(boxList) : null;

    const stepBox = (dir) => {
        const i = boxList.findIndex((b) => b.code === focusedBox.code);
        showBox(boxList[(i + dir + boxList.length) % boxList.length]);
    };

    const step = (dir) => {
        const blocks = focusedTier.blocks;
        const i = blocks.findIndex((b) => b.code === focusedBlock.code);
        show(focusedTier, blocks[(i + dir + blocks.length) % blocks.length]);
    };

    const anotherView = () => {
        const next = nextViewpoint(focus.viewKey);
        show(focusedTier, blockAt(focusedTier, next.angle), next.key);
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
                        highlightKey={hovered}
                        onHover={handleHover}
                        onSelect={onMapSelect}
                        view={focusedBlock ? {
                            ...focus,
                            close: seatsOpen,
                            seatAt: seatsOpen && selectedSeats?.length ? selectedSeats[0] : null,
                        } : focusedBox ? { boxCode: focusedBox.code, seat: focus.seat } : null}
                        seats={seats}
                        boxes={boxes}
                        onSnapshot={setStill}
                    />
                </Suspense>

                {focusedBlock && (
                    <FocusCard
                        tier={focusedTier}
                        block={focusedBlock}
                        seat={focus.seat}
                        still={still}
                        live={live}
                        currency={bowl.currency}
                        canPick={canPick}
                        isSelected={canPick && selectedTierKey === focusedTier.key
                            && selectedBlockCode === focusedBlock.code}
                        pickable={canPick && blockPickable(focusedBlock)}
                        seatsOpen={seatsOpen}
                        mySeats={seatsOpen ? selectedSeats : []}
                        upgrade={upgrade}
                        onUpgrade={takeUpgrade}
                        boxOffer={boxOffer}
                        onBoxOffer={() => showBox(boxOffer)}
                        onPick={() => pick(focusedTier, focusedBlock)}
                        onSit={() => setFocus((f) => ({ ...f, seat: true }))}
                        onStand={() => setFocus((f) => ({ ...f, seat: false }))}
                        onStep={step}
                        onNext={anotherView}
                        onClose={() => { setFocus(null); setStill(null); }}
                    />
                )}

                {focusedBox && (
                    <BoxCard
                        box={focusedBox}
                        seat={focus.seat}
                        still={still}
                        currency={bowl.currency}
                        canBook={canBook}
                        isSelected={selectedBoxCode === focusedBox.code}
                        onBook={() => onBoxSelect(focusedBox)}
                        onSit={() => setFocus((f) => ({ ...f, seat: true }))}
                        onStand={() => setFocus((f) => ({ ...f, seat: false }))}
                        onStep={stepBox}
                        onClose={() => { setFocus(null); setStill(null); }}
                    />
                )}

                {tooltip && (
                    <div
                        className="tfe-bowl__tooltip"
                        style={{ left: tooltip.x, top: tooltip.y }}
                        role="status"
                    >
                        {tooltip.box ? (
                            <>
                                <strong>{tooltip.box.name} · {tooltip.box.seats} seats</strong>
                                <span>
                                    {tooltip.box.isBooked
                                        ? 'Booked'
                                        : tooltip.box.price != null
                                            ? `${formatMoney(tooltip.box.price, bowl.currency)} for the box`
                                            : 'Hospitality box'}
                                </span>
                            </>
                        ) : tooltip.seat ? (
                            <>
                                <strong>Row {tooltip.seat.row} · Seat {tooltip.seat.number}</strong>
                                <span>
                                    Block {tooltip.block.code} ·{' '}
                                    {tooltip.seat.taken
                                        ? 'Taken'
                                        : tooltip.tier.price != null
                                            ? formatMoney(tooltip.tier.price, bowl.currency)
                                            : 'Free'}
                                </span>
                            </>
                        ) : (
                            <>
                                <strong>Block {tooltip.block.code} · {tooltip.block.standName}</strong>
                                <span>{tooltip.tier.name} · {blockFigure(tooltip.tier, tooltip.block, live)}</span>
                            </>
                        )}
                    </div>
                )}

                {!focusedBlock && !focusedBox && (
                    <p className="tfe-bowl__hint">Drag to rotate · scroll or pinch to zoom · tap a block to fly there</p>
                )}
            </div>

            <ul className="tfe-bowl__legend">
                {tiers.map((tier) => {
                    const isSelected = canPick
                        ? selectedTierKey === tier.key
                        : focus?.tierKey === tier.key;
                    const soldOut = Boolean(tier.isSoldOut);

                    // Every row is a button: on a surface that sells nothing it
                    // still flies the camera to the tier, which is also the
                    // keyboard way into the blocks (the card's arrows step
                    // through them).
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
                                onClick={() => onLegendSelect(tier)}
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
                {boxList.length > 0 && (
                    <li>
                        <button
                            type="button"
                            className={[
                                'tfe-bowl__legend-row',
                                'is-pickable',
                                focusedBox || selectedBoxCode ? 'is-active' : '',
                            ].filter(Boolean).join(' ')}
                            onClick={() => showBox(cheapestOpenBox(boxList) || boxList[0])}
                            aria-pressed={Boolean(selectedBoxCode)}
                        >
                            <span className="tfe-bowl__swatch tfe-bowl__swatch--glass" aria-hidden="true" />
                            <span className="tfe-bowl__legend-name">Hospitality boxes</span>
                            {cheapestOpenBox(boxList) && (
                                <span className="tfe-bowl__legend-price">
                                    from {formatMoney(cheapestOpenBox(boxList).price, bowl.currency)}
                                </span>
                            )}
                            <span className="tfe-bowl__legend-figure">
                                {boxList.filter((b) => !b.isBooked).length} of {boxList.length} free
                            </span>
                        </button>
                    </li>
                )}
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
 * What a block's figure line says. Its own numbers where it has a row; its
 * tier's, labelled as the tier's, where it does not — an aggregate bowl must
 * not present a tier average as one block's occupancy.
 */
function blockFigure(tier, block, live) {
    if (!live) return `${formatNumber(Number(tier.capacity || 0))} seats in tier`;

    if (!block.inherited) {
        if (block.isSoldOut) return 'Sold out';
        return `${formatNumber(Number(block.remaining || 0))} of ${formatNumber(Number(block.capacity || 0))} seats left`;
    }

    return tier.booked === null ? '' : `tier ${Math.round(tier.booked * 100)}% booked`;
}

/**
 * The stage overlay for a focused block — the recording's "ticket card":
 * where in the ground, which tier, what it costs, how full, and a still of
 * the view from it. In the seat itself the still is redundant (you are
 * looking at it), so the card shrinks to the controls.
 */
function FocusCard({
    tier, block, seat, still, live, currency, canPick, isSelected, pickable,
    seatsOpen, mySeats, upgrade, onUpgrade, boxOffer, onBoxOffer,
    onPick, onSit, onStand, onStep, onNext, onClose,
}) {
    const priced = tier.price !== null && tier.price !== undefined;
    const where = `${block.standName} · Block ${block.code}`;

    return (
        <section
            className={`tfe-bowl__card${seat ? ' is-seat' : ''}`}
            aria-label={`${tier.name}, ${where}`}
        >
            {!seat && (
                <div className="tfe-bowl__card-view">
                    {still
                        ? <img src={still} alt={`Approximate view from ${tier.name}, ${where}`} />
                        : <span className="tfe-bowl__card-view-empty" aria-hidden="true" />}
                    <span className="tfe-bowl__card-tag">Your view</span>
                </div>
            )}

            <div className="tfe-bowl__card-body">
                <div className="tfe-bowl__card-head">
                    <div className="tfe-bowl__card-ident">
                        <span className="tfe-bowl__card-eyebrow">{block.standName}</span>
                        <strong className="tfe-bowl__card-title">
                            {tier.name} · Block {block.code}
                        </strong>
                    </div>
                    {priced && (
                        <span className="tfe-bowl__card-price">{formatMoney(tier.price, currency)}</span>
                    )}
                </div>

                <p className="tfe-bowl__card-meta">
                    {blockFigure(tier, block, live)}
                    {seat && ' · approximate sightline'}
                </p>

                {seatsOpen && (
                    <p className="tfe-bowl__card-seats">
                        {mySeats.length
                            ? <>Your seats: <strong>{describeSeats(mySeats)}</strong></>
                            : 'Tap free seats to pick them, or leave it to us for the best seats together.'}
                    </p>
                )}

                <div className="tfe-bowl__card-actions">
                    <span className="tfe-bowl__card-stepper">
                        <button
                            type="button"
                            className="tfe-btn tfe-btn--icon tfe-btn--sm"
                            onClick={() => onStep(-1)}
                            aria-label="Previous block"
                        >
                            <i className="fas fa-chevron-left" aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            className="tfe-btn tfe-btn--icon tfe-btn--sm"
                            onClick={() => onStep(1)}
                            aria-label="Next block"
                        >
                            <i className="fas fa-chevron-right" aria-hidden="true" />
                        </button>
                    </span>
                    {seat ? (
                        <button type="button" className="tfe-btn tfe-btn--sm" onClick={onStand}>
                            <i className="fas fa-arrow-up" aria-hidden="true" /> Stand view
                        </button>
                    ) : (
                        <button type="button" className="tfe-btn tfe-btn--sm" onClick={onSit}>
                            <i className="fas fa-eye" aria-hidden="true" />
                            {mySeats.length ? ' View from your seat' : ' View from seat'}
                        </button>
                    )}
                    <button type="button" className="tfe-btn tfe-btn--sm" onClick={onNext}>
                        <i className="fas fa-sync-alt" aria-hidden="true" /> Another view
                    </button>
                    {canPick && isSelected && (
                        <span className="tfe-pill tfe-pill--approved">Selected</span>
                    )}
                    {upgrade && (
                        <button type="button" className="tfe-btn tfe-btn--sm tfe-bowl__upgrade" onClick={onUpgrade}>
                            <i className="fas fa-arrow-circle-up" aria-hidden="true" />
                            {' '}Upgrade to {upgrade.tier.name} · +{formatMoney(upgrade.extra, currency)} a seat
                        </button>
                    )}
                    {boxOffer && (
                        <button type="button" className="tfe-btn tfe-btn--sm tfe-bowl__upgrade" onClick={onBoxOffer}>
                            <i className="fas fa-arrow-circle-up" aria-hidden="true" />
                            {' '}Hospitality box · from {formatMoney(boxOffer.price, currency)}
                        </button>
                    )}
                    {pickable && !isSelected && (
                        <button type="button" className="tfe-btn tfe-btn--sm tfe-btn--filled" onClick={onPick}>
                            Choose block {block.code}
                        </button>
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
 * The stage card for a hospitality box: which box, how many it seats, the
 * price of the WHOLE box, and the view from inside it.
 */
function BoxCard({
    box, seat, still, currency, canBook, isSelected, onBook, onSit, onStand, onStep, onClose,
}) {
    return (
        <section className={`tfe-bowl__card${seat ? ' is-seat' : ''}`} aria-label={`${box.name}, hospitality box`}>
            {!seat && (
                <div className="tfe-bowl__card-view">
                    {still
                        ? <img src={still} alt={`Approximate view from ${box.name}`} />
                        : <span className="tfe-bowl__card-view-empty" aria-hidden="true" />}
                    <span className="tfe-bowl__card-tag">Your view</span>
                </div>
            )}

            <div className="tfe-bowl__card-body">
                <div className="tfe-bowl__card-head">
                    <div className="tfe-bowl__card-ident">
                        <span className="tfe-bowl__card-eyebrow">West Stand · Hospitality</span>
                        <strong className="tfe-bowl__card-title">{box.name}</strong>
                    </div>
                    {box.price !== null && (
                        <span className="tfe-bowl__card-price">{formatMoney(box.price, currency)}</span>
                    )}
                </div>

                <p className="tfe-bowl__card-meta">
                    {box.seats} seats · the whole box{box.isBooked && ' · booked'}
                    {seat && ' · approximate sightline'}
                </p>

                <div className="tfe-bowl__card-actions">
                    <span className="tfe-bowl__card-stepper">
                        <button type="button" className="tfe-btn tfe-btn--icon tfe-btn--sm" onClick={() => onStep(-1)} aria-label="Previous box">
                            <i className="fas fa-chevron-left" aria-hidden="true" />
                        </button>
                        <button type="button" className="tfe-btn tfe-btn--icon tfe-btn--sm" onClick={() => onStep(1)} aria-label="Next box">
                            <i className="fas fa-chevron-right" aria-hidden="true" />
                        </button>
                    </span>
                    {seat ? (
                        <button type="button" className="tfe-btn tfe-btn--sm" onClick={onStand}>
                            <i className="fas fa-arrow-up" aria-hidden="true" /> Outside view
                        </button>
                    ) : (
                        <button type="button" className="tfe-btn tfe-btn--sm" onClick={onSit}>
                            <i className="fas fa-eye" aria-hidden="true" /> View from the box
                        </button>
                    )}
                    {box.isBooked && <span className="tfe-pill tfe-pill--rejected">Booked</span>}
                    {isSelected && <span className="tfe-pill tfe-pill--approved">Selected</span>}
                    {canBook && !box.isBooked && !isSelected && box.boxId && (
                        <button type="button" className="tfe-btn tfe-btn--sm tfe-btn--filled" onClick={onBook}>
                            Choose {box.name}
                        </button>
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
