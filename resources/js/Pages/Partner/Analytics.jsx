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

            <div className="partner-summary-cards mt-4">
                {tiles.map((t, i) => (
                    <div key={i} className="partner-stat-card" data-accent={t.accent}>
                        <div className="stat-icon">
                            <i className={`fas ${t.icon}`}></i>
                        </div>
                        <div className="stat-value">{t.value}</div>
                        <div className="stat-label">{t.label}</div>
                        <div className="stat-change neutral">{t.sub}</div>
                    </div>
                ))}
            </div>
        </PartnerLayout>
    );
}
