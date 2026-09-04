import React from 'react';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { Link, usePage } from '@inertiajs/react';
import DashboardHero from '@/Components/Common/DashboardHero';
import { formatMoney } from '@/lib/utils';
import { useTournament } from '@/Context/TournamentContext';

export default function Dashboard({ requests, stats }) {
    const { auth } = usePage().props;
    const { tournament } = useTournament();
    const tournamentLabel = tournament ? (tournament.short_name || tournament.name) : 'tournament';

    const statusClass = (status) =>
        `partner-status-${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'pending'}`;

    const badgeClass = (status) =>
        `partner-badge partner-badge-${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'pending'}`;

    return (
        <PartnerLayout title="Partner Dashboard">
            <div className="">
                <DashboardHero
                    role="partner"
                    title={`Welcome, ${auth.user.name.split(' ')[0]}!`}
                    subtitle={`Manage travel requests and help fans plan their ${tournamentLabel} journey.`}
                />

                {/* Summary Cards */}
                <div className="partner-summary-cards">
                    <div className="partner-stat-card" data-accent="amber">
                        <div className="stat-icon">
                            <i className="fas fa-inbox"></i>
                        </div>
                        <div className="stat-value">{stats?.pending || 0}</div>
                        <div className="stat-label">Pending Requests</div>
                        <div className="stat-change neutral">
                            <i className="fas fa-clock"></i> Awaiting Review
                        </div>
                    </div>

                    <div className="partner-stat-card" data-accent="green">
                        <div className="stat-icon">
                            <i className="fas fa-check-circle"></i>
                        </div>
                        <div className="stat-value">{stats?.approved || 0}</div>
                        <div className="stat-label">Approved</div>
                        <div className="stat-change positive">
                            <i className="fas fa-arrow-up"></i> This Month
                        </div>
                    </div>

                    <div className="partner-stat-card" data-accent="blue">
                        <div className="stat-icon">
                            <i className="fas fa-edit"></i>
                        </div>
                        <div className="stat-value">{stats?.modified || 0}</div>
                        <div className="stat-label">Modified</div>
                        <div className="stat-change neutral">
                            <i className="fas fa-sync-alt"></i> Updated Quotes
                        </div>
                    </div>

                    <div className="partner-stat-card" data-accent="red">
                        <div className="stat-icon">
                            <i className="fas fa-times-circle"></i>
                        </div>
                        <div className="stat-value">{stats?.rejected || 0}</div>
                        <div className="stat-label">Rejected</div>
                        <div className="stat-change neutral">
                            <i className="fas fa-ban"></i> Declined
                        </div>
                    </div>

                    <div className="partner-stat-card" data-accent="purple">
                        <div className="stat-icon">
                            <i className="fas fa-coins"></i>
                        </div>
                        <div className="stat-value">{formatMoney(stats?.total_revenue || 0)}</div>
                        <div className="stat-label">Total Revenue</div>
                        <div className="stat-change positive">
                            <i className="fas fa-chart-line"></i> All Time
                        </div>
                    </div>
                </div>

                {/* Content Cards Grid */}
                <div className="content-cards-grid mt-4">
                    {/* Quick Actions */}
                    <div className="content-card quick-actions-card">
                        <div className="card-header">
                            <i className="fas fa-bolt" style={{ color: '#d97706' }}></i>
                            <h3>Quick Actions</h3>
                        </div>
                        <div className="quick-actions-grid">
                            <Link href={route('partner.requests')} className="quick-action-btn partner-quick-action-amber">
                                <i className="fas fa-inbox"></i>
                                <span>All Requests</span>
                            </Link>
                            <Link href={route('partner.messages')} className="quick-action-btn partner-quick-action-blue">
                                <i className="fas fa-envelope"></i>
                                <span>Messages</span>
                            </Link>
                            <Link href={route('partner.profile')} className="quick-action-btn partner-quick-action-purple">
                                <i className="fas fa-user-edit"></i>
                                <span>Edit Profile</span>
                            </Link>
                        </div>
                    </div>

                    {/* Recent Requests List */}
                    <div className="content-card activity-card partner-activity-span-2">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                                <i className="fas fa-list partner-activity-header-icon"></i>
                                <h3>Recent Travel Requests</h3>
                            </div>
                            <Link href={route('partner.requests')} className="text-yellow-500 text-sm hover:underline">
                                View All Requests →
                            </Link>
                        </div>
                        <div className="activity-list">
                            {requests && requests.length > 0 ? (
                                requests.slice(0, 5).map(req => (
                                    <div key={req.id} className={`activity-item ${statusClass(req.status)}`}>
                                        <div className="activity-icon">
                                            <i className="fas fa-suitcase"></i>
                                        </div>
                                        <div className="activity-info">
                                            <div className="activity-title">{req.reference_id}</div>
                                            <div className="activity-label">{req.match_count} Matches • {req.accommodation_level}</div>
                                        </div>
                                        <div className="activity-details text-end">
                                            <div className="partner-activity-amount">
                                                {req.partner_cost ? formatMoney(req.partner_cost) : formatMoney(req.total_cost)}
                                            </div>
                                            <div className="partner-activity-meta">
                                                <span className={badgeClass(req.status)}>
                                                    {req.status}
                                                </span>
                                                <Link href={route('partner.requests.show', req.id)} className="text-yellow-500 text-sm hover:underline">
                                                    Review →
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <i className="fas fa-inbox"></i>
                                    <h4>No Requests Yet</h4>
                                    <p>Travel requests from fans will appear here.</p>
                                </div>
                            )}
                        </div>
                        {requests && requests.length > 5 && (
                            <Link href={route('partner.requests')} className="view-all-btn">View All Requests</Link>
                        )}
                    </div>
                </div>
            </div>
        </PartnerLayout>
    );
}
