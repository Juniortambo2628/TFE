import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import { Link } from '@inertiajs/react';

/**
 * Admin partner directory (Sprint 9).
 *
 * One row per partner-type user: name, archetype, verification, hub
 * status, listings count. Edit action → /admin/partners/{user} for
 * the full profile editor.
 */
export default function Partners({ auth, partners = [], partner_types = {} }) {
    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Partners' },
    ];

    const verifBadge = (status) => {
        if (status === 'verified') return { className: 'admin-badge-green', icon: 'fa-check-circle', label: 'Verified' };
        if (status === 'pending') return { className: 'admin-badge-amber', icon: 'fa-clock', label: 'Pending' };
        return { className: '', icon: 'fa-circle-question', label: 'Unverified' };
    };

    return (
        <AdminLayout title="Partners">
            <DashboardHero
                role="admin"
                title="Partner Directory"
                subtitle="Every partner on TFE — verify, feature, and manage each partner's branded hub."
                breadcrumbs={breadcrumbs}
            />

            {partners.length === 0 ? (
                <div className="admin-card-dark">
                    <div className="admin-empty-state">
                        <i className="fas fa-handshake"></i>
                        <h4>No partners yet</h4>
                        <p className="text-white-50">Partners register via the standard flow with is_partner=true. Once registered they appear here.</p>
                    </div>
                </div>
            ) : (
                <div className="admin-card-dark">
                    <div className="card-body p-0">
                        <table className="admin-table-dark">
                            <thead>
                                <tr>
                                    <th>Partner</th>
                                    <th>Archetype</th>
                                    <th>Verification</th>
                                    <th>Hub</th>
                                    <th>Listings</th>
                                    <th>Joined</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {partners.map((p) => {
                                    const b = verifBadge(p.verification_status);
                                    const typeLabel = partner_types[p.partner_type] || p.partner_type || '—';
                                    return (
                                        <tr key={p.id}>
                                            <td>
                                                <div className="fw-semibold text-white">{p.profile_display_name || p.name}</div>
                                                <small className="text-white-50">{p.email}</small>
                                            </td>
                                            <td>
                                                <span className="admin-badge">{typeLabel}</span>
                                            </td>
                                            <td>
                                                <span className={`admin-badge ${b.className}`}>
                                                    <i className={`fas ${b.icon} me-1`}></i>
                                                    {b.label}
                                                </span>
                                            </td>
                                            <td>
                                                {!p.has_profile ? (
                                                    <span className="text-white-50 small">No profile</span>
                                                ) : p.profile_is_public ? (
                                                    <a
                                                        href={`/partners/${p.profile_slug}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-info small text-decoration-none"
                                                    >
                                                        Live · /partners/{p.profile_slug}
                                                        <i className="fas fa-external-link-alt ms-1" style={{ fontSize: '0.55rem' }}></i>
                                                    </a>
                                                ) : (
                                                    <span className="text-warning small">
                                                        <i className="fas fa-eye-slash me-1"></i>
                                                        Draft
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className="text-white">{p.listings_count}</span>
                                            </td>
                                            <td>
                                                <small className="text-white-50">{p.created_at}</small>
                                            </td>
                                            <td className="text-end">
                                                <Link
                                                    href={route('admin.partners.edit', p.id)}
                                                    className="btn-admin-outline btn-admin-sm"
                                                    title="Edit partner + profile"
                                                >
                                                    <i className="fas fa-pen"></i> Edit
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
