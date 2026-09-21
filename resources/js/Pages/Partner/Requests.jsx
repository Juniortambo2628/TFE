import React, { useState } from 'react';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import DashboardHero from '@/Components/Common/DashboardHero';
import SummaryTiles from '@/Components/Common/SummaryTiles';
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

    return (
        <PartnerLayout title="Requests">
            <Head title="Partner Requests - TFE" />

            <DashboardHero
                role="partner"
                title="Partner Requests"
                subtitle="Browse and claim travel requests from fans looking for local partners to coordinate their trips."
                breadcrumbs={[{ label: 'Partner Requests' }]}
            />

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

            {/* Stats — shared summary tiles (same primitive as every dashboard) */}
            <SummaryTiles
                className="mb-4"
                items={[
                    { label: 'Total Requests', value: stats.total || 0,    icon: 'fa-inbox', accent: 'blue' },
                    { label: 'Pending Review', value: stats.pending || 0,  icon: 'fa-clock', accent: 'amber' },
                    { label: 'Claimed',        value: stats.approved || 0, icon: 'fa-check', accent: 'teal' },
                ]}
            />

            <div className="content-card mt-4">
                <div className="card-header d-flex flex-wrap gap-3 align-items-center justify-content-between">
                    <div className="d-flex gap-2 flex-wrap">
                        {['all', 'pending', 'approved', 'modified'].map((status) => (
                            <button
                                key={status}
                                type="button"
                                onClick={() => setStatusFilter(status)}
                                className={`tfe-btn tfe-btn--sm${statusFilter === status ? ' is-active' : ''}`}
                                aria-pressed={statusFilter === status}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                    <input
                        type="text"
                        placeholder="Search by ID or Fan…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="tfe-input tfe-input--sm partner-search-input"
                    />
                </div>

                <div className="p-3">
                    {filteredBudgets.length === 0 ? (
                        <div className="tfe-empty">
                            <div className="tfe-empty__icon"><i className="fas fa-inbox" /></div>
                            <h4 className="tfe-empty__title">No requests found</h4>
                            <p className="tfe-empty__body">Check back later for new travel requests from fans.</p>
                        </div>
                    ) : (
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
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBudgets.map((budget) => (
                                        <tr key={budget.id}>
                                            <td><span className="fw-semibold">{budget.id}</span></td>
                                            <td className="text-white-50">{budget.fan?.name || 'Anonymous'}</td>
                                            <td className="fw-semibold">{budget.destination}</td>
                                            <td>{budget.group_size} {budget.group_size === 1 ? 'person' : 'people'}</td>
                                            <td>
                                                <span className={`tfe-pill tfe-pill--${budget.priority === 'high' ? 'rejected' : budget.priority === 'medium' ? 'pending' : 'info'}`}>
                                                    {budget.priority}
                                                </span>
                                            </td>
                                            <td className="fw-semibold">{formatMoney(budget.total_cost)}</td>
                                            <td>
                                                <span className={`tfe-pill tfe-pill--${budget.partner_status === 'approved' ? 'approved' : budget.partner_status === 'modified' ? 'pending' : 'info'}`}>
                                                    {budget.partner_status}
                                                </span>
                                            </td>
                                            <td className="text-end">
                                                <Link href={route('partner.requests.show', budget.id)} className="tfe-btn tfe-btn--sm">
                                                    <i className="fas fa-eye" /> Review
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </PartnerLayout>
    );
}
