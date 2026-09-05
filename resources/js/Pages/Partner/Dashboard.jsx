import React from 'react';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { Link, usePage } from '@inertiajs/react';
import DashboardHero from '@/Components/Common/DashboardHero';
import StatCard from '@/Components/Common/StatCard';
import { formatMoney } from '@/lib/utils';
import { useTournament } from '@/Context/TournamentContext';

export default function Dashboard({ requests, stats }) {
    const { auth } = usePage().props;
    const { tournament } = useTournament();
    const tournamentLabel = tournament ? (tournament.short_name || tournament.name) : 'tournament';

    return (
        <PartnerLayout title="Partner Dashboard">
            <DashboardHero
                role="partner"
                title={`Welcome, ${auth.user.name.split(' ')[0]}!`}
                subtitle={`Manage travel requests and help fans plan their ${tournamentLabel} journey.`}
            />

            <div className="summary-cards-grid">
                <StatCard
                    label="Pending Requests"
                    value={stats?.pending || 0}
                    icon="fa-inbox"
                    variant="amber"
                    subtext="Awaiting review"
                />
                <StatCard
                    label="Approved"
                    value={stats?.approved || 0}
                    icon="fa-check-circle"
                    variant="blue"
                    subtext="This month"
                />
                <StatCard
                    label="Modified"
                    value={stats?.modified || 0}
                    icon="fa-edit"
                    variant="amber"
                    subtext="Updated quotes"
                />
                <StatCard
                    label="Rejected"
                    value={stats?.rejected || 0}
                    icon="fa-times-circle"
                    variant="red"
                    subtext="Declined"
                />
                <StatCard
                    label="Total Revenue"
                    value={formatMoney(stats?.total_revenue || 0)}
                    icon="fa-coins"
                    variant="blue"
                    subtext="From approved quotes"
                />
            </div>

            <div className="content-cards-grid mt-4">
                <div className="content-card quick-actions-card">
                    <div className="card-header">
                        <i className="fas fa-bolt"></i>
                        <h3>Quick actions</h3>
                    </div>
                    <div className="quick-actions-grid">
                        <Link href={route('partner.listings.index')} className="quick-action-btn">
                            <i className="fas fa-tags"></i>
                            <span>Publish</span>
                        </Link>
                        <Link href={route('partner.requests')} className="quick-action-btn">
                            <i className="fas fa-inbox"></i>
                            <span>Convert</span>
                        </Link>
                        <Link href={route('partner.analytics')} className="quick-action-btn">
                            <i className="fas fa-chart-line"></i>
                            <span>Measure</span>
                        </Link>
                        <Link href={route('partner.messages')} className="quick-action-btn">
                            <i className="fas fa-envelope"></i>
                            <span>Messages</span>
                        </Link>
                    </div>
                </div>

                <div className="content-card activity-card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-2">
                            <i className="fas fa-list"></i>
                            <h3>Recent travel requests</h3>
                        </div>
                        <Link href={route('partner.requests')} className="card-header-link">
                            View all →
                        </Link>
                    </div>
                    <div className="activity-list">
                        {requests && requests.length > 0 ? (
                            requests.slice(0, 5).map((req) => (
                                <RequestRow key={req.id} req={req} />
                            ))
                        ) : (
                            <div className="empty-state">
                                <i className="fas fa-inbox"></i>
                                <h4>No requests yet</h4>
                                <p>Travel requests from fans will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PartnerLayout>
    );
}

function RequestRow({ req }) {
    return (
        <Link href={route('partner.requests.show', req.id)} className="activity-item">
            <div className="activity-icon">
                <i className="fas fa-suitcase"></i>
            </div>
            <div className="activity-info">
                <div className="activity-title">{req.reference_id}</div>
                <div className="activity-label">
                    {req.match_count} matches · {req.accommodation_level}
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
