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
 *
 * Sprint 56 gave it the same pass as the partner dashboard and the three
 * profile pages:
 *
 *  - **The first tile disagreed with the chart under it.** "Registered fans"
 *    read `total_users`, which counts partners and staff too, so the tile
 *    said 8 while the Fans bar six inches below said 2. Fans have their own
 *    count now, and "Active tribes" is just "Tribes" — `tribes` has no
 *    active column to filter on.
 *  - **`userGrowth` was queried on every load and rendered nowhere.** It is
 *    the second chart now, zero-filled so a quiet day reads as zero instead
 *    of being skipped. It replaces a card of static copy about TFE's role,
 *    which the hero subtitle already says.
 *  - **The chart bars were black.** Tremor builds `fill-emerald-500` at
 *    runtime, so Tailwind never emitted it — see the safelists in
 *    tailwind.config.js AND postcss.config.js.
 *  - and the page is on the shared primitives (`tfe-slab` / `tfe-table` /
 *    `tfe-pill` / `tfe-empty` / `tfe-card-grid`) rather than
 *    `admin-card-dark` / `admin-table-dark` / `admin-badge` and a Bootstrap
 *    grid, so it matches the partner dashboard it sits beside in review.
 */
export default function Dashboard({
    stats = {},
    recentUsers = [],
    recentPartners = [],
    usersByRole = [],
    userGrowth = [],
}) {
    const { auth, tournament_list = [] } = usePage().props;

    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Dashboard' },
    ];

    const roleData = (usersByRole && usersByRole.length > 0) ? usersByRole : [
        { Tier: 'Fans', Users: stats?.total_fans || 0 },
        { Tier: 'Partners', Users: stats?.total_partners || 0 },
        { Tier: 'Staff', Users: 0 },
    ];

    const signupsThisWeek = userGrowth.reduce((sum, d) => sum + (d.Signups || 0), 0);

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
                    { label: 'Registered fans', value: stats?.total_fans || 0, icon: 'fa-users', accent: 'blue',
                      subtext: `${stats?.new_fans_today || 0} new today` },
                    { label: 'Verified partners', value: stats?.verified_partners || 0, icon: 'fa-handshake', accent: 'teal',
                      subtext: `${stats?.total_partners || 0} on platform` },
                    { label: 'Active listings', value: stats?.total_listings || 0, icon: 'fa-tags', accent: 'amber',
                      subtext: 'Live across partners' },
                    { label: 'Tribes', value: stats?.total_tribes || 0, icon: 'fa-layer-group', accent: 'red',
                      subtext: 'Fan communities' },
                    { label: 'Feed posts', value: stats?.total_posts || 0, icon: 'fa-comment-alt', accent: 'violet',
                      subtext: 'Across all tribes' },
                ]}
            />

            <div className="tfe-card-grid tfe-card-grid--2 mb-4">
                <section className="tfe-slab">
                    <div className="tfe-slab__header">
                        <h3 className="tfe-slab__title">
                            <i className="fas fa-users me-2" aria-hidden="true" /> Who&apos;s on the platform
                        </h3>
                        <span className="tfe-slab__title-sub">Fans, partners and staff</span>
                    </div>
                    <div className="tfe-slab__body">
                        <div className="tremor-chart-white">
                            <BarChart
                                className="h-64"
                                data={roleData}
                                index="Tier"
                                categories={['Users']}
                                colors={['emerald']}
                                showAnimation
                                showLegend={false}
                                valueFormatter={(n) => Intl.NumberFormat('us').format(n).toString()}
                            />
                        </div>
                    </div>
                </section>

                <section className="tfe-slab">
                    <div className="tfe-slab__header">
                        <h3 className="tfe-slab__title">
                            <i className="fas fa-chart-line me-2" aria-hidden="true" /> New fan sign-ups
                        </h3>
                        <span className="tfe-slab__title-sub">
                            {signupsThisWeek} in the last 7 days
                        </span>
                    </div>
                    <div className="tfe-slab__body">
                        <div className="tremor-chart-white">
                            <BarChart
                                className="h-64"
                                data={userGrowth}
                                index="date"
                                categories={['Signups']}
                                colors={['cyan']}
                                showAnimation
                                showLegend={false}
                                valueFormatter={(n) => Intl.NumberFormat('us').format(n).toString()}
                            />
                        </div>
                        <div className="tfe-form-actions">
                            <Link href={route('admin.analytics')} className="tfe-btn tfe-btn--sm">
                                Open analytics <i className="fas fa-arrow-right" />
                            </Link>
                        </div>
                    </div>
                </section>
            </div>

            {tournament_list.length > 0 && (
                <section className="tfe-slab mb-4">
                    <div className="tfe-slab__header">
                        <h3 className="tfe-slab__title">
                            <i className="fas fa-trophy me-2" aria-hidden="true" /> Tournaments
                        </h3>
                        <Link href={route('admin.tournaments.index')} className="tfe-btn tfe-btn--sm">Manage</Link>
                    </div>
                    <div className="tfe-slab__body">
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
                </section>
            )}

            <section className="tfe-slab mb-4">
                <div className="tfe-slab__header">
                    <h3 className="tfe-slab__title">
                        <i className="fas fa-bolt me-2" aria-hidden="true" /> Quick actions
                    </h3>
                </div>
                <div className="tfe-slab__body tfe-slab__body--flush">
                    <QuickActionsGrid
                        actions={[
                            { id: 'ad-users', label: 'Users', icon: 'fa-users', href: route('admin.users') },
                            { id: 'ad-partners', label: 'Partners', icon: 'fa-handshake', href: route('admin.partners.index') },
                            { id: 'ad-approvals', label: 'Approvals', icon: 'fa-clipboard-check', href: route('admin.listing-approvals.index') },
                            { id: 'ad-content', label: 'Content', icon: 'fa-layer-group', href: route('admin.content') },
                            { id: 'ad-analytics', label: 'Analytics', icon: 'fa-chart-line', href: route('admin.analytics') },
                            { id: 'ad-settings', label: 'Settings', icon: 'fa-cog', href: route('admin.settings') },
                        ]}
                    />
                </div>
            </section>

            <div className="tfe-card-grid tfe-card-grid--2">
                <ActivityTable
                    title="Recent fan sign-ups"
                    icon="fa-user-clock"
                    href={route('admin.users')}
                    rows={recentUsers}
                    emptyIcon="fa-users"
                    emptyLabel="No fans yet"
                    render={(u) => (
                        <>
                            <td>
                                <div className="admin-activity-row">
                                    <span className="admin-activity-row__glyph">{u.name?.charAt(0) || 'U'}</span>
                                    <span>
                                        <strong className="d-block text-white">{u.name}</strong>
                                        <small className="text-white-50">{u.email}</small>
                                    </span>
                                </div>
                            </td>
                            <td className="text-end"><small className="text-white-50">{u.created_at}</small></td>
                        </>
                    )}
                />

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
                                <Link href={`/partners/${p.slug}`} className="text-white fw-semibold text-decoration-none">
                                    {p.name}
                                </Link>
                                <div><small className="text-white-50">{(p.partner_type || '').replace('_', ' ')}</small></div>
                            </td>
                            <td>
                                <span className={`tfe-pill ${p.verified ? 'tfe-pill--approved' : 'tfe-pill--pending'}`}>
                                    {p.verified ? 'Verified' : 'Unverified'}
                                </span>
                            </td>
                            <td className="text-end"><small className="text-white-50">{p.created_at}</small></td>
                        </>
                    )}
                />
            </div>
        </AdminLayout>
    );
}

function ActivityTable({ title, icon, href, rows = [], render, emptyIcon, emptyLabel }) {
    return (
        <section className="tfe-slab">
            <div className="tfe-slab__header">
                <h3 className="tfe-slab__title">
                    <i className={`fas ${icon} me-2`} aria-hidden="true" /> {title}
                </h3>
                <Link href={href} className="tfe-btn tfe-btn--sm">View all</Link>
            </div>
            <div className="tfe-slab__body tfe-slab__body--flush">
                {rows && rows.length > 0 ? (
                    <div className="table-responsive">
                        <table className="tfe-table tfe-table--compact">
                            <tbody>
                                {rows.slice(0, 5).map((row, i) => <tr key={row.id ?? i}>{render(row)}</tr>)}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="tfe-empty tfe-empty--inline">
                        <div className="tfe-empty__icon"><i className={`fas ${emptyIcon}`} /></div>
                        <div className="tfe-empty__body">{emptyLabel}</div>
                    </div>
                )}
            </div>
        </section>
    );
}
