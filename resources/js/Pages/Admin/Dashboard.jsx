import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import SummaryTiles from '@/Components/Common/SummaryTiles';
import QuickActionsGrid from '@/Components/Common/QuickActionsGrid';
import AccentCard from '@/Components/Common/AccentCard';
import { BarChart } from '@tremor/react';
import { Link, usePage } from '@inertiajs/react';
import '../../../css/admin-dashboard.css';

const ACCENT_BY_ID = { wc_2026: '#d4af37', euro_2024: '#3b82f6', afcon_2027: '#16a34a' };
const shortDate = (iso) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }); } catch { return iso; }
};

/**
 * Admin dashboard — connection metrics only. Money moves on the partner's
 * platform, not ours; every tile here reflects reach on TFE.
 */
export default function Dashboard({ stats = {}, recentUsers = [], recentPartners = [], usersByRole = [] }) {
    const { auth, tournament_list = [] } = usePage().props;

    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Dashboard' },
    ];

    const userData = (usersByRole && usersByRole.length > 0) ? usersByRole : [
        { Tier: 'Fans', Users: stats?.total_users || 0 }, { Tier: 'Partners', Users: 0 }, { Tier: 'Staff', Users: 1 },
    ];

    return (
        <AdminLayout title="Admin Dashboard">
            <DashboardHero
                role="admin"
                title={`Welcome back, ${auth.user?.name?.split(' ')[0] || 'Admin'}!`}
                subtitle="TFE is the connective tissue between fans and partners. Track reach, not transactions."
                breadcrumbs={breadcrumbs}
            />

            <SummaryTiles
                className="mb-4"
                items={[
                    { label: 'Registered fans', value: stats?.total_users || 0, icon: 'fa-users', accent: 'blue', subtext: `${stats?.new_users_today || 0} new today` },
                    { label: 'Verified partners', value: stats?.verified_partners || 0, icon: 'fa-handshake', accent: 'teal', subtext: `${stats?.total_partners || 0} on platform` },
                    { label: 'Active listings', value: stats?.total_listings || 0, icon: 'fa-tags', accent: 'amber', subtext: 'Live across partners' },
                    { label: 'Active tribes', value: stats?.active_tribes || 0, icon: 'fa-layer-group', accent: 'red', subtext: 'Communities in use' },
                ]}
            />

            <div className="row g-4 mb-4">
                <div className="col-lg-8">
                    <div className="admin-card-dark admin-overview">
                        <div className="admin-overview__head">
                            <div>
                                <h3 className="admin-overview__title">Who's on the platform</h3>
                                <p className="admin-overview__sub">Fans and partners we've connected to matchday experiences.</p>
                            </div>
                        </div>
                        <div className="tremor-chart-white">
                            <BarChart
                                className="h-64 mt-2"
                                data={userData}
                                index="Tier"
                                categories={['Users']}
                                colors={['emerald']}
                                showAnimation
                                showLegend={false}
                                valueFormatter={(n) => Intl.NumberFormat('us').format(n).toString()}
                            />
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="admin-balance">
                        <span className="admin-balance__eyebrow">Our role</span>
                        <span className="admin-balance__value">The connector</span>
                        <p className="admin-balance__delta" style={{ opacity: 0.8, lineHeight: 1.5 }}>
                            Partners hold the license, the compliance, and the ledger. TFE holds the fan.
                            Every transaction, KYC record, and settlement lives on their platform.
                        </p>
                        <Link href={route('admin.analytics')} className="tfe-btn tfe-btn--filled admin-balance__cta">
                            Open analytics <i className="fas fa-arrow-right" />
                        </Link>
                    </div>
                </div>
            </div>

            {tournament_list.length > 0 && (
                <div className="admin-card-dark mb-4">
                    <div className="card-header">
                        <h3><i className="fas fa-trophy"></i> Tournaments</h3>
                        <Link href={route('admin.tournaments.index')} className="tfe-btn tfe-btn--sm">Manage</Link>
                    </div>
                    <div className="admin-tourn-row">
                        {tournament_list.map((t) => {
                            const days = t.start_date && t.end_date
                                ? Math.max(1, Math.round((new Date(t.end_date) - new Date(t.start_date)) / 86400000))
                                : null;
                            return (
                                <div key={t.id} className="admin-tourn-row__item">
                                    <AccentCard
                                        LinkComponent={Link}
                                        href={route('admin.tournaments.edit', t.id)}
                                        accent={ACCENT_BY_ID[t.id] || '#dc143c'}
                                        artwork={t.trophy_image ? { src: t.trophy_image } : undefined}
                                        status={t.status}
                                        title={t.name}
                                        pills={t.hosts || []}
                                        meta={[
                                            { label: 'Dates', value: `${shortDate(t.start_date)} → ${shortDate(t.end_date)}` },
                                            { label: 'Length', value: days ? `${days} days` : '—' },
                                        ]}
                                        cta={{ label: 'Manage', icon: 'fas fa-arrow-right' }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="admin-card-dark quick-actions-card mb-4">
                <div className="card-header"><h3><i className="fas fa-bolt"></i> Quick Actions</h3></div>
                <QuickActionsGrid
                    actions={[
                        { id: 'ad-users',     label: 'Users',     icon: 'fa-users',           href: route('admin.users') },
                        { id: 'ad-partners',  label: 'Partners',  icon: 'fa-handshake',       href: route('admin.partners.index') },
                        { id: 'ad-approvals', label: 'Approvals', icon: 'fa-clipboard-check', href: route('admin.listing-approvals.index') },
                        { id: 'ad-content',   label: 'Content',   icon: 'fa-layer-group',     href: route('admin.content') },
                        { id: 'ad-analytics', label: 'Analytics', icon: 'fa-chart-line',      href: route('admin.analytics') },
                        { id: 'ad-settings',  label: 'Settings',  icon: 'fa-cog',             href: route('admin.settings') },
                    ]}
                />
            </div>

            <div className="row g-4">
                <div className="col-lg-6">
                    <ActivityTable
                        title="Recent registrations"
                        icon="fa-user-clock"
                        href={route('admin.users')}
                        rows={recentUsers}
                        emptyIcon="fa-users"
                        emptyLabel="No users yet"
                        render={(u) => (
                            <>
                                <td>
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="dash-avatar dash-avatar-md" style={{ background: 'var(--admin-primary-light)', color: 'var(--admin-primary)' }}>
                                            {u.name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <div className="fw-semibold text-white">{u.name}</div>
                                            <small className="text-white opacity-75">{u.email}</small>
                                        </div>
                                    </div>
                                </td>
                                <td className="text-end"><small className="text-white opacity-75">{u.created_at}</small></td>
                            </>
                        )}
                    />
                </div>

                <div className="col-lg-6">
                    <ActivityTable
                        title="New partners"
                        icon="fa-handshake"
                        href={route('admin.partners.index')}
                        rows={recentPartners}
                        emptyIcon="fa-handshake"
                        emptyLabel="No partners yet"
                        render={(p) => (
                            <>
                                <td>
                                    <Link href={`/partners/${p.slug}`} className="fw-semibold text-white text-decoration-none">{p.name}</Link>
                                    <div><small className="text-white opacity-75">{(p.partner_type || '').replace('_', ' ')}</small></div>
                                </td>
                                <td>
                                    {p.verified ? (
                                        <span className="admin-badge admin-badge-green">Verified</span>
                                    ) : (
                                        <span className="admin-badge admin-badge-amber">Unverified</span>
                                    )}
                                </td>
                                <td className="text-end"><small className="text-white opacity-75">{p.created_at}</small></td>
                            </>
                        )}
                    />
                </div>
            </div>
        </AdminLayout>
    );
}

function ActivityTable({ title, icon, href, rows = [], render, emptyIcon, emptyLabel }) {
    return (
        <div className="admin-card-dark h-100">
            <div className="card-header">
                <h3><i className={`fas ${icon}`}></i> {title}</h3>
                <Link href={href} className="btn-admin-outline btn-admin-sm">View All</Link>
            </div>
            <div className="card-body p-0">
                {rows && rows.length > 0 ? (
                    <table className="admin-table-dark">
                        <tbody>
                            {rows.slice(0, 5).map((row, i) => <tr key={row.id ?? i}>{render(row)}</tr>)}
                        </tbody>
                    </table>
                ) : (
                    <div className="admin-empty-state">
                        <i className={`fas ${emptyIcon}`}></i>
                        <h4>{emptyLabel}</h4>
                    </div>
                )}
            </div>
        </div>
    );
}
