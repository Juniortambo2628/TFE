import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import FanLayout from '@/Layouts/FanLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import StatCard from '@/Components/Common/StatCard';
import PoweredByBadge from '@/Components/Common/PoweredByBadge';
import { formatMoney } from '@/lib/utils';
import { useTournament } from '@/Context/TournamentContext';

/**
 * Fan-side "My Financing" surface — Sprint 15.
 *
 * Shows a fan every loan application they've submitted, who
 * underwrote it, the current status with a timeline chip, and the
 * interest terms once approved. New applications route to a
 * finance partner from the picker; without any finance partner
 * available the CTA is disabled and the empty state explains why.
 */
export default function LoanApplications({ auth, loans = [], financePartners = [], stats = {} }) {
    const { tournament } = useTournament();
    const hasPartners = financePartners.length > 0;
    const [expanded, setExpanded] = useState(false);
    const [form, setForm] = useState({
        amount: '',
        purpose: '',
        notes: '',
        finance_partner_id: financePartners[0]?.id || '',
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        router.post(route('fan.loan-applications.store'), form, {
            onFinish: () => setProcessing(false),
            onError: (errs) => setErrors(errs),
            onSuccess: () => {
                setForm({ amount: '', purpose: '', notes: '', finance_partner_id: financePartners[0]?.id || '' });
                setExpanded(false);
            },
        });
    };

    const withdraw = (id) => {
        if (confirm('Withdraw this application?')) {
            router.delete(route('fan.loan-applications.destroy', id));
        }
    };

    return (
        <FanLayout title="Financing">
            <Head title="Financing" />

            <DashboardHero
                role="fan"
                title="My financing"
                subtitle={`Track loan applications you've submitted for your ${tournament?.short_name || 'tournament'} trip.`}
                breadcrumbs={[
                    { label: 'Wallet', href: route('fan.wallet') },
                    { label: 'Financing' },
                ]}
            />

            <div className="summary-cards-grid">
                <StatCard
                    label="Applications"
                    value={stats.total ?? 0}
                    icon="fa-file-invoice-dollar"
                    variant="red"
                    subtext={`${stats.pending ?? 0} pending`}
                />
                <StatCard
                    label="Approved"
                    value={formatMoney(stats.approved_amount ?? 0)}
                    icon="fa-check-circle"
                    variant="blue"
                    subtext="Underwritten so far"
                />
                <StatCard
                    label="Disbursed"
                    value={formatMoney(stats.disbursed_amount ?? 0)}
                    icon="fa-hand-holding-usd"
                    variant="blue"
                    subtext="Landed in your account"
                />
                <StatCard
                    label="Partners available"
                    value={financePartners.length}
                    icon="fa-university"
                    variant="red"
                    subtext="Verified finance partners"
                />
            </div>

            <div className="content-card mt-4 p-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                        <i className="fas fa-hand-holding-usd"></i>
                        <h3>Apply for financing</h3>
                    </div>
                    {!expanded && (
                        <button
                            onClick={() => setExpanded(true)}
                            disabled={!hasPartners}
                            className="btn btn-warning"
                        >
                            <i className="fas fa-plus me-2"></i>
                            New application
                        </button>
                    )}
                </div>

                {!hasPartners && !expanded && (
                    <p className="text-white-50 mt-3 mb-0">
                        No finance partners are onboarded yet — check back soon or apply through the
                        Budget Calculator once a partner is available for your tournament.
                    </p>
                )}

                {expanded && (
                    <form onSubmit={submit} className="mt-3">
                        {financePartners.length > 1 && (
                            <div className="mb-3">
                                <div className="text-white-50 small text-uppercase mb-2" style={{ letterSpacing: '0.08em' }}>
                                    Route to
                                </div>
                                <div className="d-flex flex-wrap gap-2">
                                    {financePartners.map((p) => (
                                        <button
                                            type="button"
                                            key={p.id}
                                            onClick={() => setForm({ ...form, finance_partner_id: p.id })}
                                            className={`fan-partner-chip${form.finance_partner_id === p.id ? ' is-active' : ''}`}
                                            style={{ '--partner-accent': p.theme_accent || '#0072CE' }}
                                        >
                                            {p.logo_url ? (
                                                <img src={p.logo_url} alt={p.display_name} />
                                            ) : (
                                                <span className="fan-partner-chip__fallback">{p.display_name.charAt(0)}</span>
                                            )}
                                            <span>{p.display_name}</span>
                                            {p.verified && <i className="fas fa-check-circle text-success"></i>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="row g-3">
                            <div className="col-md-4">
                                <label className="form-label text-white-50">Amount (USD)</label>
                                <input
                                    type="number"
                                    min="1000"
                                    value={form.amount}
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                    className="form-control"
                                    placeholder="e.g. 3500"
                                    required
                                />
                                {errors.amount && <div className="text-danger small mt-1">{errors.amount}</div>}
                            </div>
                            <div className="col-md-8">
                                <label className="form-label text-white-50">Purpose</label>
                                <input
                                    type="text"
                                    value={form.purpose}
                                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                                    className="form-control"
                                    placeholder={`e.g. ${tournament?.short_name || 'Tournament'} travel funding`}
                                    required
                                />
                                {errors.purpose && <div className="text-danger small mt-1">{errors.purpose}</div>}
                            </div>
                            <div className="col-12">
                                <label className="form-label text-white-50">Additional notes (optional)</label>
                                <textarea
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    className="form-control"
                                    rows="2"
                                    placeholder="Anything the underwriter should know?"
                                />
                            </div>
                        </div>

                        <div className="d-flex justify-content-end gap-2 mt-3">
                            <button
                                type="button"
                                onClick={() => setExpanded(false)}
                                className="btn btn-outline-secondary"
                            >
                                Cancel
                            </button>
                            <button type="submit" disabled={processing || !form.finance_partner_id} className="btn btn-warning">
                                <i className="fas fa-paper-plane me-2"></i>
                                {processing ? 'Submitting…' : 'Submit application'}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            <div className="content-card mt-4 p-4">
                <div className="card-header d-flex align-items-center gap-2">
                    <i className="fas fa-list-check"></i>
                    <h3>My applications</h3>
                </div>

                {loans.length === 0 ? (
                    <div className="empty-state">
                        <i className="fas fa-file-invoice-dollar"></i>
                        <h4>No applications yet</h4>
                        <p>Submit your first financing request above.</p>
                    </div>
                ) : (
                    <div className="loan-list mt-3">
                        {loans.map((loan) => <LoanRow key={loan.id} loan={loan} onWithdraw={withdraw} />)}
                    </div>
                )}
            </div>
        </FanLayout>
    );
}

const STAGES = ['PENDING', 'APPROVED', 'DISBURSED'];

function LoanRow({ loan, onWithdraw }) {
    const activeIdx = STAGES.indexOf(loan.status);
    const rejected = loan.status === 'REJECTED';

    return (
        <div className="loan-row">
            <div className="loan-row__head">
                <div>
                    <div className="loan-row__ref">{loan.reference_id}</div>
                    <div className="loan-row__amount">{formatMoney(loan.amount)}</div>
                    {loan.purpose && <div className="loan-row__purpose">{loan.purpose}</div>}
                </div>
                <div className="loan-row__meta">
                    <span className={`loan-status loan-status--${loan.status.toLowerCase()}`}>{loan.status}</span>
                    {loan.status === 'PENDING' && (
                        <button className="btn btn-sm btn-link text-danger p-0" onClick={() => onWithdraw(loan.id)}>
                            Withdraw
                        </button>
                    )}
                </div>
            </div>

            {loan.partner && (
                <div className="loan-row__partner">
                    <PoweredByBadge publisher={loan.partner} variant="chip" />
                </div>
            )}

            {!rejected && (
                <div className="loan-timeline">
                    {STAGES.map((stage, i) => (
                        <div
                            key={stage}
                            className={`loan-timeline__step${i <= activeIdx ? ' is-done' : ''}${i === activeIdx ? ' is-current' : ''}`}
                        >
                            <span className="loan-timeline__dot"></span>
                            <span className="loan-timeline__label">{stage}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="loan-row__facts">
                {loan.budget && (
                    <span>
                        <i className="fas fa-file-invoice me-1"></i>
                        Attached to {loan.budget.reference_id} (
                        {formatMoney(loan.budget.total_cost)}
                        {loan.budget.nights ? ` · ${loan.budget.nights} nights` : ''}
                        )
                    </span>
                )}
                {loan.interest_rate != null && (
                    <span><i className="fas fa-percent me-1"></i>{Number(loan.interest_rate).toFixed(2)}% interest</span>
                )}
                <span><i className="far fa-calendar me-1"></i>Applied {new Date(loan.created_at).toLocaleDateString()}</span>
            </div>

            {loan.notes && (
                <div className="loan-row__notes">
                    <strong>Notes:</strong> {loan.notes}
                </div>
            )}
        </div>
    );
}
