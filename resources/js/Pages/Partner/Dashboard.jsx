import React from 'react';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { Link, usePage } from '@inertiajs/react';
import DashboardHero from '@/Components/Common/DashboardHero';
import SummaryTiles from '@/Components/Common/SummaryTiles';
import QuickActionsGrid from '@/Components/Common/QuickActionsGrid';
import { formatMoney } from '@/lib/utils';
import { useTournament } from '@/Context/TournamentContext';

export default function Dashboard({ requests, stats, variant = 'travel' }) {
    const { auth } = usePage().props;
    const { tournament } = useTournament();
    const tournamentLabel = tournament ? (tournament.short_name || tournament.name) : 'tournament';
    const isFinance = variant === 'finance';

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

            <div className="content-cards-grid mt-4">
                <div className="content-card quick-actions-card">
                    <div className="card-header">
                        <h3>Quick Actions</h3>
                    </div>
                    <QuickActionsGrid
                        actions={[
                            { id: 'pa-publish',   label: 'Publish',   icon: 'fa-tags',        href: route('partner.listings.index') },
                            { id: 'pa-convert',   label: 'Convert',   icon: 'fa-inbox',       href: route('partner.requests') },
                            { id: 'pa-measure',   label: 'Measure',   icon: 'fa-chart-line',  href: route('partner.analytics') },
                            { id: 'pa-messages',  label: 'Messages',  icon: 'fa-envelope',    href: route('partner.messages') },
                        ]}
                    />
                </div>

                <div className="content-card activity-card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-2">
                            <i className="fas fa-list"></i>
                            <h3>{isFinance ? 'Recent applications' : 'Recent travel requests'}</h3>
                        </div>
                        <Link href={route('partner.requests')} className="card-header-link">
                            View all →
                        </Link>
                    </div>
                    <div className="activity-list">
                        {requests && requests.length > 0 ? (
                            requests.slice(0, 5).map((req) => (
                                <RequestRow key={req.id} req={req} isFinance={isFinance} />
                            ))
                        ) : (
                            <div className="empty-state">
                                <i className="fas fa-inbox"></i>
                                <h4>{isFinance ? 'No applications yet' : 'No requests yet'}</h4>
                                <p>
                                    {isFinance
                                        ? 'Loan applications from fans will appear here.'
                                        : 'Travel requests from fans will appear here.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PartnerLayout>
    );
}

function RequestRow({ req, isFinance = false }) {
    const href = isFinance
        ? route('partner.loans.show', req.id)
        : route('partner.requests.show', req.id);
    return (
        <Link href={href} className="activity-item">
            <div className="activity-icon">
                <i className={`fas ${isFinance ? 'fa-hand-holding-usd' : 'fa-suitcase'}`}></i>
            </div>
            <div className="activity-info">
                <div className="activity-title">{req.reference_id}</div>
                <div className="activity-label">
                    {isFinance
                        ? (req.applicant_name || 'Applicant') + ' · ' + (req.purpose || 'Trip financing')
                        : `${req.match_count} matches · ${req.accommodation_level}`}
                </div>
            </div>
            <div className="activity-meta">
                <div className="activity-amount">
                    {req.partner_cost ? formatMoney(req.partner_cost) : formatMoney(req.total_cost)}
                </div>
                <span className={`activity-badge activity-badge--${req.status}`}>{req.status}</span>
            </div>
        </Link>
    );
}
