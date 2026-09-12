import React from 'react';
import { Link } from '@inertiajs/react';
import PartnerLayout from '@/Layouts/PartnerLayout';
import DashboardHero from '@/Components/Common/DashboardHero';

/**
 * Measure tab — per-partner analytics dashboard. Tiles mirror the admin
 * shape (label / value / sub) so the visual language stays consistent
 * across surfaces. Empty state guides new partners to publish first.
 */
export default function Analytics({ tiles, has_listings }) {
    return (
        <PartnerLayout title="Measure — Analytics">
            <DashboardHero
                role="partner"
                title="Measure"
                subtitle="Track your listings, conversions and revenue."
            />

            {!has_listings && (
                <div className="content-card mt-4 p-4">
                    <div className="empty-state">
                        <i className="fas fa-chart-line"></i>
                        <h4>No data yet</h4>
                        <p>Publish your first listing to start collecting metrics.</p>
                        <Link href={route('partner.listings.index')} className="btn btn-primary mt-2">
                            <i className="fas fa-plus me-1"></i> Publish a listing
                        </Link>
                    </div>
                </div>
            )}

            {/* Sprint 36 — .tfe-tile primitive. Map the old `accent`
                strings onto the tile variants so incoming data still
                colours the tiles consistently. */}
            <div className="tfe-stat-grid mt-4">
                {tiles.map((t, i) => {
                    const variant = ({
                        blue: 'blue', green: 'teal', teal: 'teal', cyan: 'cyan',
                        amber: 'amber', yellow: 'amber',
                        red: 'red', rose: 'rose',
                        violet: 'violet', purple: 'violet',
                    })[t.accent] || 'red';
                    return (
                        <div key={i} className={`tfe-tile tfe-tile--${variant}`}>
                            <div className="tfe-tile__head">
                                <div className="tfe-tile__icon">
                                    <i className={`fas ${t.icon}`} />
                                </div>
                            </div>
                            <div className="tfe-tile__value">{t.value}</div>
                            <div className="tfe-tile__label">{t.label}</div>
                            {t.sub && <div className="tfe-tile__subtext">{t.sub}</div>}
                        </div>
                    );
                })}
            </div>
        </PartnerLayout>
    );
}
