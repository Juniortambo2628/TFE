import React from 'react';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { Link, usePage } from '@inertiajs/react';
import '../../../css/fan/dashboard.css';
import '../../../css/partner/dashboard.css';
import { formatMoney } from '@/lib/utils';

export default function Requests({ requests }) {
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'approved': return 'dash-badge-success';
            case 'modified': return 'dash-badge-warning';
            case 'pending': return 'dash-badge-info';
            default: return 'dash-badge-neutral';
        }
    };

    return (
        <PartnerLayout title="Travel Requests">
            <div className="">
                {/* Hero Section */}
                <div className="dash-card dash-card-body" style={{
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                    borderColor: 'var(--partner-amber)',
                    boxShadow: '0 4px 24px rgba(217, 119, 6, 0.15)',
                }}>
                    <h1 className="dash-section-title" style={{ fontSize: 'var(--fs-4xl)' }}>
                        Travel Requests
                    </h1>
                    <p className="dash-text-light dash-text-md dash-no-margin">
                        Review and manage all incoming travel package requests from fans.
                    </p>
                </div>

                {/* Filter/Status bar */}
                <div className="dash-card dash-card-body dash-mb-lg">
                    <div className="dash-flex-between dash-flex-wrap dash-gap-md">
                        <div className="dash-flex dash-gap-sm">
                            <span className="dash-badge dash-badge-warning" style={{ padding: 'var(--space-sm) var(--space-lg)' }}>
                                All: {requests.length}
                            </span>
                            <span className="dash-badge dash-badge-info" style={{ padding: 'var(--space-sm) var(--space-lg)' }}>
                                Needs Review: {requests.filter(r => r.status === 'pending').length}
                            </span>
                        </div>
                        <div style={{ position: 'relative', maxWidth: '300px', width: '100%' }}>
                            <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}></i>
                            <input 
                                type="text" 
                                placeholder="Search reference..." 
                                className="dash-input"
                                style={{ paddingLeft: '35px' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Full Requests Table */}
                <div className="dash-card">
                    <div className="dash-card-header">
                        <h3>
                            <i className="fas fa-table accent-partner"></i>
                            All Travel Requests
                        </h3>
                    </div>
                    <div className="dash-mt-lg">
                        {requests && requests.length > 0 ? (
                            <table className="dash-table">
                                <thead>
                                    <tr>
                                        <th>Reference</th>
                                        <th>Date</th>
                                        <th>Config</th>
                                        <th>Cost</th>
                                        <th>Status</th>
                                        <th className="dash-text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map((req) => (
                                        <tr key={req.id} className="hover-row">
                                            <td>
                                                <div className="dash-text-primary dash-fw-semibold">{req.reference_id}</div>
                                                <div className="dash-text-dim dash-text-2xs">ID: #{req.id}</div>
                                            </td>
                                            <td className="dash-text-muted dash-text-md">{req.created_at}</td>
                                            <td>
                                                <div className="dash-text-light dash-text-md">{req.match_count} Matches</div>
                                                <div className="dash-text-dim dash-text-sm">{req.accommodation_level} • {req.flight_class}</div>
                                            </td>
                                            <td>
                                                <div className="dash-text-primary dash-fw-medium">
                                                    {req.partner_cost ? formatMoney(req.partner_cost) : formatMoney(req.total_cost)}
                                                </div>
                                                {req.partner_cost && <div className="accent-partner dash-text-2xs">Partner Modified</div>}
                                            </td>
                                            <td>
                                                <span className={`dash-badge ${getStatusBadgeClass(req.status)}`}>
                                                    {req.status === 'pending' ? 'Needs Review' : req.status}
                                                </span>
                                            </td>
                                            <td className="dash-text-right">
                                                <Link 
                                                    href={route('partner.requests.show', req.id)} 
                                                    className="btn-review dash-btn dash-btn-primary dash-btn-sm"
                                                >
                                                    Review
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="dash-empty">
                                <i className="fas fa-inbox fa-3x"></i>
                                <h4>No Requests Yet</h4>
                                <p>Travel requests will appear here when fans start planning their journey.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .hover-row:hover {
                    background: rgba(217, 119, 6, 0.05) !important;
                }
                .btn-review:hover {
                    background: #b45309 !important;
                    box-shadow: 0 0 12px rgba(217, 119, 6, 0.3);
                }
            `}</style>
        </PartnerLayout>
    );
}
