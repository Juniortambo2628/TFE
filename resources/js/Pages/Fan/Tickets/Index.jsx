import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import FanLayout from '@/Layouts/FanLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import TfeModal from '@/Components/Common/TfeModal';
import { formatMoney } from '@/lib/utils';
import '../../../../css/fan/fan-pages.css';
import '../../../../css/tickets.css';

const KICK = (s) => new Date(s).toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
});

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

            <PurchaseModal ticket={buying} onClose={() => setBuying(null)} />
        </FanLayout>
    );
}

function TicketCard({ ticket, onBuy }) {
    const accent = ticket.partner?.theme_accent || '#8b5cf6';
    return (
        <article className="ticket-card" style={{ '--partner-accent': accent }}>
            <div
                className="ticket-card__cover"
                style={ticket.hero_image ? { backgroundImage: `url(/${ticket.hero_image})` } : undefined}
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
                    <div className="ticket-card__meta-sub">{ticket.venue_city}, {ticket.venue_country} · Capacity {ticket.venue_capacity.toLocaleString()}</div>
                </div>

                <div className="ticket-card__stock">
                    <div className="ticket-card__bar"><span style={{ width: `${ticket.sold_pct}%` }} /></div>
                    <div className="ticket-card__stock-meta">
                        <strong>{ticket.remaining.toLocaleString()}</strong> seats left
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
                        <strong>{formatMoney(ticket.price, ticket.currency)}</strong>
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
            {code && <img src={`https://flagcdn.com/w80/${code}.png`} alt={name} onError={(e) => { e.target.style.display = 'none'; }} />}
            <span>{name}</span>
        </div>
    );
}

function PurchaseModal({ ticket, onClose }) {
    const { data, setData, post, processing, reset, errors } = useForm({ quantity: 1, paid_with: 'card' });

    const submit = (e) => {
        e.preventDefault();
        post(route('fan.tickets.buy', ticket.id), {
            preserveScroll: true,
            onSuccess: () => { toast.success('Ticket booked — check your e-Ticket'); reset(); onClose(); },
            onError: () => toast.error('Could not complete your booking'),
        });
    };

    if (!ticket) return null;
    const total = (Number(data.quantity) || 0) * Number(ticket.price);

    return (
        <TfeModal open={!!ticket} title="Confirm your ticket" onClose={onClose}>
            <form onSubmit={submit} className="tfe-form-field">
                <div className="ticket-modal__summary">
                    <div className="ticket-modal__match">{ticket.home_team} <span>vs</span> {ticket.away_team}</div>
                    <div className="ticket-modal__venue">{ticket.venue_name} · {KICK(ticket.kickoff_at)}</div>
                </div>

                <label className="tfe-form-label" htmlFor="qty">Quantity (max 10)</label>
                <input
                    id="qty" type="number" min="1" max={Math.min(10, ticket.remaining)}
                    className="tfe-input"
                    value={data.quantity}
                    onChange={(e) => setData('quantity', Number(e.target.value))}
                />
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

                <div className="ticket-modal__actions">
                    <button type="button" className="tfe-btn" onClick={onClose}>Cancel</button>
                    <button type="submit" disabled={processing} className="tfe-btn tfe-btn--filled">
                        <i className="fas fa-lock"></i> Pay {formatMoney(total, ticket.currency)}
                    </button>
                </div>

                <p className="ticket-modal__disclaimer">Demo purchase — no real card is charged. Reference is generated on confirm.</p>
            </form>
        </TfeModal>
    );
}
