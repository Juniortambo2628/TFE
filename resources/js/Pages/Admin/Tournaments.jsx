import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import ListingGrid from '@/Components/Common/ListingGrid';
import { Link, router, usePage } from '@inertiajs/react';

/**
 * Admin → Tournaments.
 *
 * The index half of the same index → edit pair the partner directory uses.
 * Tournament configuration used to be split between a Site Settings tab and a
 * Content Management tab; this is now the one way in.
 */
export default function Tournaments({ tournaments = [], activeTournament }) {
    const flash = usePage().props.flash || {};
    const [featured, setFeatured] = useState(activeTournament || '');
    const [refreshing, setRefreshing] = useState(false);

    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Tournaments' },
    ];

    const applyFeatured = (id) => {
        setFeatured(id);
        router.post(route('admin.tournaments.feature'), { tournament: id }, { preserveScroll: true });
    };

    const refreshAll = () => {
        setRefreshing(true);
        router.post(route('admin.tournaments.refresh'), {}, {
            preserveScroll: true,
            onFinish: () => setRefreshing(false),
        });
    };

    return (
        <AdminLayout title="Tournaments">
            <DashboardHero
                role="admin"
                title="Tournaments"
                subtitle="Featured pick, branding, imagery and venues — one page per tournament."
                breadcrumbs={breadcrumbs}
            />

            <section className="tfe-slab mb-4">
                <div className="tfe-slab__header">
                    <div>
                        <h2 className="tfe-slab__title">Featured tournament</h2>
                        <p className="tfe-slab__title-sub">
                            The default across the site when a visitor hasn't picked one.
                        </p>
                    </div>
                </div>
                <div className="tfe-slab__body">
                    <div className="admin-tournament-toolbar">
                        <div className="tfe-form-field">
                            <label className="tfe-form-label" htmlFor="featured-tournament">Featured</label>
                            <select
                                id="featured-tournament"
                                className="tfe-select"
                                value={featured}
                                onChange={(e) => applyFeatured(e.target.value)}
                            >
                                {tournaments.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name} ({t.status})</option>
                                ))}
                            </select>
                            <p className="tfe-form-help">
                                Visitors can still override with <code>?tournament=slug</code> or the header switcher.
                            </p>
                        </div>

                        <div className="tfe-form-field">
                            <label className="tfe-form-label">Wikipedia data</label>
                            <button
                                type="button"
                                className="tfe-btn tfe-btn--filled"
                                disabled={refreshing}
                                onClick={refreshAll}
                            >
                                <i className={refreshing ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'} />{' '}
                                {refreshing ? 'Refreshing…' : 'Refresh All'}
                            </button>
                            <p className="tfe-form-help">
                                Re-pulls venues, teams and key facts. Can take 30–60s for Wikipedia's rate limit.
                            </p>
                        </div>
                    </div>

                    {flash.tournament_refresh_output && (
                        <pre className="admin-refresh-output">{flash.tournament_refresh_output}</pre>
                    )}
                </div>
            </section>

            <ListingGrid
                items={tournaments}
                LinkComponent={Link}
                emptyIcon="fas fa-trophy"
                emptyTitle="No tournaments configured"
                emptyBody="Tournaments are declared in config/tournaments.php."
                to={(t) => ({
                    href: route('admin.tournaments.edit', t.id),
                    title: t.name,
                    eyebrow: t.short_name || t.id,
                    desc: t.tagline,
                    accent: t.accent,
                    status: t.status,
                    artwork: t.trophy_image
                        ? { src: t.trophy_image, alt: '', variant: 'float' }
                        : { icon: 'fas fa-trophy' },
                    bgImage: t.organizer_card_bg || undefined,
                    pills: [
                        ...(t.id === featured ? ['Featured'] : []),
                        ...(t.hosts || []).slice(0, 3),
                    ],
                    meta: [
                        { label: 'Venues', value: `${t.venue_count}${t.has_catalogue ? ' · catalogued' : ''}` },
                        { label: 'Overrides', value: t.override_count > 0 ? `${t.override_count} set` : 'None' },
                    ],
                    cta: { label: 'Manage', icon: 'fas fa-arrow-right' },
                })}
                tableView={
                    <table className="tfe-table">
                        <thead>
                            <tr>
                                <th>Tournament</th>
                                <th>Status</th>
                                <th>Hosts</th>
                                <th>Venues</th>
                                <th>Overrides</th>
                                <th style={{ width: 110 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tournaments.map((t) => (
                                <tr key={t.id}>
                                    <td className="fw-semibold">
                                        {t.name}
                                        {t.id === featured && (
                                            <span className="tfe-pill tfe-pill--approved ms-2">Featured</span>
                                        )}
                                    </td>
                                    <td><span className="tfe-pill tfe-pill--concluded">{t.status}</span></td>
                                    <td>{(t.hosts || []).join(', ') || '—'}</td>
                                    <td>{t.venue_count}</td>
                                    <td>{t.override_count || '—'}</td>
                                    <td>
                                        <Link
                                            href={route('admin.tournaments.edit', t.id)}
                                            className="tfe-btn tfe-btn--sm"
                                        >
                                            Manage
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                }
            />
        </AdminLayout>
    );
}
