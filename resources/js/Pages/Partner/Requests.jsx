import React, { useState } from 'react';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import DashboardHero from '@/Components/Common/DashboardHero';
import SummaryTiles from '@/Components/Common/SummaryTiles';
import MinorsBadge from '@/Components/Common/MinorsBadge';
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

/**
 * The page reads exactly what DashboardController::requests() sends:
 * `requests` (travel briefs, or loan applications for a finance partner),
 * `variant`, and `hasListings`. It used to read `budgets`/`stats` props and
 * fields (`fan`, `destination`, `group_size`, `priority`) the controller
 * never sent, so the Convert queue showed "No requests found" for every
 * partner while their dashboard counted the same briefs. Counts are derived
 * from the rows, so the tiles cannot disagree with the table.
 */
export default function Requests({ requests = [], variant = 'travel', hasListings = true }) {
    const { flash } = usePage().props;
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const isFinance = variant === 'finance';

    const count = (status) => requests.filter((r) => r.status === status).length;
    const filtered = requests.filter((r) => {
        const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
        const q = searchQuery.trim().toLowerCase();
        const who = (isFinance ? r.applicant_name : r.fan?.name) || '';
        const matchesSearch = q === ''
            || String(r.reference_id || r.id).toLowerCase().includes(q)
            || String(r.name || '').toLowerCase().includes(q)
            || who.toLowerCase().includes(q);
        return matchesStatus && matchesSearch;
    });

    const reviewHref = (r) => (isFinance ? route('partner.loans.show', r.id) : route('partner.requests.show', r.id));
    const filters = isFinance ? ['all', 'pending', 'approved', 'rejected'] : ['all', 'pending', 'modified', 'approved', 'rejected'];

    return (
        <PartnerLayout title="Requests">
            <Head title="Partner Requests - TFE" />

            <DashboardHero
                role="partner"
                title={isFinance ? 'Financing Requests' : 'Partner Requests'}
                subtitle={isFinance
                    ? 'Financing applications fans have routed to you.'
                    : 'Trip briefs from fans who built their plan around one of your listings.'}
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
                    { label: isFinance ? 'Applications' : 'Total Requests', value: requests.length, icon: 'fa-inbox', accent: 'blue' },
                    { label: 'Pending Review', value: count('pending'), icon: 'fa-clock', accent: 'amber' },
                    { label: 'Approved', value: count('approved'), icon: 'fa-check', accent: 'teal' },
                ]}
            />

            <div className="tfe-slab__header mb-3">
                <div className="feed-tabs">
                    {filters.map((status) => (
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
                    placeholder={isFinance ? 'Search by reference or applicant…' : 'Search by reference, plan or fan…'}
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
                                    <th>Reference</th>
                                    <th>{isFinance ? 'Applicant' : 'Fan'}</th>
                                    <th>{isFinance ? 'Purpose' : 'Trip'}</th>
                                    {!isFinance && <th>Group</th>}
                                    <th>{isFinance ? 'Amount' : 'Estimated cost'}</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length > 0 ? (
                                    filtered.map((r) => (
                                        <tr key={r.id}>
                                            <td>
                                                <strong className="text-nowrap">{r.reference_id || r.id}</strong>
                                                <div className="text-white-50 small">{r.created_at}</div>
                                            </td>
                                            <td>{(isFinance ? r.applicant_name : r.fan?.name) || 'Fan'}</td>
                                            <td>
                                                <strong>{isFinance ? (r.purpose || 'General financing') : (r.name || 'Trip plan')}</strong>
                                                {!isFinance && (
                                                    <div className="text-white-50 small">
                                                        {[
                                                            r.nights ? `${r.nights} nights` : null,
                                                            r.match_count ? `${r.match_count} ${r.match_count === 1 ? 'match' : 'matches'}` : null,
                                                        ].filter(Boolean).join(' · ')}
                                                    </div>
                                                )}
                                            </td>
                                            {!isFinance && (
                                                <td>
                                                    {r.school_group ? (
                                                        <div className="d-flex flex-column align-items-start gap-1">
                                                            <span className="small">{r.school_group.party_summary}</span>
                                                            <MinorsBadge group={r.school_group} compact />
                                                        </div>
                                                    ) : (
                                                        <span className="text-white-50">—</span>
                                                    )}
                                                </td>
                                            )}
                                            <td><strong>{formatMoney(r.total_cost, r.currency || 'USD')}</strong></td>
                                            <td>
                                                <span className={`tfe-pill ${STATUS_PILL[r.status] || 'tfe-pill--info'}`}>
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td>
                                                <Link href={reviewHref(r)} className="tfe-btn tfe-btn--sm">
                                                    <i className="fas fa-eye me-2"></i>Review
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={isFinance ? 6 : 7}>
                                            <div className="tfe-empty tfe-empty--inline">
                                                <div className="tfe-empty__icon"><i className="fas fa-inbox"></i></div>
                                                {!isFinance && !hasListings ? (
                                                    <>
                                                        <h4 className="tfe-empty__title">No listings yet, so no requests</h4>
                                                        <p className="tfe-empty__body">
                                                            Fans' briefs reach you when they plan a trip around one of your listings.
                                                        </p>
                                                        <div className="tfe-empty__action">
                                                            <Link href={route('partner.listings.index')} className="tfe-btn tfe-btn--sm">
                                                                Publish a listing
                                                            </Link>
                                                        </div>
                                                    </>
                                                ) : requests.length > 0 ? (
                                                    <>
                                                        <h4 className="tfe-empty__title">Nothing matches that filter</h4>
                                                        <p className="tfe-empty__body">Try another status, or clear the search.</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <h4 className="tfe-empty__title">No requests yet</h4>
                                                        <p className="tfe-empty__body">
                                                            {isFinance ? 'Applications routed to you will appear here.' : 'Briefs from fans who pick your listings will appear here.'}
                                                        </p>
                                                    </>
                                                )}
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
