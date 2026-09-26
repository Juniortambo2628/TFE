import React from 'react';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { Link, usePage } from '@inertiajs/react';
import DashboardHero from '@/Components/Common/DashboardHero';
import SummaryTiles from '@/Components/Common/SummaryTiles';
import QuickActionsGrid from '@/Components/Common/QuickActionsGrid';
import { formatMoney } from '@/lib/utils';
import { useTournament } from '@/Context/TournamentContext';

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

export default function Dashboard({ requests, stats, variant = 'travel' }) {
    const { auth } = usePage().props;
    const { tournament } = useTournament();
    const tournamentLabel = tournament ? (tournament.short_name || tournament.name) : 'tournament';
    const isFinance = variant === 'finance';
    const recent = (requests || []).slice(0, 5);

    return (
        <PartnerLayout title="Partner Dashboard">
            <DashboardHero
                role="partner"
                title={`Welcome, ${auth.user.name.split(' ')[0]}!`}
                subtitle={isFinance
                    ? 'Review loan applications routed to your desk and disburse trip financing.'
                    : `Manage travel requests and help fans plan their ${tournamentLabel} journey.`}
            />

            <SummaryTiles
                className="mb-4"
                items={[
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

            <div className="tfe-split-grid">
                <section className="tfe-slab">
                    <div className="tfe-slab__header">
                        <h3 className="tfe-slab__title">
                            <i className="fas fa-list me-2" aria-hidden="true" />
                            {isFinance ? 'Recent applications' : 'Recent travel requests'}
                        </h3>
                        <Link href={route('partner.requests')} className="tfe-btn tfe-btn--sm">
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
                                            <th>{isFinance ? 'Applicant' : 'Trip'}</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recent.map((req) => (
                                            <RequestRow key={req.id} req={req} isFinance={isFinance} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="tfe-empty tfe-empty--inline">
                                <div className="tfe-empty__icon"><i className="fas fa-inbox" /></div>
                                <h4 className="tfe-empty__title">{isFinance ? 'No applications yet' : 'No requests yet'}</h4>
                                <p className="tfe-empty__body">
                                    {isFinance
                                        ? 'Loan applications from fans will appear here.'
                                        : 'Travel requests from fans will appear here.'}
                                </p>
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
                        <QuickActionsGrid
                            actions={[
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

function RequestRow({ req, isFinance = false }) {
    const href = isFinance
        ? route('partner.loans.show', req.id)
        : route('partner.requests.show', req.id);
    const amount = req.partner_cost ? formatMoney(req.partner_cost) : formatMoney(req.total_cost);
    const detail = isFinance
        ? (req.applicant_name || 'Applicant') + ' · ' + (req.purpose || 'Trip financing')
        : `${req.match_count} matches · ${req.accommodation_level}`;

    return (
        <tr>
            <td>
                <Link href={href} className="accent-partner">
                    <strong>{req.reference_id}</strong>
                </Link>
            </td>
            <td>{detail}</td>
            <td><strong>{amount}</strong></td>
            <td>
                <span className={`tfe-pill ${STATUS_PILL[req.status] || 'tfe-pill--info'}`}>{req.status}</span>
            </td>
        </tr>
    );
}
