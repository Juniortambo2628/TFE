import React from 'react';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { Link, usePage } from '@inertiajs/react';
import DashboardHero from '@/Components/Common/DashboardHero';
import { formatMoney } from '@/lib/utils';

export default function Dashboard({ requests, stats }) {
    const { auth } = usePage().props;

    return (
        <PartnerLayout title="Partner Dashboard">
            <div className="">
                <DashboardHero
                    role="partner"
                    title={`Welcome, ${auth.user.name.split(' ')[0]}!`}
                    subtitle="Manage travel requests and help fans plan their World Cup 2026 journey."
                />

                {/* Summary Cards */}
                <div className="partner-summary-cards">
                    <div className="partner-stat-card" style={{ '--card-accent': '#d97706' }}>
                        <div className="stat-icon">
                            <i className="fas fa-inbox"></i>
                        </div>
                        <div className="stat-value">{stats?.pending || 0}</div>
                        <div className="stat-label">Pending Requests</div>
                        <div className="stat-change neutral">
                            <i className="fas fa-clock"></i> Awaiting Review
                        </div>
                    </div>

                    <div className="partner-stat-card" style={{ '--card-accent': '#10b981' }}>
                        <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                            <i className="fas fa-check-circle"></i>
                        </div>
                        <div className="stat-value">{stats?.approved || 0}</div>
                        <div className="stat-label">Approved</div>
                        <div className="stat-change positive">
                            <i className="fas fa-arrow-up"></i> This Month
                        </div>
                    </div>

                    <div className="partner-stat-card" style={{ '--card-accent': '#3b82f6' }}>
                        <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                            <i className="fas fa-edit"></i>
                        </div>
                        <div className="stat-value">{stats?.modified || 0}</div>
                        <div className="stat-label">Modified</div>
                        <div className="stat-change neutral">
                            <i className="fas fa-sync-alt"></i> Updated Quotes
                        </div>
                    </div>

                    <div className="partner-stat-card" style={{ '--card-accent': '#ef4444' }}>
                        <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                            <i className="fas fa-times-circle"></i>
                        </div>
                        <div className="stat-value">{stats?.rejected || 0}</div>
                        <div className="stat-label">Rejected</div>
                        <div className="stat-change neutral">
                            <i className="fas fa-ban"></i> Declined
                        </div>
                    </div>

                    <div className="partner-stat-card" style={{ '--card-accent': '#8b5cf6' }}>
                        <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
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
                            <Link href={route('partner.requests')} className="quick-action-btn" style={{ borderColor: '#d97706' }}>
                                <i className="fas fa-inbox" style={{ color: '#d97706' }}></i>
                                <span>All Requests</span>
                            </Link>
                            <Link href={route('partner.messages')} className="quick-action-btn" style={{ borderColor: '#3b82f6' }}>
                                <i className="fas fa-envelope" style={{ color: '#3b82f6' }}></i>
                                <span>Messages</span>
                            </Link>
                            <Link href={route('partner.profile')} className="quick-action-btn" style={{ borderColor: '#8b5cf6' }}>
                                <i className="fas fa-user-edit" style={{ color: '#8b5cf6' }}></i>
                                <span>Edit Profile</span>
                            </Link>
                        </div>
                    </div>

                    {/* Recent Requests List */}
                    <div className="content-card activity-card" style={{ gridColumn: 'span 2' }}>
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                                <i className="fas fa-list" style={{ color: '#d97706', marginRight: '10px' }}></i>
                                <h3>Recent Travel Requests</h3>
                            </div>
                            <Link href={route('partner.requests')} className="text-yellow-500 text-sm hover:underline">
                                View All Requests →
                            </Link>
                        </div>
                        <div className="activity-list">
                            {requests && requests.length > 0 ? (
                                requests.slice(0, 5).map(req => (
                                    <div key={req.id} className="activity-item">
                                        <div className="activity-icon" style={{
                                            background: req.status === 'approved' ? 'rgba(16, 185, 129, 0.2)' :
                                                       req.status === 'rejected' ? 'rgba(239, 68, 68, 0.2)' :
                                                       'rgba(217, 119, 6, 0.2)'
                                        }}>
                                            <i className="fas fa-suitcase" style={{
                                                color: req.status === 'approved' ? '#10b981' :
                                                       req.status === 'rejected' ? '#ef4444' :
                                                       '#d97706'
                                            }}></i>
                                        </div>
                                        <div className="activity-info">
                                            <div className="activity-title">{req.reference_id}</div>
                                            <div className="activity-label">{req.match_count} Matches • {req.accommodation_level}</div>
                                        </div>
                                        <div className="activity-details text-end">
                                            <div className="activity-amount" style={{ color: '#fff', fontWeight: '600' }}>
                                                {req.partner_cost ? formatMoney(req.partner_cost) : formatMoney(req.total_cost)}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
                                                <span className="badge" style={{
                                                    fontSize: '0.65rem',
                                                    background: req.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' :
                                                               req.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' :
                                                               'rgba(217, 119, 6, 0.1)',
                                                    color: req.status === 'approved' ? '#10b981' :
                                                           req.status === 'rejected' ? '#ef4444' :
                                                           '#d97706'
                                                }}>
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
