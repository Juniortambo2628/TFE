import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import ListingGrid from '@/Components/Common/ListingGrid';
import { Link } from '@inertiajs/react';

/**
 * Admin partner directory — cards-first (Sprint 48).
 *
 * One AccentCard per partner-type user, matching the landing tournament
 * grid + partner hub visual language. Table view stays available via the
 * grid toggle for admins who want a scannable list.
 */
export default function Partners({ auth, partners = [], partner_types = {} }) {
    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Partners' },
    ];

    const verifPill = (status) => {
        if (status === 'verified') return 'Verified';
        if (status === 'pending') return 'Pending';
        return 'Unverified';
    };

    const table = (
        <div className="tfe-slab">
            <div className="tfe-slab__body tfe-slab__body--flush">
                <div className="table-responsive">
                    <table className="tfe-table tfe-table--compact">
                        <thead>
                            <tr>
                                <th>Partner</th>
                                <th>Archetype</th>
                                <th>Verification</th>
                                <th>Hub</th>
                                <th>Listings</th>
                                <th>Joined</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {partners.map((p) => (
                                <tr key={p.id}>
                                    <td><strong>{p.profile_display_name || p.name}</strong><div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>{p.email}</div></td>
                                    <td>{partner_types[p.partner_type] || p.partner_type || '—'}</td>
                                    <td><span className={`tfe-pill ${p.verification_status === 'verified' ? 'tfe-pill--approved' : p.verification_status === 'pending' ? 'tfe-pill--pending' : 'tfe-pill--info'}`}>{verifPill(p.verification_status)}</span></td>
                                    <td>{p.profile_is_public ? <a href={`/partners/${p.profile_slug}`} target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>/partners/{p.profile_slug}</a> : <span style={{ color: 'rgba(255,255,255,0.5)' }}>Not public</span>}</td>
                                    <td>{p.listings_count}</td>
                                    <td style={{ fontSize: '0.72rem' }}>{p.created_at}</td>
                                    <td><Link href={route('admin.partners.edit', p.id)} className="tfe-btn tfe-btn--sm">Edit</Link></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    return (
        <AdminLayout title="Partners">
            <DashboardHero
                role="admin"
                title="Partner directory"
                subtitle="Every partner on TFE — verify, feature, and manage each partner's branded hub."
                breadcrumbs={breadcrumbs}
            />

            <ListingGrid
                items={partners}
                tableView={table}
                emptyIcon="fas fa-handshake"
                emptyTitle="No partners yet"
                emptyBody="Partners register via the standard flow with is_partner=true. Once registered they appear here."
                to={(p) => ({
                    LinkComponent: Link,
                    href: route('admin.partners.edit', p.id),
                    accent: p.theme_accent || '#3b82f6',
                    artwork: p.logo_url ? { src: p.logo_url, variant: 'thumb' } : { icon: 'fas fa-handshake' },
                    eyebrow: partner_types[p.partner_type] || p.partner_type || 'Partner',
                    title: p.profile_display_name || p.name,
                    desc: p.tagline || p.email,
                    status: verifPill(p.verification_status),
                    pills: [
                        p.profile_is_public ? 'Public hub' : 'Private',
                        `${p.listings_count} listing${p.listings_count === 1 ? '' : 's'}`,
                    ],
                    cta: { label: 'Edit partner', icon: 'fas fa-pen' },
                })}
            />
        </AdminLayout>
    );
}
