import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { assetPath } from '@/lib/assets';
import { Head, Link, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import FanLayout from '@/Layouts/FanLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import StadiumBowl from '@/Components/Common/StadiumBowl';
import TfeModal from '@/Components/Common/TfeModal';
import SeatPicker from '@/Components/Fan/SeatPicker';
import { formatMoney, formatNumber, formatKickoff } from '@/lib/utils';
import { describeSeats } from '@/lib/stadiumBowl';
import '../../../../css/fan/fan-pages.css';
import '../../../../css/tickets.css';

const KICK = (s) => formatKickoff(s);

/**
 * Cheapest seat a fan can actually still buy.
 *
 * `ticket.price` is the fixture's BASE (Standard) price, so quoting it as
 * "from" understates the dear tiers and overstates the cheap ones — Upper sits
 * at 0.6x. A fixture whose cheap tiers are gone must quote the cheapest tier
 * that still has seats, not the cheapest tier that exists.
 */
function fromPrice(ticket) {
    const open = (ticket.tiers || []).filter((t) => !t.is_sold_out);
    const pool = open.length ? open : (ticket.tiers || []);

    if (!pool.length) return ticket.price;

    return pool.reduce((lo, t) => Math.min(lo, Number(t.price)), Infinity);
}

export default function TicketsIndex({ auth, tickets = [], purchases = [] }) {
    const [buying, setBuying] = useState(null);

    return (
        <FanLayout user={auth.user}>
            <Head title="Matchday tickets" />

            <DashboardHero
                role="fan"
                title="Matchday tickets"
                subtitle="Verified seats delivered as e-Tickets — powered by our official ticketing partner."
                breadcrumbs={[{ label: 'Home', href: route('fan.dashboard') }, { label: 'Tickets' }]}
            >
                <Link href={route('fan.tickets.purchases')} className="tfe-btn tfe-btn--sm">
                    <i className="fas fa-receipt"></i> My tickets ({purchases.length})
                </Link>
            </DashboardHero>

            {tickets.length === 0 ? (
                <div className="tfe-empty">
                    <div className="tfe-empty__icon"><i className="fas fa-ticket-alt"></i></div>
                    <h3 className="tfe-empty__title">No tickets on sale yet</h3>
                    <p className="tfe-empty__body">Check back closer to kickoff — our ticketing partner releases seats as fixtures are confirmed.</p>
                </div>
            ) : (
                <div className="ticket-grid">
                    {tickets.map((t) => <TicketCard key={t.id} ticket={t} onBuy={() => setBuying(t)} />)}
                </div>
            )}

            {/* Keyed + conditional: useForm reads its initial values on
                FIRST mount only, so a modal mounted with ticket={null} would
                keep a null default tier for the life of the page. */}
            {buying && (
                <PurchaseModal key={buying.id} ticket={buying} onClose={() => setBuying(null)} />
            )}
        </FanLayout>
    );
}

function TicketCard({ ticket, onBuy }) {
    const accent = ticket.partner?.theme_accent || '#8b5cf6';
    return (
        <article className="ticket-card" style={{ '--partner-accent': accent }}>
            <div
                className="ticket-card__cover"
                style={ticket.hero_image ? { backgroundImage: `url(${assetPath(ticket.hero_image)})` } : undefined}
            >
                <span className="tfe-pill tfe-pill--info ticket-card__stage">{ticket.stage}</span>
            </div>

            <div className="ticket-card__body">
                <div className="ticket-card__matchup">
                    <TeamBlock name={ticket.home_team} code={ticket.home_team_code} />
                    <span className="ticket-card__vs">vs</span>
                    <TeamBlock name={ticket.away_team} code={ticket.away_team_code} />
                </div>

                <div className="ticket-card__meta">
                    <div><i className="fas fa-clock"></i> {KICK(ticket.kickoff_at)}</div>
                    <div><i className="fas fa-map-marker-alt"></i> {ticket.venue_name}</div>
                    <div className="ticket-card__meta-sub">{ticket.venue_city}, {ticket.venue_country} · Capacity {formatNumber(ticket.venue_capacity)}</div>
                </div>

                <div className="ticket-card__stock">
                    <div className="ticket-card__bar"><span style={{ width: `${ticket.sold_pct}%` }} /></div>
                    <div className="ticket-card__stock-meta">
                        <strong>{formatNumber(ticket.remaining)}</strong> seats left
                        <span>{ticket.sold_pct}% sold</span>
                    </div>
                </div>

                {ticket.partner && (
                    <Link href={`/partners/${ticket.partner.slug}`} className="ticket-card__partner">
                        <span className="ticket-card__partner-dot" />
                        <span>Sold by <strong>{ticket.partner.display_name}</strong></span>
                        {ticket.partner.verified && <i className="fas fa-check-circle" title="Verified partner"></i>}
                    </Link>
                )}

                <div className="ticket-card__foot">
                    <div className="ticket-card__price">
                        <span className="ticket-card__price-label">from</span>
                        <strong>{formatMoney(fromPrice(ticket), ticket.currency)}</strong>
                    </div>
                    <button
                        onClick={onBuy}
                        disabled={ticket.is_sold_out}
                        className={`tfe-btn ${ticket.is_sold_out ? '' : 'tfe-btn--filled'}`}
                    >
                        {ticket.is_sold_out ? 'Sold out' : (<><i className="fas fa-ticket-alt"></i> Buy tickets</>)}
                    </button>
                </div>
            </div>
        </article>
    );
}

function TeamBlock({ name, code }) {
    return (
        <div className="ticket-card__team">
            {code && <img src={`/assets/Flags/${String(code).toLowerCase()}.png`} alt={name} onError={(e) => { e.target.style.display = 'none'; }} />}
            <span>{name}</span>
        </div>
    );
}

function PurchaseModal({ ticket, onClose }) {
    const tiers = ticket?.tiers || [];
    // Default to the cheapest tier with seats left, which is what a fan
    // opening the dialog is most likely after.
    const defaultTier = [...tiers]
        .filter((t) => !t.is_sold_out)
        .sort((a, b) => a.price - b.price)[0] || tiers[0] || null;

    const [step, setStep] = React.useState('seats');

    const { data, setData, post, processing, reset, errors } = useForm({
        quantity: 1,
        ticket_tier_id: defaultTier?.id ?? null,
        // Null = "best available": the server seats the order in the block
        // of this tier with the most room.
        ticket_block_id: null,
        // "row:number" for each seat the fan picked; empty = the server
        // seats the order together in the best seats left.
        seats: [],
        paid_with: 'card',
    });

    // The picked block's seat map, fetched when a block is picked: a fixture
    // has tens of thousands of seats and the fan looks at one block.
    const [seatMap, setSeatMap] = useState(null);
    const [seatMapError, setSeatMapError] = useState(null);

    useEffect(() => {
        setSeatMap(null);
        setSeatMapError(null);

        if (!data.ticket_block_id) return undefined;

        let live = true;
        axios.get(route('fan.tickets.blocks.seats', [ticket?.id, data.ticket_block_id]))
            .then((res) => { if (live) setSeatMap(res.data); })
            .catch(() => { if (live) setSeatMapError('Could not load the seats for this block. You can still book the best seats left.'); });

        return () => { live = false; };
    }, [ticket?.id, data.ticket_block_id]);

    const selectedSeats = data.seats.map((k) => {
        const [row, number] = k.split(':').map(Number);
        return { row, number };
    });

    const toggleSeat = ({ row, number }) => {
        const key = `${row}:${number}`;

        setData((prev) => {
            const had = prev.seats.includes(key);

            if (!had && prev.seats.length >= 10) return prev;

            const seats = had ? prev.seats.filter((k) => k !== key) : [...prev.seats, key];

            // Picked seats ARE the quantity; with none picked, keep the
            // quantity the fan typed.
            return { ...prev, seats, quantity: seats.length || prev.quantity };
        });
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('fan.tickets.buy', ticket.id), {
            preserveScroll: true,
            onSuccess: () => { toast.success('Ticket booked — check your e-Ticket'); reset(); onClose(); },
            onError: () => toast.error('Could not complete your booking'),
        });
    };

    if (!ticket) return null;

    const tier = tiers.find((t) => t.id === data.ticket_tier_id) || null;
    // The picked block, read from the same bowl payload the map draws.
    const bowlTier = ticket.bowl?.tiers?.find((t) => t.tier_id === data.ticket_tier_id);
    const block = bowlTier?.blocks?.find((b) => b.id === data.ticket_block_id) || null;
    // An untiered legacy fixture still prices off the ticket row. A block
    // costs its tier's price.
    const unit = Number(tier ? tier.price : ticket.price);
    const seatsLeft = block ? block.remaining : (tier ? tier.remaining : ticket.remaining);
    const maxQty = Math.max(1, Math.min(10, seatsLeft));
    const total = (Number(data.quantity) || 0) * unit;

    // Both entry points (the bowl/legend and the select below) normalise to
    // this, so there is one place that knows what picking a tier means.
    const pickTier = (tierId, remaining, blockId = null) => {
        if (!tierId) return;

        setData((prev) => ({
            ...prev,
            ticket_tier_id: tierId,
            ticket_block_id: blockId,
            // Seats belong to one block; a new pick starts with none.
            seats: prev.ticket_block_id === blockId ? prev.seats : [],
            // Clamp, or a fan who picked 8 Upper seats then switched to a VIP
            // tier with 3 left would submit a quantity the server rejects.
            quantity: Math.min(prev.quantity, Math.max(1, remaining ?? 10)),
        }));
    };

    return (
        <TfeModal
            open={!!ticket}
            onClose={onClose}
            size="lg"
            label="Matchday ticket"
            title={`${ticket.home_team} vs ${ticket.away_team}`}
            subheading={`${ticket.venue_name} · ${KICK(ticket.kickoff_at)}`}
            tabs={[
                { id: 'seats', label: 'Seats', icon: 'fas fa-chair' },
                { id: 'payment', label: 'Payment', icon: 'fas fa-credit-card' },
            ]}
            activeTab={step}
            onTabChange={setStep}
            footer={(
                <>
                    <span className="tfe-modal__foot-note">
                        {tier
                            ? `${tier.name}${block ? ` · Block ${block.code}` : ''}${selectedSeats.length ? ` · ${selectedSeats.length} seat${selectedSeats.length === 1 ? '' : 's'}` : ''} · ${formatMoney(unit, ticket.currency)} each`
                            : 'Pick a tier to continue'}
                    </span>
                    <button type="button" className="tfe-btn" onClick={onClose}>Cancel</button>
                    {/* Different `key`s on purpose. Without them React reuses
                        ONE <button> and flips its type to "submit" during the
                        Continue click, and the browser then runs the submit:
                        Continue placed the order without showing Payment. */}
                    {step === 'seats' ? (
                        <button key="continue" type="button" className="tfe-btn tfe-btn--filled" onClick={() => setStep('payment')} disabled={!data.ticket_tier_id}>
                            Continue
                        </button>
                    ) : (
                        <button key="pay" type="submit" form="ticket-purchase-form" disabled={processing} className="tfe-btn tfe-btn--filled">
                            <i className="fas fa-lock" /> Pay {formatMoney(total, ticket.currency)}
                        </button>
                    )}
                </>
            )}
        >
            <form id="ticket-purchase-form" onSubmit={submit}>

                {step === 'seats' && (<>
                {/* The bowl IS the tier picker here — clicking a tier in the
                    map or its legend selects it. The tier rows behind it are
                    the same ones this form submits, so the map cannot show one
                    thing and the purchase charge another. */}
                {ticket.bowl && (
                    <div className="ticket-modal__bowl">
                        <StadiumBowl
                            bowls={ticket.bowl}
                            height={320}
                            selectable
                            selectedTierKey={tier?.key ?? null}
                            selectedBlockCode={block?.code ?? null}
                            seatMap={seatMap}
                            selectedSeats={selectedSeats}
                            onSeatToggle={toggleSeat}
                            onTierSelect={(t, b) => pickTier(t.tierId, b ? b.remaining : t.remaining, b?.blockId ?? null)}
                            note="Pick a block on the map, or a tier for the best available block. Your seats in an order sit together; seat numbers are confirmed on your e-Ticket."
                        />
                    </div>
                )}

                {tiers.length > 0 && (
                    <>
                        <label className="tfe-form-label" htmlFor="tier">Seating tier</label>
                        <select
                            id="tier"
                            className="tfe-select"
                            value={data.ticket_tier_id ?? ''}
                            onChange={(e) => {
                                const picked = tiers.find((t) => t.id === Number(e.target.value));
                                if (picked) pickTier(picked.id, picked.remaining);
                            }}
                        >
                            {tiers.map((t) => (
                                <option key={t.id} value={t.id} disabled={t.is_sold_out}>
                                    {t.name} — {formatMoney(t.price, ticket.currency)}
                                    {t.is_sold_out ? ' · sold out' : ` · ${formatNumber(t.remaining)} left`}
                                </option>
                            ))}
                        </select>
                        {errors.ticket_tier_id && <p className="tfe-form-error">{errors.ticket_tier_id}</p>}

                        <p className="tfe-form-help">
                            {block ? (
                                <>
                                    Block {block.code} · {formatNumber(block.remaining)} seats left.{' '}
                                    <button
                                        type="button"
                                        className="ticket-modal__link"
                                        onClick={() => pickTier(tier.id, tier.remaining)}
                                    >
                                        Use best available instead
                                    </button>
                                </>
                            ) : (
                                'Best available block in this tier, with your seats together.'
                            )}
                        </p>
                        {errors.ticket_block_id && <p className="tfe-form-error">{errors.ticket_block_id}</p>}

                        {seatMap && seatMap.block_id === data.ticket_block_id && (
                            <SeatPicker seatMap={seatMap} selected={selectedSeats} onToggle={toggleSeat} />
                        )}
                        {seatMapError && <p className="tfe-form-help">{seatMapError}</p>}
                        {(errors.seats || errors['seats.0']) && (
                            <p className="tfe-form-error">{errors.seats || errors['seats.0']}</p>
                        )}
                    </>
                )}

                </>)}

                {step === 'payment' && (<>
                {selectedSeats.length > 0 ? (
                    <div className="ticket-modal__seats">
                        <span className="tfe-form-label">Your seats</span>
                        <p>
                            {selectedSeats.length} seat{selectedSeats.length === 1 ? '' : 's'} in block {block?.code}:{' '}
                            {describeSeats(selectedSeats)}
                        </p>
                        <button type="button" className="ticket-modal__link" onClick={() => setStep('seats')}>
                            Change seats
                        </button>
                    </div>
                ) : (
                    <>
                        <label className="tfe-form-label" htmlFor="qty">
                            Quantity (max {maxQty})
                        </label>
                        <input
                            id="qty" type="number" min="1" max={maxQty}
                            className="tfe-input"
                            value={data.quantity}
                            onChange={(e) => setData('quantity', Number(e.target.value))}
                        />
                    </>
                )}
                {errors.quantity && <p className="tfe-form-error">{errors.quantity}</p>}

                <label className="tfe-form-label" htmlFor="paid_with" style={{ marginTop: 16 }}>Pay with</label>
                <select
                    id="paid_with" className="tfe-select"
                    value={data.paid_with}
                    onChange={(e) => setData('paid_with', e.target.value)}
                >
                    <option value="card">Debit / Credit card</option>
                    <option value="virtual_card">Ecobank virtual card</option>
                    <option value="mpesa">M-PESA</option>
                </select>

                <div className="ticket-modal__total">
                    <span>Total</span>
                    <strong>{formatMoney(total, ticket.currency)}</strong>
                </div>

                <p className="ticket-modal__disclaimer">Demo purchase — no real card is charged. Reference is generated on confirm.</p>
                </>)}
            </form>
        </TfeModal>
    );
}
