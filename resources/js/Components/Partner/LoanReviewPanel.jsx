import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import DashboardHero from '@/Components/Common/DashboardHero';
import { formatMoney } from '@/lib/utils';

/**
 * LoanReviewPanel — finance-partner loan approval surface. Rendered by
 * Partner/RequestView when variant === 'finance'. Reuses DashboardHero
 * and StatCard-shape tiles so the visual language matches the travel
 * partner's review page.
 */
export default function LoanReviewPanel({ loan }) {
    const [rate, setRate] = useState(loan.interest_rate ?? '');
    const [notes, setNotes] = useState(loan.notes ?? '');
    const [busy, setBusy] = useState(false);

    const decide = (status) => {
        setBusy(true);
        router.put(route('partner.loans.update', loan.id),
            { status, interest_rate: rate || null, notes: notes || null },
            { preserveScroll: true, onFinish: () => setBusy(false) });
    };

    return (
        <>
            <DashboardHero
                role="partner"
                title={loan.reference_id}
                subtitle={`Applicant: ${loan.applicant.name} · ${loan.applicant.email}`}
                breadcrumbs={[
                    { label: 'Dashboard', href: route('partner.dashboard') },
                    { label: loan.reference_id },
                ]}
            />

            <div className="summary-cards-grid">
                <div className="stat-card">
                    <div className="stat-label">Amount requested</div>
                    <div className="stat-value">{formatMoney(loan.amount)}</div>
                    <div className="stat-subtext">{loan.purpose || 'Trip financing'}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Current status</div>
                    <div className="stat-value text-capitalize">{loan.status}</div>
                    <div className="stat-subtext">Submitted {loan.created_at}</div>
                </div>
                {loan.budget && (
                    <div className="stat-card">
                        <div className="stat-label">Attached budget</div>
                        <div className="stat-value">{formatMoney(loan.budget.total_cost)}</div>
                        <div className="stat-subtext">{loan.budget.reference_id} · {loan.budget.nights} nights</div>
                    </div>
                )}
            </div>

            <div className="content-card mt-4 p-4">
                <div className="card-header d-flex align-items-center gap-2">
                    <i className="fas fa-gavel"></i>
                    <h3>Underwriting decision</h3>
                </div>

                <div className="row g-3 mt-2">
                    <div className="col-md-4">
                        <label className="form-label text-white-50">Interest rate (%)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={rate}
                            onChange={(e) => setRate(e.target.value)}
                            className="form-control"
                            placeholder="e.g. 12.5"
                        />
                    </div>
                    <div className="col-md-8">
                        <label className="form-label text-white-50">Notes for the applicant</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="form-control"
                            rows={2}
                            placeholder="Reasoning, disbursement terms, or next steps."
                        />
                    </div>
                </div>

                <div className="d-flex gap-2 mt-3">
                    <button
                        onClick={() => decide('APPROVED')}
                        disabled={busy || loan.status === 'approved'}
                        className="btn btn-success"
                    >
                        <i className="fas fa-check me-2"></i> Approve
                    </button>
                    <button
                        onClick={() => decide('DISBURSED')}
                        disabled={busy || loan.status !== 'approved'}
                        className="btn btn-primary"
                    >
                        <i className="fas fa-paper-plane me-2"></i> Mark disbursed
                    </button>
                    <button
                        onClick={() => decide('REJECTED')}
                        disabled={busy || loan.status === 'rejected'}
                        className="btn btn-outline-danger"
                    >
                        <i className="fas fa-times me-2"></i> Reject
                    </button>
                </div>
            </div>
        </>
    );
}
