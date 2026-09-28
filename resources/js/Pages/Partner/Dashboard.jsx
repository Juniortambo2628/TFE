import React from 'react';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { Link, usePage } from '@inertiajs/react';
import DashboardHero from '@/Components/Common/DashboardHero';
import SummaryTiles from '@/Components/Common/SummaryTiles';
import QuickActionsGrid from '@/Components/Common/QuickActionsGrid';
import { formatMoney } from '@/lib/utils';
import { useTournament } from '@/Context/TournamentContext';
import MinorsBadge from '@/Components/Common/MinorsBadge';

/**
 * Partner dashboard. Rebuilt on the shared primitives (`tfe-slab` /
 * `tfe-table` / `tfe-pill` / `tfe-empty` + `tfe-split-grid`) so it matches
 * the Profile and the rest of the partner surfaces, instead of the bespoke
 * `content-card` / `activity-*` / `empty-state` chrome it used to carry.
 */
const STATUS_PILL = {
    approved: 'tfe-pill--approved',
    modified: 'tfe-pill--pending',
    pending: 'tfe-pill--info',
    rejected: 'tfe-pill--rejected',
};

export default function Dashboard({ requests, stats, variant = 'travel', hasListings = true }) {
    const { auth } = usePage().props;
    const { tournament } = useTournament();
    const tournamentLabel = tournament ? (tournament.short_name || tournament.name) : 'tournament';
    const isFinance = variant === 'finance';
    const isTicketing = variant === 'ticketing';
    const recent = (requests || []).slice(0, 8);

    return (
        <PartnerLayout title="Partner Dashboard">
            <DashboardHero
                role="partner"
                title={`Welcome, ${auth.user.name.split(' ')[0]}!`}
                subtitle={isFinance
                    ? 'Review loan applications routed to your desk and disburse trip financing.'
                    : isTicketing
                        ? `Track seats sold and keep your ${tournamentLabel} inventory live for fans.`
                        : `Manage travel requests and help fans plan their ${tournamentLabel} journey.`}
                breadcrumbs={[{ label: 'Dashboard' }]}
            />

            <SummaryTiles
                className="mb-4"
                items={isTicketing ? [
                    { label: 'Seats sold',  value: stats?.seats_sold || 0, icon: 'fa-ticket-alt',    accent: 'blue',
                      subtext: 'Across all fixtures' },
                    { label: 'Orders',      value: stats?.orders || 0,     icon: 'fa-receipt',       accent: 'violet',
                      subtext: 'Fan purchases' },
                    { label: 'Fixtures on sale', value: stats?.listings || 0, icon: 'fa-calendar-check', accent: 'amber',
                      subtext: 'Listed by you' },
                    { label: 'Sell-through', value: `${stats?.sellthrough || 0}%`, icon: 'fa-chart-pie', accent: 'cyan',
                      subtext: 'Of listed capacity' },
                    { label: 'Total Revenue', value: formatMoney(stats?.total_revenue || 0), icon: 'fa-coins', accent: 'teal',
                      subtext: 'From paid orders' },
                ] : [
                    { label: isFinance ? 'Pending Applications' : 'Pending Requests',
                      value: stats?.pending || 0,  icon: 'fa-inbox',        accent: 'amber',
                      subtext: isFinance ? 'Awaiting underwriting' : 'Awaiting review' },
                    { label: 'Approved',
                      value: stats?.approved || 0, icon: 'fa-check-circle', accent: 'blue',
                      subtext: isFinance ? 'Ready to disburse' : 'This month' },
                    !isFinance && { label: 'Modified',
                      value: stats?.modified || 0, icon: 'fa-edit',         accent: 'amber',
                      subtext: 'Updated quotes' },
                    { label: 'Rejected',
                      value: stats?.rejected || 0, icon: 'fa-times-circle', accent: 'red',
                      subtext: 'Declined' },
                    { label: isFinance ? 'Total Disbursed' : 'Total Revenue',
                      value: formatMoney(stats?.total_revenue || 0), icon: 'fa-coins', accent: 'teal',
                      subtext: isFinance ? 'Across approved loans' : 'From approved quotes' },
                ]}
            />

            {/* One column (Sprint 56). This was a 2fr/1fr split, which gave
                the quick actions a 276px-wide column — too narrow for two
                tiles side by side, so four shortcuts ran down it in single
                file next to a table that ended after three rows, leaving a
                screenful of empty page between them. */}
            <div className="tfe-editor-stack">
                <section className="tfe-slab">
                    <div className="tfe-slab__header">
                        <h3 className="tfe-slab__title">
                            <i className="fas fa-list me-2" aria-hidden="true" />
                            {isFinance ? 'Recent applications' : isTicketing ? 'Recent ticket sales' : 'Recent travel requests'}
                        </h3>
                        <Link
                            href={isTicketing ? route('partner.tickets.sales') : route('partner.requests')}
                            className="tfe-btn tfe-btn--sm"
                        >
                            View all
                        </Link>
                    </div>
                    <div className="tfe-slab__body tfe-slab__body--flush">
                        {recent.length > 0 ? (
                            <div className="table-responsive">
                                <table className="tfe-table tfe-table--compact">
                                    <thead>
                                        <tr>
                                            <th>Reference</th>
                                            <th>{isFinance ? 'Applicant' : isTicketing ? 'Fixture' : 'Trip'}</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recent.map((req) => (
                                            <RequestRow key={req.id} req={req} isFinance={isFinance} isTicketing={isTicketing} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="tfe-empty tfe-empty--inline">
                                <div className="tfe-empty__icon"><i className="fas fa-inbox" /></div>
                                <h4 className="tfe-empty__title">
                                    {isFinance ? 'No applications yet' : isTicketing ? 'No sales yet' : 'No requests yet'}
                                </h4>
                                {/* A travel partner's queue is the briefs whose
                                    fan picked one of THEIR listings, so an
                                    empty queue with nothing published is not
                                    the same problem as an empty queue with
                                    five listings live — and only one of them
                                    the partner can do something about. */}
                                <p className="tfe-empty__body">
                                    {isFinance
                                        ? 'Loan applications routed to your desk will appear here.'
                                        : isTicketing
                                        ? (hasListings
                                            ? 'Ticket purchases from fans will appear here.'
                                            : 'List a fixture and fans can buy seats from you.')
                                        : hasListings
                                            ? 'Travel requests from fans who pick one of your listings will appear here.'
                                            : 'Your queue fills with briefs from fans who pick one of your listings — publish one to start receiving them.'}
                                </p>
                                {!isFinance && !hasListings && (
                                    <div className="tfe-empty__action">
                                        {isTicketing ? (
                                            <Link href={route('partner.tickets.index')} className="tfe-btn tfe-btn--sm tfe-btn--filled">
                                                <i className="fas fa-ticket-alt" /> List a fixture
                                            </Link>
                                        ) : (
                                            <Link href={route('partner.listings.index')} className="tfe-btn tfe-btn--sm tfe-btn--filled">
                                                <i className="fas fa-tags" /> Publish a listing
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                <section className="tfe-slab">
                    <div className="tfe-slab__header">
                        <h3 className="tfe-slab__title">
                            <i className="fas fa-bolt me-2" aria-hidden="true" /> Quick actions
                        </h3>
                    </div>
                    <div className="tfe-slab__body">
                        {/* Mirrors Partner/Sidebar's own ticketing branch —
                            a ticketing partner has Tickets and Sales in the
                            sidebar, so sending them to Publish and Convert
                            from here pointed at surfaces that are not theirs. */}
                        <QuickActionsGrid
                            actions={isTicketing ? [
                                { id: 'pa-tickets',  label: 'Tickets',  icon: 'fa-ticket-alt',    href: route('partner.tickets.index') },
                                { id: 'pa-sales',    label: 'Sales',    icon: 'fa-cash-register', href: route('partner.tickets.sales') },
                                { id: 'pa-measure',  label: 'Measure',  icon: 'fa-chart-line',    href: route('partner.analytics') },
                                { id: 'pa-messages', label: 'Messages', icon: 'fa-envelope',      href: route('partner.messages') },
                            ] : [
                                { id: 'pa-publish',   label: 'Publish',   icon: 'fa-tags',        href: route('partner.listings.index') },
                                { id: 'pa-convert',   label: 'Convert',   icon: 'fa-inbox',       href: route('partner.requests') },
                                { id: 'pa-measure',   label: 'Measure',   icon: 'fa-chart-line',  href: route('partner.analytics') },
                                { id: 'pa-messages',  label: 'Messages',  icon: 'fa-envelope',    href: route('partner.messages') },
                            ]}
                        />
                    </div>
                </section>
            </div>
        </PartnerLayout>
    );
}

function RequestRow({ req, isFinance = false, isTicketing = false }) {
    // A ticket purchase has no per-order page, so its reference is plain
    // text rather than a link that 404s.
    const href = isTicketing
        ? null
        : isFinance
            ? route('partner.loans.show', req.id)
            : route('partner.requests.show', req.id);
    const amount = req.partner_cost ? formatMoney(req.partner_cost) : formatMoney(req.total_cost);
    const detail = isFinance
        ? (req.applicant_name || 'Applicant') + ' · ' + (req.purpose || 'Trip financing')
        : isTicketing
            ? `${req.match_label} · ${req.quantity} ${req.quantity === 1 ? 'seat' : 'seats'}`
            : `${req.match_count} matches · ${req.accommodation_level}`;

    return (
        <tr>
            <td>
                {href ? (
                    <Link href={href} className="accent-partner">
                        <strong>{req.reference_id}</strong>
                    </Link>
                ) : (
                    <strong>{req.reference_id}</strong>
                )}
            </td>
            <td>
                {detail}
                {req.school_group?.involves_minors && (
                    <div className="mt-1"><MinorsBadge group={req.school_group} /></div>
                )}
            </td>
            <td><strong>{amount}</strong></td>
            <td>
                <span className={`tfe-pill ${STATUS_PILL[req.status] || 'tfe-pill--info'}`}>{req.status}</span>
            </td>
        </tr>
    );
}
