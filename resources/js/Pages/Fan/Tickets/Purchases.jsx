import React from 'react';
import { Head, Link } from '@inertiajs/react';
import FanLayout from '@/Layouts/FanLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import { formatMoney } from '@/lib/utils';
import '../../../../css/fan/fan-pages.css';
import '../../../../css/tickets.css';

const KICK = (s) => s ? new Date(s).toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
}) : '';

export default function TicketsPurchases({ auth, purchases = [] }) {
    return (
        <FanLayout user={auth.user}>
            <Head title="My tickets" />
            <DashboardHero
                role="fan"
                title="My tickets"
                subtitle="Your e-Tickets and matchday receipts."
                breadcrumbs={[
                    { label: 'Home', href: route('fan.dashboard') },
                    { label: 'Tickets', href: route('fan.tickets.index') },
                    { label: 'My tickets' },
                ]}
            />

            {purchases.length === 0 ? (
                <div className="tfe-empty">
                    <div className="tfe-empty__icon"><i className="fas fa-receipt"></i></div>
                    <h3 className="tfe-empty__title">No tickets yet</h3>
                    <p className="tfe-empty__body">Browse matchday tickets and secure your seat — verified and delivered instantly.</p>
                    <Link href={route('fan.tickets.index')} className="tfe-btn tfe-btn--filled tfe-empty__action">
                        <i className="fas fa-ticket-alt"></i> Browse tickets
                    </Link>
                </div>
            ) : (
                <div className="ticket-wallet">
                    {purchases.map((p) => (
                        <article key={p.id} className="ticket-stub">
                            <div className="ticket-stub__band">
                                <span className="tfe-pill tfe-pill--approved">{p.status}</span>
                                <span className="ticket-stub__ref">Ref {p.reference}</span>
                            </div>
                            <div className="ticket-stub__body">
                                <div className="ticket-stub__match">
                                    {p.ticket?.home_team} <span>vs</span> {p.ticket?.away_team}
                                </div>
                                <div className="ticket-stub__meta">
                                    <div><i className="fas fa-clock"></i> {KICK(p.ticket?.kickoff_at)}</div>
                                    <div><i className="fas fa-map-marker-alt"></i> {p.ticket?.venue_name}, {p.ticket?.venue_city}</div>
                                </div>
                            </div>
                            <div className="ticket-stub__foot">
                                <div>
                                    <span className="ticket-stub__label">Quantity</span>
                                    <strong>{p.quantity}</strong>
                                </div>
                                <div>
                                    <span className="ticket-stub__label">Total</span>
                                    <strong>{formatMoney(p.total, p.currency)}</strong>
                                </div>
                                <div>
                                    <span className="ticket-stub__label">Paid with</span>
                                    <strong>{(p.paid_with || 'card').replace('_', ' ')}</strong>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </FanLayout>
    );
}
