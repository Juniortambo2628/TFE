import React, { useState } from 'react';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Breadcrumbs from '@/Components/Common/Breadcrumbs';
import '../../../css/fan/fan-pages.css';
import { formatMoney } from '@/lib/utils';

export default function Requests({ budgets = [], stats = {} }) {
    const { flash } = usePage().props;
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredBudgets = budgets.filter((budget) => {
        const matchesStatus = statusFilter === 'all' || budget.partner_status === statusFilter;
        const matchesSearch = searchQuery === '' ||
            budget.id.toString().includes(searchQuery.toLowerCase()) ||
            budget.fan?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'approved': return 'dash-badge-success';
            case 'modified': return 'dash-badge-warning';
            case 'pending': return 'dash-badge-info';
            case 'rejected': return 'dash-badge-danger';
            default: return 'dash-badge-neutral';
        }
    };

    return (
        <PartnerLayout title="Requests">
            <Head title="Partner Requests - TFE" />

            {/* Hero Section */}
            <div className="partner-hero">
                <Breadcrumbs 
                    title="Requests" 
                    breadcrumbs={[{ label: 'Partner Requests' }]}
                    accentColor="#d97706"
                    homeRoute="partner.dashboard"
                />
                <h1 className="dash-section-title">
                    <i className="fas fa-inbox accent-partner"></i>
                    Partner Requests
                </h1>
                <p className="dash-text-muted dash-no-margin">
                    Browse and claim travel requests from fans looking for local partners to coordinate their trips.
                </p>
            </div>

            {/* Success/Error Message */}
            {flash?.success && (
                <div className="dash-flash-success">
                    <i className="fas fa-check-circle me-2"></i>
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="dash-flash-error">
                    <i className="fas fa-exclamation-circle me-2"></i>
                    {flash.error}
                </div>
            )}

            {/* Stats */}
            <div className="dash-stat-grid dash-mb-lg">
                <div className="dash-stat-card">
                    <i className="fas fa-inbox accent-partner dash-stat-icon partner-stat-icon-lg"></i>
                    <div className="dash-stat-value">{stats.total || 0}</div>
                    <div className="dash-stat-label">Total Requests</div>
                </div>
                <div className="dash-stat-card">
                    <i className="fas fa-clock accent-admin dash-stat-icon partner-stat-icon-lg"></i>
                    <div className="dash-stat-value">{stats.pending || 0}</div>
                    <div className="dash-stat-label">Pending Review</div>
                </div>
                <div className="dash-stat-card">
                    <i className="fas fa-check accent-success dash-stat-icon partner-stat-icon-lg"></i>
                    <div className="dash-stat-value">{stats.approved || 0}</div>
                    <div className="dash-stat-label">Claimed</div>
                </div>
            </div>

            {/* Filter/Search */}
            <div className="dash-flex-between dash-mb-lg">
                <div className="dash-flex dash-gap-sm">
                    {['all', 'pending', 'approved', 'modified'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`dash-btn partner-btn-filter ${statusFilter === status ? 'active' : ''}`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
                <div>
                    <input
                        type="text"
                        placeholder="Search by ID or Fan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="dash-input partner-search-input"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="dash-card overflow-x-auto">
                <table className="dash-table dash-table-hover">
                    <thead>
                        <tr>
                            <th>Reference ID</th>
                            <th>Fan</th>
                            <th>Destination</th>
                            <th>Group Size</th>
                            <th>Priority</th>
                            <th>Estimated Cost</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBudgets.length > 0 ? (
                            filteredBudgets.map((budget) => (
                                <tr key={budget.id}>
                                    <td>
                                        <span className="accent-partner dash-fw-semibold">
                                            {budget.id}
                                        </span>
                                    </td>
                                    <td className="dash-text-muted">{budget.fan?.name || 'Anonymous'}</td>
                                    <td className="dash-fw-semibold">{budget.destination}</td>
                                    <td>{budget.group_size} {budget.group_size === 1 ? 'person' : 'people'}</td>
                                    <td>
                                        <span className={`dash-badge ${budget.priority === 'high' ? 'dash-badge-danger' : budget.priority === 'medium' ? 'dash-badge-warning' : 'dash-badge-info'}`}>
                                            {budget.priority}
                                        </span>
                                    </td>
                                    <td className="dash-fw-semibold">{formatMoney(budget.total_cost)}</td>
                                    <td>
                                        <span className={`dash-badge ${getStatusBadgeClass(budget.partner_status)}`}>
                                            {budget.partner_status}
                                        </span>
                                    </td>
                                    <td>
                                        <Link
                                            href={route('partner.requests.show', budget.id)}
                                            className="dash-btn dash-btn-outline accent-partner btn-review"
                                        >
                                            <i className="fas fa-eye me-2"></i>Review
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="dash-empty">
                                    <i className="fas fa-inbox"></i>
                                    <h4>No requests found</h4>
                                    <p>Check back later for new travel requests from fans.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </PartnerLayout>
    );
}
