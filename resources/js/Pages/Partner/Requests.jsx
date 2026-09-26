import React, { useState } from 'react';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import DashboardHero from '@/Components/Common/DashboardHero';
import SummaryTiles from '@/Components/Common/SummaryTiles';
import { formatMoney } from '@/lib/utils';

/**
 * Convert tab — travel requests routed to the partner. Rebuilt on the shared
 * primitives (`tfe-slab` / `tfe-table` / `tfe-pill` / `tfe-btn` / `tfe-empty`
 * + `feed-tabs` filter chips) so it reads as part of the same system as the
 * Profile and every other partner surface, instead of the bespoke
 * `dash-card` / `dash-table` / `dash-badge` chrome it used to carry.
 */
const STATUS_PILL = {
    approved: 'tfe-pill--approved',
    modified: 'tfe-pill--pending',
    pending: 'tfe-pill--info',
    rejected: 'tfe-pill--rejected',
};

const PRIORITY_PILL = {
    high: 'tfe-pill--rejected',
    medium: 'tfe-pill--pending',
    low: 'tfe-pill--info',
};

export default function Requests({ budgets = [], stats = {} }) {
    const { flash } = usePage().props;
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredBudgets = budgets.filter((budget) => {
        const matchesStatus = statusFilter === 'all' || budget.partner_status === statusFilter;
        const q = searchQuery.trim().toLowerCase();
        const matchesSearch = q === '' ||
            budget.id.toString().includes(q) ||
            budget.fan?.name?.toLowerCase().includes(q);
        return matchesStatus && matchesSearch;
    });

    return (
        <PartnerLayout title="Requests">
            <Head title="Partner Requests - TFE" />

            <DashboardHero
                role="partner"
                title="Partner Requests"
                subtitle="Browse and claim travel requests from fans looking for local partners to coordinate their trips."
                breadcrumbs={[
                    { label: 'Partner', icon: 'fas fa-home', href: route('partner.dashboard') },
                    { label: 'Requests' },
                ]}
            />

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

            <SummaryTiles
                className="mb-4"
                items={[
                    { label: 'Total Requests', value: stats.total || 0,    icon: 'fa-inbox', accent: 'blue' },
                    { label: 'Pending Review', value: stats.pending || 0,  icon: 'fa-clock', accent: 'amber' },
                    { label: 'Claimed',        value: stats.approved || 0, icon: 'fa-check', accent: 'teal' },
                ]}
            />

            <div className="tfe-slab__header mb-3">
                <div className="feed-tabs">
                    {['all', 'pending', 'approved', 'modified'].map((status) => (
                        <button
                            key={status}
                            type="button"
                            onClick={() => setStatusFilter(status)}
                            className={`tfe-btn tfe-btn--sm${statusFilter === status ? ' is-active' : ''}`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
                <input
                    type="text"
                    placeholder="Search by ID or fan…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="tfe-input tfe-input--sm"
                    style={{ maxWidth: 260 }}
                />
            </div>

            <div className="tfe-slab">
                <div className="tfe-slab__body tfe-slab__body--flush">
                    <div className="table-responsive">
                        <table className="tfe-table">
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
                                            <td><strong>{budget.id}</strong></td>
                                            <td>{budget.fan?.name || 'Anonymous'}</td>
                                            <td><strong>{budget.destination}</strong></td>
                                            <td>{budget.group_size} {budget.group_size === 1 ? 'person' : 'people'}</td>
                                            <td>
                                                <span className={`tfe-pill ${PRIORITY_PILL[budget.priority] || 'tfe-pill--info'}`}>
                                                    {budget.priority}
                                                </span>
                                            </td>
                                            <td><strong>{formatMoney(budget.total_cost)}</strong></td>
                                            <td>
                                                <span className={`tfe-pill ${STATUS_PILL[budget.partner_status] || 'tfe-pill--info'}`}>
                                                    {budget.partner_status}
                                                </span>
                                            </td>
                                            <td>
                                                <Link
                                                    href={route('partner.requests.show', budget.id)}
                                                    className="tfe-btn tfe-btn--sm"
                                                >
                                                    <i className="fas fa-eye me-2"></i>Review
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8">
                                            <div className="tfe-empty tfe-empty--inline">
                                                <div className="tfe-empty__icon"><i className="fas fa-inbox"></i></div>
                                                <h4 className="tfe-empty__title">No requests found</h4>
                                                <p className="tfe-empty__body">Check back later for new travel requests from fans.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </PartnerLayout>
    );
}
