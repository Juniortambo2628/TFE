import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import SummaryTiles from '@/Components/Common/SummaryTiles';
import QuickActionsGrid from '@/Components/Common/QuickActionsGrid';
import AccentCard from '@/Components/Common/AccentCard';
import { AreaChart, BarChart } from '@tremor/react';
import { Link, usePage } from '@inertiajs/react';
import { formatMoney } from '@/lib/utils';
import '../../../css/admin-dashboard.css';

// Per-tournament accent so each reused tournament card's trophy wash feels
// on-brand — mirrors the landing TournamentCompare mapping.
const ACCENT_BY_ID = { wc_2026: '#d4af37', euro_2024: '#3b82f6', afcon_2027: '#16a34a' };
const shortDate = (iso) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }); } catch { return iso; }
};

export default function Dashboard({ stats = {}, recentUsers = [], recentTransactions = [], revenueGrowth = [], usersByRole = [] }) {
    const { auth, assetUrl, tournament_list = [] } = usePage().props;
    const baseUrl = assetUrl || '';
    const [period, setPeriod] = useState('Month');

    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Dashboard' },
    ];

    const chartData = (revenueGrowth && revenueGrowth.length > 0) ? revenueGrowth : [
        { Month: 'Jan', Revenue: 0, Previous: 0 }, { Month: 'Feb', Revenue: 0, Previous: 0 },
        { Month: 'Mar', Revenue: 0, Previous: 0 }, { Month: 'Apr', Revenue: 0, Previous: 0 },
        { Month: 'May', Revenue: 0, Previous: 0 }, { Month: 'Jun', Revenue: 0, Previous: 0 },
    ];
    const userData = (usersByRole && usersByRole.length > 0) ? usersByRole : [
        { Tier: 'Fan', Users: stats?.total_users || 0 }, { Tier: 'Admin', Users: 1 },
    ];

    // Growth delta between the last two revenue points (drives the big % chip).
    const last = chartData[chartData.length - 1]?.Revenue || 0;
    const prev = chartData[chartData.length - 2]?.Revenue || 0;
    const growthPct = prev > 0 ? (((last - prev) / prev) * 100) : (last > 0 ? 100 : 0);

    return (
        <AdminLayout title="Admin Dashboard">
            <DashboardHero
                role="admin"
                title={`Welcome back, ${auth.user?.name?.split(' ')[0] || 'Admin'}!`}
                subtitle="System overview and management console."
                breadcrumbs={breadcrumbs}
            />

            <SummaryTiles
                className="mb-4"
                items={[
                    { label: 'Total Users',   value: stats?.total_users || 0,               icon: 'fa-users',     accent: 'blue', subtext: 'Registered accounts' },
                    { label: 'Total Revenue', value: formatMoney(stats?.total_revenue || 0), icon: 'fa-coins',     accent: 'red',  subtext: 'Paystack transactions' },
                    { label: 'Active Tribes', value: stats?.active_tribes || 0,             icon: 'fa-handshake', accent: 'teal', subtext: 'Communities in use' },
                ]}
            />

            {/* ── Hero row: Overview chart + Balance/CTA panel ──────────────── */}
            <div className="row g-4 mb-4">
                <div className="col-lg-8">
                    <div className="admin-card-dark admin-overview">
                        <div className="admin-overview__head">
                            <div>
                                <h3 className="admin-overview__title">Revenue Overview</h3>
                                <p className="admin-overview__sub">Monthly revenue from Paystack transactions</p>
                            </div>
                            <div className="admin-seg">
                                {['24h', 'Week', 'Month'].map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        className={`admin-seg__btn${period === p ? ' is-active' : ''}`}
                                        onClick={() => setPeriod(p)}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="admin-overview__figure">
                            <span className="admin-overview__value">{formatMoney(stats?.total_revenue || 0)}</span>
                            <span className={`admin-delta ${growthPct >= 0 ? 'is-up' : 'is-down'}`}>
                                <i className={`fas fa-arrow-${growthPct >= 0 ? 'up' : 'down'}`} />
                                {Math.abs(growthPct).toFixed(1)}%
                            </span>
                        </div>
                        <div className="tremor-chart-white">
                            <AreaChart
                                className="h-64 mt-2"
                                data={chartData}
                                index="Month"
                                categories={['Revenue', 'Previous']}
                                colors={['cyan', 'rose']}
                                valueFormatter={(n) => formatMoney(n)}
                                yAxisWidth={72}
                                showAnimation
                                curveType="monotone"
                                showLegend={false}
                            />
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="admin-balance">
                        <span className="admin-balance__eyebrow">Total platform revenue</span>
                        <span className="admin-balance__value">{formatMoney(stats?.total_revenue || 0)}</span>
                        <span className="admin-balance__delta">
                            <i className={`fas fa-arrow-${growthPct >= 0 ? 'up' : 'down'}`} /> {Math.abs(growthPct).toFixed(1)}% vs last period
                        </span>
                        <div className="admin-balance__mini tremor-chart-white">
                            <BarChart
                                className="h-28"
                                data={userData}
                                index="Tier"
                                categories={['Users']}
                                colors={['emerald']}
                                showAnimation
                                showLegend={false}
                                showYAxis={false}
                                valueFormatter={(n) => Intl.NumberFormat('us').format(n).toString()}
                            />
                        </div>
                        <Link href={route('admin.analytics')} className="tfe-btn tfe-btn--filled admin-balance__cta">
                            Open analytics <i className="fas fa-arrow-right" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Featured tournaments — reuses the AccentCard tournament card ── */}
            {tournament_list.length > 0 && (
                <div className="admin-card-dark mb-4">
                    <div className="card-header">
                        <h3><i className="fas fa-trophy"></i> Tournaments</h3>
                        <Link href={route('admin.settings')} className="btn-admin-outline btn-admin-sm">Manage</Link>
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
                                        href={`/tournaments/${t.slug || t.id}`}
                                        accent={ACCENT_BY_ID[t.id] || '#dc143c'}
                                        artwork={t.trophy_image ? { src: baseUrl + t.trophy_image } : undefined}
                                        status={t.status}
                                        title={t.name}
                                        pills={t.hosts || []}
                                        meta={[
                                            { label: 'Dates', value: `${shortDate(t.start_date)} → ${shortDate(t.end_date)}` },
                                            { label: 'Length', value: days ? `${days} days` : '—' },
                                        ]}
                                        cta={{ label: 'View page', icon: 'fas fa-arrow-right' }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Quick actions ────────────────────────────────────────────── */}
            <div className="admin-card-dark quick-actions-card mb-4">
                <div className="card-header"><h3><i className="fas fa-bolt"></i> Quick Actions</h3></div>
                <QuickActionsGrid
                    actions={[
                        { id: 'ad-users',     label: 'Users',     icon: 'fa-users',           href: route('admin.users') },
                        { id: 'ad-partners',  label: 'Partners',  icon: 'fa-handshake',       href: route('admin.partners.index') },
                        { id: 'ad-approvals', label: 'Approvals', icon: 'fa-clipboard-check', href: route('admin.listing-approvals.index') },
                        { id: 'ad-payments',  label: 'Payments',  icon: 'fa-credit-card',     href: route('admin.payments') },
                        { id: 'ad-analytics', label: 'Analytics', icon: 'fa-chart-line',      href: route('admin.analytics') },
                        { id: 'ad-settings',  label: 'Settings',  icon: 'fa-cog',             href: route('admin.settings') },
                    ]}
                />
            </div>

            {/* ── Activity tables — the "popular campaigns" equivalent ──────── */}
            <div className="row g-4">
                <div className="col-lg-6">
                    <ActivityTable
                        title="Recent Registrations"
                        icon="fa-user-clock"
                        href={route('admin.users')}
                        rows={recentUsers}
                        emptyIcon="fa-users"
                        emptyLabel="No users yet"
                        render={(u) => (
                            <>
                                <td>
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="dash-avatar dash-avatar-md admin-avatar-chip">
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
                        title="Recent Payments"
                        icon="fa-receipt"
                        href={route('admin.payments')}
                        rows={recentTransactions}
                        emptyIcon="fa-credit-card"
                        emptyLabel="No payments yet"
                        render={(t) => (
                            <>
                                <td>
                                    <div className="fw-semibold text-white">{t.user}</div>
                                    <small className="text-white opacity-75">{t.method}</small>
                                </td>
                                <td>
                                    <span className={`admin-badge admin-badge-${t.status === 'completed' ? 'green' : t.status === 'pending' ? 'amber' : 'red'}`}>
                                        {t.status}
                                    </span>
                                </td>
                                <td className="text-end"><div className="fw-bold admin-amount-pos">{formatMoney(t.amount)}</div></td>
                            </>
                        )}
                    />
                </div>
            </div>
        </AdminLayout>
    );
}

// One table shell for both activity panels — same header + empty-state chrome.
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
