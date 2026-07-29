import React, { useState, useMemo } from 'react';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { Link } from '@inertiajs/react';
import { formatMoney } from '@/lib/utils';

export default function Requests({ requests }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filtered = useMemo(() => {
        let result = requests || [];
        if (statusFilter !== 'all') {
            result = result.filter(r => r.status === statusFilter);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(r =>
                r.reference_id.toLowerCase().includes(q) ||
                String(r.id).includes(q)
            );
        }
        return result;
    }, [requests, search, statusFilter]);

    const counts = useMemo(() => {
        const list = requests || [];
        return {
            all: list.length,
            pending: list.filter(r => r.status === 'pending').length,
            approved: list.filter(r => r.status === 'approved').length,
            modified: list.filter(r => r.status === 'modified').length,
            rejected: list.filter(r => r.status === 'rejected').length,
        };
    }, [requests]);

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'approved': return 'dash-badge-success';
            case 'modified': return 'dash-badge-warning';
            case 'pending': return 'dash-badge-info';
            case 'rejected': return 'dash-badge-danger';
            default: return 'dash-badge-neutral';
        }
    };

    const statusLabels = {
        pending: 'Needs Review',
        approved: 'Approved',
        modified: 'Modified',
        rejected: 'Rejected',
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
                        <div className="dash-flex dash-gap-sm" style={{ flexWrap: 'wrap' }}>
                            {[
                                { key: 'all', label: 'All', cls: 'dash-badge-warning' },
                                { key: 'pending', label: 'Needs Review', cls: 'dash-badge-info' },
                                { key: 'approved', label: 'Approved', cls: 'dash-badge-success' },
                                { key: 'modified', label: 'Modified', cls: 'dash-badge-warning' },
                                { key: 'rejected', label: 'Rejected', cls: 'dash-badge-danger' },
                            ].map(f => (
                                <button
                                    key={f.key}
                                    onClick={() => setStatusFilter(f.key)}
                                    className={`dash-badge ${statusFilter === f.key ? f.cls : 'dash-badge-neutral'}`}
                                    style={{
                                        padding: 'var(--space-sm) var(--space-lg)',
                                        cursor: 'pointer',
                                        border: 'none',
                                        opacity: statusFilter === f.key ? 1 : 0.6,
                                        transition: 'opacity 0.2s',
                                    }}
                                >
                                    {f.label}: {counts[f.key]}
                                </button>
                            ))}
                        </div>
                        <div style={{ position: 'relative', maxWidth: '300px', width: '100%' }}>
                            <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}></i>
                            <input
                                type="text"
                                placeholder="Search reference..."
                                className="dash-input"
                                style={{ paddingLeft: '35px' }}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
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
                        {filtered.length > 0 ? (
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
                                    {filtered.map((req) => (
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
                                                    {statusLabels[req.status] || req.status}
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
                                <h4>No Requests Found</h4>
                                <p>{search || statusFilter !== 'all' ? 'Try adjusting your search or filter.' : 'Travel requests will appear here when fans start planning their journey.'}</p>
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
