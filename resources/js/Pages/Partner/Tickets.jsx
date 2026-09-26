import React from 'react';
import { Head } from '@inertiajs/react';
import PartnerLayout from '@/Layouts/PartnerLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import ListingGrid from '@/Components/Common/ListingGrid';
import { formatMoney } from '@/lib/utils';
import '../../../css/tickets.css';

const KICK = (s) => new Date(s).toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
});

export default function PartnerTickets({ auth, tickets = [], stats = {} }) {
    const tiles = [
        { key: 'seats_sold', label: 'Seats sold', value: stats.seats_sold ?? 0, icon: 'fas fa-ticket-alt', variant: 'violet' },
        { key: 'orders', label: 'Orders', value: stats.orders ?? 0, icon: 'fas fa-receipt', variant: 'blue' },
        { key: 'revenue', label: 'Revenue', value: formatMoney(stats.revenue ?? 0), icon: 'fas fa-coins', variant: 'graph' },
        { key: 'sellthrough', label: 'Avg sell-through', value: `${stats.sellthrough ?? 0}%`, icon: 'fas fa-chart-line', variant: 'amber' },
    ];

    return (
        <PartnerLayout user={auth.user}>
            <Head title="Ticket inventory" />
            <DashboardHero
                role="partner"
                title="Ticket inventory"
                subtitle="Every fixture on sale — capacity, seats moved, revenue."
                breadcrumbs={[{ label: 'Dashboard', href: route('partner.dashboard') }, { label: 'Tickets' }]}
            />

            <div className="tfe-stat-grid">
                {tiles.map((t) => (
                    <div key={t.key} className={`tfe-tile tfe-tile--${t.variant}`}>
                        <div className="tfe-tile__head">
                            <div className="tfe-tile__icon"><i className={t.icon}></i></div>
                        </div>
                        <p className="tfe-tile__value">{t.value}</p>
                        <p className="tfe-tile__label">{t.label}</p>
                    </div>
                ))}
            </div>

            <div className="tfe-slab__header" style={{ marginTop: 12 }}>
                <div>
                    <h2 className="tfe-slab__title">Fixtures on sale</h2>
                    <p className="tfe-slab__title-sub">Live capacity + sell-through per match.</p>
                </div>
            </div>

            <ListingGrid
                items={tickets}
                emptyIcon="fas fa-ticket-alt"
                emptyTitle="No fixtures on sale"
                tableView={(
                    <div className="tfe-slab">
                        <div className="tfe-slab__body tfe-slab__body--flush">
                            <div className="table-responsive">
                                <table className="tfe-table tfe-table--compact">
                                    <thead>
                                        <tr>
                                            <th>Fixture</th><th>Kick-off</th><th>Venue</th><th>Price</th>
                                            <th>Capacity</th><th>Sold</th><th>Sell-through</th><th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tickets.map((t) => (
                                            <tr key={t.id}>
                                                <td><strong>{t.home_team} vs {t.away_team}</strong><div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>{t.stage}</div></td>
                                                <td>{KICK(t.kickoff_at)}</td>
                                                <td>{t.venue_name}<div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>{t.venue_city}</div></td>
                                                <td>{formatMoney(t.price, t.currency)}</td>
                                                <td>{t.capacity.toLocaleString()}</td>
                                                <td>{t.sold.toLocaleString()}</td>
                                                <td>
                                                    <div className="ticket-card__bar" style={{ minWidth: 90 }}>
                                                        <span style={{ width: `${t.sold_pct}%` }} />
                                                    </div>
                                                    <div style={{ fontSize: '0.72rem', marginTop: 4 }}>{t.sold_pct}%</div>
                                                </td>
                                                <td><span className={`tfe-pill ${t.is_active ? 'tfe-pill--approved' : 'tfe-pill--rejected'}`}>{t.is_active ? 'On sale' : 'Paused'}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
                render={(t) => (
                    <article className="ticket-card" style={{ '--partner-accent': '#8b5cf6' }}>
                        <div className="ticket-card__cover" style={t.hero_image ? { backgroundImage: `url(/${t.hero_image})` } : undefined}>
                            <span className="tfe-pill tfe-pill--info ticket-card__stage">{t.stage}</span>
                        </div>
                        <div className="ticket-card__body">
                            <div className="ticket-card__matchup">
                                <div className="ticket-card__team"><span>{t.home_team}</span></div>
                                <span className="ticket-card__vs">vs</span>
                                <div className="ticket-card__team"><span>{t.away_team}</span></div>
                            </div>
                            <div className="ticket-card__meta">
                                <div><i className="fas fa-clock"></i> {KICK(t.kickoff_at)}</div>
                                <div><i className="fas fa-map-marker-alt"></i> {t.venue_name}</div>
                                <div className="ticket-card__meta-sub">{t.venue_city} · Capacity {t.venue_capacity?.toLocaleString?.() || '—'}</div>
                            </div>
                            <div className="ticket-card__stock">
                                <div className="ticket-card__bar"><span style={{ width: `${t.sold_pct}%` }} /></div>
                                <div className="ticket-card__stock-meta">
                                    <strong>{t.sold.toLocaleString()}/{t.capacity.toLocaleString()}</strong> sold
                                    <span>{t.sold_pct}%</span>
                                </div>
                            </div>
                            <div className="ticket-card__foot">
                                <div className="ticket-card__price">
                                    <span className="ticket-card__price-label">Price</span>
                                    <strong>{formatMoney(t.price, t.currency)}</strong>
                                </div>
                                <span className={`tfe-pill ${t.is_active ? 'tfe-pill--approved' : 'tfe-pill--rejected'}`}>
                                    {t.is_active ? 'On sale' : 'Paused'}
                                </span>
                            </div>
                        </div>
                    </article>
                )}
            />
        </PartnerLayout>
    );
}
