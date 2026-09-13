import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import SummaryTiles from '@/Components/Common/SummaryTiles';
import PoweredByBadge from '@/Components/Common/PoweredByBadge';
import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { formatMoney } from '@/lib/utils';

/**
 * Admin oversight for every loan application on the platform.
 * Sprint 25 additions:
 *  - Partner column showing the finance partner brand (Powered-by chip).
 *  - Filter chip row (All / by status / by partner / Unrouted).
 *  - Currency via formatMoney (USD, matches every other admin surface).
 */
export default function LoanApplications({ loans, stats, finance_partners = [], filters = {} }) {
    const [processingId, setProcessingId] = useState(null);

    const updateStatus = (id, newStatus) => {
        if (!confirm(`Change status to ${newStatus}?`)) return;
        setProcessingId(id);
        router.put(route('admin.loan-applications.update', id), { status: newStatus }, {
            preserveScroll: true,
            onSuccess: () => { toast.success(`Loan ${newStatus.toLowerCase()}`); setProcessingId(null); },
            onError: () => { toast.error('Failed to update status'); setProcessingId(null); },
        });
    };

    const routeLoan = (id, partnerId) => {
        router.put(route('admin.loan-applications.update', id), {
            status: loans.data.find((l) => l.id === id)?.status || 'PENDING',
            finance_partner_id: partnerId || null,
        }, {
            preserveScroll: true,
            onSuccess: () => toast.success(partnerId ? 'Routed to partner' : 'Routing cleared'),
        });
    };

    const switchFilter = (patch) => {
        const next = { ...filters, ...patch };
        Object.keys(next).forEach((k) => (next[k] == null || next[k] === '') && delete next[k]);
        router.get(route('admin.loan-applications'), next, { preserveScroll: true });
    };

    return (
        <AdminLayout title="Loan Applications">
            <Head title="Loan Applications" />

            <DashboardHero
                role="admin"
                title="Loan Applications"
                subtitle="Every fan loan request across finance partners."
                breadcrumbs={[
                    { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
                    { label: 'Loan Applications' },
                ]}
            />

            <SummaryTiles
                items={[
                    { label: 'Total Applications', value: stats.total,                    icon: 'fa-file-invoice-dollar', accent: 'blue',  subtext: `${stats.unrouted} unrouted` },
                    { label: 'Pending Review',     value: stats.pending,                  icon: 'fa-clock',               accent: 'amber', subtext: 'Awaiting decision' },
                    { label: 'Approved',           value: stats.approved,                 icon: 'fa-check-circle',        accent: 'teal',  subtext: `${stats.disbursed} disbursed` },
                    { label: 'Approved Amount',    value: formatMoney(stats.total_amount),icon: 'fa-coins',               accent: 'red',   subtext: 'Across all partners' },
                ]}
            />

            {/* Filter chip row */}
            <div className="content-card mt-4 p-3">
                <div className="d-flex flex-wrap gap-2 align-items-center">
                    <span className="tfe-form-label me-2 mb-0">Status</span>
                    <FilterChip active={!filters.status} onClick={() => switchFilter({ status: null })}>All</FilterChip>
                    {['PENDING', 'APPROVED', 'REJECTED', 'DISBURSED'].map((s) => (
                        <FilterChip key={s} active={filters.status === s}
                            onClick={() => switchFilter({ status: s })}>
                            {s}
                        </FilterChip>
                    ))}
                </div>
                <div className="d-flex flex-wrap gap-2 align-items-center mt-2">
                    <span className="tfe-form-label me-2 mb-0">Partner</span>
                    <FilterChip active={!filters.finance_partner_id}
                        onClick={() => switchFilter({ finance_partner_id: null })}>All</FilterChip>
                    <FilterChip active={filters.finance_partner_id === 'unrouted'}
                        onClick={() => switchFilter({ finance_partner_id: 'unrouted' })}>Unrouted</FilterChip>
                    {finance_partners.map((p) => (
                        <FilterChip key={p.id} active={String(filters.finance_partner_id) === String(p.id)}
                            onClick={() => switchFilter({ finance_partner_id: p.id })}
                            accent={p.theme_accent}>
                            {p.display_name}
                        </FilterChip>
                    ))}
                </div>
            </div>

            {/* Applications table */}
            <div className="content-card mt-4">
                <div className="card-header d-flex align-items-center gap-2">
                    <i className="fas fa-list"></i>
                    <h3>Applications</h3>
                </div>
                <div className="table-responsive p-2">
                    <table className="table table-dark align-middle mb-0">
                        <thead>
                            <tr>
                                <th>Reference</th>
                                <th>Applicant</th>
                                <th>Amount</th>
                                <th>Partner</th>
                                <th>Budget</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loans.data.map((loan) => (
                                <tr key={loan.id}>
                                    <td className="text-white-50 small">{loan.reference_id}</td>
                                    <td>
                                        <div className="fw-semibold text-white">{loan.user_name}</div>
                                        {loan.user_email && <div className="text-white-50 small">{loan.user_email}</div>}
                                    </td>
                                    <td>
                                        <div className="text-white fw-semibold">{formatMoney(loan.amount)}</div>
                                        {loan.interest_rate != null && (
                                            <small className="text-white-50">{Number(loan.interest_rate).toFixed(2)}% interest</small>
                                        )}
                                    </td>
                                    <td>
                                        {loan.partner ? (
                                            <PoweredByBadge publisher={loan.partner} variant="chip" />
                                        ) : (
                                            <UnroutedPicker loan={loan} partners={finance_partners} onRoute={routeLoan} />
                                        )}
                                    </td>
                                    <td className="text-white-50">{loan.budget_reference || '—'}</td>
                                    <td className="text-white-50">{loan.created_at}</td>
                                    <td>
                                        <span className={`badge bg-${
                                            loan.status === 'APPROVED' ? 'success' :
                                            loan.status === 'REJECTED' ? 'danger' :
                                            loan.status === 'DISBURSED' ? 'primary' : 'warning'
                                        }`}>
                                            {loan.status}
                                        </span>
                                    </td>
                                    <td className="text-end">
                                        {loan.status === 'PENDING' && (
                                            <div className="d-inline-flex gap-2 flex-wrap justify-content-end">
                                                <button type="button" className="tfe-btn tfe-btn--sm tfe-btn--filled"
                                                    onClick={() => updateStatus(loan.id, 'APPROVED')}
                                                    disabled={processingId === loan.id}>Approve</button>
                                                <button type="button" className="tfe-btn tfe-btn--sm"
                                                    onClick={() => updateStatus(loan.id, 'REJECTED')}
                                                    disabled={processingId === loan.id}>Reject</button>
                                            </div>
                                        )}
                                        {loan.status === 'APPROVED' && (
                                            <button type="button" className="tfe-btn tfe-btn--sm tfe-btn--filled"
                                                onClick={() => updateStatus(loan.id, 'DISBURSED')}
                                                disabled={processingId === loan.id}>Mark disbursed</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {loans.data.length === 0 && (
                                <tr>
                                    <td colSpan="8">
                                        <div className="tfe-empty">
                                            <div className="tfe-empty__icon"><i className="fas fa-hand-holding-usd" /></div>
                                            <h4 className="tfe-empty__title">No loan applications match</h4>
                                            <p className="tfe-empty__body">Try widening the filters above.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}

function FilterChip({ children, active, onClick }) {
    // Sprint 40 — glass pill, inverts to filled white when active.
    // Dropped the per-partner accent tint so the chip row reads as one
    // group at a glance (finance partners are already differentiated
    // in the column left of the chip row).
    return (
        <button
            type="button"
            className={`tfe-btn tfe-btn--sm${active ? ' is-active' : ''}`}
            aria-pressed={active}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

function UnroutedPicker({ loan, partners, onRoute }) {
    if (!partners.length) {
        return <span className="text-white-50 small">— unrouted —</span>;
    }
    return (
        <select
            className="tfe-select tfe-select--sm"
            defaultValue=""
            onChange={(e) => e.target.value && onRoute(loan.id, e.target.value)}
        >
            <option value="" disabled>Route to…</option>
            {partners.map((p) => (
                <option key={p.id} value={p.id}>{p.display_name}</option>
            ))}
        </select>
    );
}
