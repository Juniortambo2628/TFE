import React, { useMemo, useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import FanLayout from '@/Layouts/FanLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import SummaryTiles from '@/Components/Common/SummaryTiles';
import PoweredByBadge from '@/Components/Common/PoweredByBadge';
import AccentCard from '@/Components/Common/AccentCard';
import TfeModal from '@/Components/Common/TfeModal';
import { formatMoney } from '@/lib/utils';
import { useTournament } from '@/Context/TournamentContext';

/**
 * Fan-side "My Financing" surface.
 *
 * Sprint 43 — the inline "Apply for financing" form is gone. In its
 * place: a grid of partner financing packages (Listings published by
 * finance partners) when any are approved+active for the active
 * tournament, and a request-financing CTA that either opens the
 * wizard (against a saved budget) or sends the fan to the budget
 * calculator to build one first. The wizard collects the basics plus
 * explicit consent to share the fan's details with the finance
 * partner, and confirms the request has been made.
 */
export default function LoanApplications({
    auth,
    loans = [],
    financePartners = [],
    offerings = [],
    savedBudgets = [],
    stats = {},
}) {
    const { tournament } = useTournament();
    const hasPartners = financePartners.length > 0;
    const hasBudgets = savedBudgets.length > 0;
    const [wizardOpen, setWizardOpen] = useState(false);

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
                subtitle={`Explore financing packages or request bespoke terms against your ${tournament?.short_name || 'tournament'} trip.`}
                breadcrumbs={[
                    { label: 'Wallet', href: route('fan.wallet') },
                    { label: 'Financing' },
                ]}
            />

            <SummaryTiles
                items={[
                    { label: 'Applications',       value: stats.total ?? 0,                                    icon: 'fa-file-invoice-dollar', accent: 'red',  subtext: `${stats.pending ?? 0} pending` },
                    { label: 'Approved',           value: formatMoney(stats.approved_amount ?? 0, 'USD'),      icon: 'fa-check-circle',        accent: 'blue', subtext: 'Underwritten so far' },
                    { label: 'Disbursed',          value: formatMoney(stats.disbursed_amount ?? 0, 'USD'),     icon: 'fa-hand-holding-usd',    accent: 'teal', subtext: 'Landed in your account' },
                    { label: 'Partners available', value: financePartners.length,                              icon: 'fa-university',          accent: 'rose', subtext: 'Verified finance partners' },
                ]}
            />

            <FinancingOptionsSection
                offerings={offerings}
                hasBudgets={hasBudgets}
                hasPartners={hasPartners}
                onRequestFinancing={() => setWizardOpen(true)}
            />

            <div className="content-card mt-4 p-4">
                <div className="card-header d-flex align-items-center gap-2">
                    <i className="fas fa-list-check"></i>
                    <h3>My applications</h3>
                </div>

                {loans.length === 0 ? (
                    <ApplicationsEmpty
                        hasPartners={hasPartners}
                        hasBudgets={hasBudgets}
                        onRequestFinancing={() => setWizardOpen(true)}
                    />
                ) : (
                    <div className="loan-list mt-3">
                        {loans.map((loan) => <LoanRow key={loan.id} loan={loan} onWithdraw={withdraw} />)}
                    </div>
                )}
            </div>

            <RequestFinancingWizard
                open={wizardOpen}
                onClose={() => setWizardOpen(false)}
                budgets={savedBudgets}
                partners={financePartners}
                tournament={tournament}
            />
        </FanLayout>
    );
}

/* ── Section: financing options ─────────────────────────────────────── */

function FinancingOptionsSection({ offerings, hasBudgets, hasPartners, onRequestFinancing }) {
    const hasOfferings = offerings.length > 0;

    return (
        <div className="content-card mt-4 p-4">
            <div className="card-header d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                    <i className="fas fa-hand-holding-usd"></i>
                    <h3>Financing options</h3>
                </div>
                <span className="text-white-50 small">
                    {hasOfferings
                        ? `${offerings.length} ${offerings.length === 1 ? 'package' : 'packages'} available`
                        : 'Custom request'}
                </span>
            </div>

            {hasOfferings ? (
                <>
                    <p className="text-white-50 mt-3 mb-3" style={{ maxWidth: 640 }}>
                        Packages published by verified finance partners for this tournament.
                        Pick one to see the terms, or request bespoke financing against your budget.
                    </p>
                    <div className="row g-3">
                        {offerings.map((o) => (
                            <div key={o.id} className="col-md-6 col-lg-4 col-xl-3">
                                <OfferingCard offering={o} />
                            </div>
                        ))}
                    </div>
                    <RequestCustomRow
                        variant="inline"
                        hasBudgets={hasBudgets}
                        onRequestFinancing={onRequestFinancing}
                    />
                </>
            ) : (
                <RequestCustomRow
                    variant="hero"
                    hasBudgets={hasBudgets}
                    hasPartners={hasPartners}
                    onRequestFinancing={onRequestFinancing}
                />
            )}
        </div>
    );
}

function OfferingCard({ offering }) {
    const accent = offering.publisher?.theme_accent || '#0072CE';
    return (
        <AccentCard
            LinkComponent={Link}
            href={route('fan.packages.show', offering.id)}
            accent={accent}
            artwork={offering.hero_image
                ? { src: offering.hero_image, alt: offering.name, variant: 'thumb' }
                : { icon: 'fas fa-hand-holding-usd' }}
            title={offering.name}
            desc={offering.description}
            eyebrow={offering.publisher?.display_name}
            meta={[
                { label: 'From', value: `${offering.currency || 'USD'} ${Number(offering.base_price).toLocaleString()}` },
            ]}
            cta={{ label: offering.is_sold_out ? 'Sold out' : 'View details', icon: offering.is_sold_out ? null : 'fas fa-arrow-right' }}
        />
    );
}

function RequestCustomRow({ variant, hasBudgets, hasPartners = true, onRequestFinancing }) {
    if (variant === 'inline') {
        return (
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                    <div className="text-white fw-semibold">Nothing here fits?</div>
                    <div className="text-white-50 small">
                        Request bespoke financing against your proposed budget.
                    </div>
                </div>
                {hasBudgets ? (
                    <button type="button" onClick={onRequestFinancing} className="tfe-btn tfe-btn--filled" disabled={!hasPartners}>
                        <i className="fas fa-file-signature"></i>
                        Request financing
                    </button>
                ) : (
                    <Link href={route('fan.budget-calculator')} className="tfe-btn tfe-btn--filled">
                        <i className="fas fa-calculator"></i>
                        Build a budget
                    </Link>
                )}
            </div>
        );
    }

    if (!hasPartners) {
        return (
            <div className="tfe-empty mt-3">
                <div className="tfe-empty__icon"><i className="fas fa-university"></i></div>
                <h4 className="tfe-empty__title">No finance partners onboarded yet</h4>
                <p className="tfe-empty__body">
                    Verified banks and lenders will show up here as soon as they publish
                    packages for this tournament.
                </p>
            </div>
        );
    }

    return (
        <div className="tfe-empty mt-3">
            <div className="tfe-empty__icon"><i className="fas fa-hand-holding-usd"></i></div>
            <h4 className="tfe-empty__title">
                {hasBudgets ? 'Request financing against your budget' : 'Build your budget first'}
            </h4>
            <p className="tfe-empty__body">
                {hasBudgets
                    ? 'No pre-published packages yet — send a bespoke request to a verified finance partner using your proposed budget as the basis.'
                    : 'Open the budget calculator, save your itinerary, then come back to request financing against the full trip.'}
            </p>
            <div className="tfe-empty__action">
                {hasBudgets ? (
                    <button type="button" onClick={onRequestFinancing} className="tfe-btn tfe-btn--filled">
                        <i className="fas fa-file-signature"></i>
                        Request financing
                    </button>
                ) : (
                    <Link href={route('fan.budget-calculator')} className="tfe-btn tfe-btn--filled">
                        <i className="fas fa-calculator"></i>
                        Open the budget calculator
                    </Link>
                )}
            </div>
        </div>
    );
}

function ApplicationsEmpty({ hasPartners, hasBudgets, onRequestFinancing }) {
    if (!hasPartners) {
        return (
            <div className="tfe-empty mt-3">
                <div className="tfe-empty__icon"><i className="fas fa-file-invoice-dollar"></i></div>
                <h4 className="tfe-empty__title">No applications yet</h4>
                <p className="tfe-empty__body">
                    Once verified finance partners are onboarded for this tournament,
                    your submitted requests will show up here.
                </p>
            </div>
        );
    }

    return (
        <div className="tfe-empty mt-3">
            <div className="tfe-empty__icon"><i className="fas fa-file-invoice-dollar"></i></div>
            <h4 className="tfe-empty__title">No applications yet</h4>
            <p className="tfe-empty__body">
                {hasBudgets
                    ? 'Send your first request — it takes a minute and the partner replies inside the platform.'
                    : 'Build a budget first, then request financing against the full trip.'}
            </p>
            <div className="tfe-empty__action">
                {hasBudgets ? (
                    <button type="button" onClick={onRequestFinancing} className="tfe-btn tfe-btn--filled">
                        <i className="fas fa-file-signature"></i>
                        Request financing
                    </button>
                ) : (
                    <Link href={route('fan.budget-calculator')} className="tfe-btn tfe-btn--filled">
                        <i className="fas fa-calculator"></i>
                        Open the budget calculator
                    </Link>
                )}
            </div>
        </div>
    );
}

/* ── Request-financing wizard (TfeModal) ────────────────────────────── */

function RequestFinancingWizard({ open, onClose, budgets, partners, tournament }) {
    const primaryBudget = useMemo(
        () => budgets.find((b) => b.is_active) || budgets[0] || null,
        [budgets],
    );
    const [step, setStep] = useState(1);
    const [budgetId, setBudgetId] = useState(primaryBudget?.id || '');
    const [partnerId, setPartnerId] = useState(partners[0]?.id || '');
    const [notes, setNotes] = useState('');
    const [consent, setConsent] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const budget = budgets.find((b) => b.id === Number(budgetId) || b.id === budgetId) || primaryBudget;
    const partner = partners.find((p) => p.id === Number(partnerId) || p.id === partnerId) || partners[0];

    const reset = () => {
        setStep(1);
        setBudgetId(primaryBudget?.id || '');
        setPartnerId(partners[0]?.id || '');
        setNotes('');
        setConsent(false);
        setErrors({});
        setSubmitted(false);
    };

    const close = () => {
        onClose();
        // Delay reset so the modal fades before losing state.
        setTimeout(reset, 200);
    };

    const submit = () => {
        if (!consent || !budget || !partner) return;
        setProcessing(true);
        setErrors({});
        router.post(
            route('fan.loan-applications.store'),
            {
                budget_id: budget.id,
                finance_partner_id: partner.id,
                amount: Math.round(budget.total_cost),
                purpose: `Financing for ${tournament?.short_name || 'tournament'} trip — ${budget.reference_id}`,
                notes,
                consent: true,
            },
            {
                preserveScroll: true,
                onError: (errs) => setErrors(errs),
                onSuccess: () => setSubmitted(true),
                onFinish: () => setProcessing(false),
            },
        );
    };

    if (!open) return null;

    // Confirmation panel.
    if (submitted) {
        return (
            <TfeModal open={open} title="Application submitted" onClose={close} size="md">
                <div className="tfe-empty" style={{ padding: '24px 8px' }}>
                    <div className="tfe-empty__icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' }}>
                        <i className="fas fa-check"></i>
                    </div>
                    <h4 className="tfe-empty__title">Your request is with {partner?.display_name || 'the finance partner'}</h4>
                    <p className="tfe-empty__body">
                        The application is now on the finance partner's portal for review.
                        You'll receive an update — approved, more info needed, or a decision —
                        in your notifications and on this page.
                    </p>
                    <div className="tfe-empty__action">
                        <button type="button" onClick={close} className="tfe-btn tfe-btn--filled">
                            Done
                        </button>
                    </div>
                </div>
            </TfeModal>
        );
    }

    const totalSteps = partners.length > 1 ? 3 : 2;
    const isBudgetStep = step === 1;
    const isPartnerStep = step === 2 && partners.length > 1;
    const isConsentStep = step === totalSteps;

    return (
        <TfeModal
            open={open}
            title="Request financing"
            onClose={close}
            size="md"
            footer={
                <div className="d-flex justify-content-between align-items-center w-100">
                    <span className="text-white-50 small">Step {step} of {totalSteps}</span>
                    <div className="d-flex gap-2">
                        {step > 1 && (
                            <button type="button" onClick={() => setStep(step - 1)} className="tfe-btn">
                                Back
                            </button>
                        )}
                        {step < totalSteps ? (
                            <button
                                type="button"
                                onClick={() => setStep(step + 1)}
                                disabled={isBudgetStep ? !budget : isPartnerStep ? !partner : false}
                                className="tfe-btn tfe-btn--filled"
                            >
                                Continue
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={submit}
                                disabled={processing || !consent || !budget || !partner}
                                className="tfe-btn tfe-btn--filled"
                            >
                                <i className="fas fa-paper-plane"></i>
                                {processing ? 'Submitting…' : 'Submit application'}
                            </button>
                        )}
                    </div>
                </div>
            }
        >
            {isBudgetStep && (
                <WizardStepBudget
                    budgets={budgets}
                    budgetId={budgetId}
                    setBudgetId={setBudgetId}
                />
            )}

            {isPartnerStep && (
                <WizardStepPartner
                    partners={partners}
                    partnerId={partnerId}
                    setPartnerId={setPartnerId}
                />
            )}

            {isConsentStep && (
                <WizardStepConsent
                    budget={budget}
                    partner={partner}
                    notes={notes}
                    setNotes={setNotes}
                    consent={consent}
                    setConsent={setConsent}
                    errors={errors}
                />
            )}
        </TfeModal>
    );
}

function WizardStepBudget({ budgets, budgetId, setBudgetId }) {
    if (!budgets.length) {
        return (
            <div className="tfe-empty" style={{ padding: '16px 0' }}>
                <div className="tfe-empty__icon"><i className="fas fa-calculator"></i></div>
                <h4 className="tfe-empty__title">No saved budgets yet</h4>
                <p className="tfe-empty__body">
                    Build and save one in the budget calculator, then come back to request
                    financing against it.
                </p>
                <div className="tfe-empty__action">
                    <Link href={route('fan.budget-calculator')} className="tfe-btn tfe-btn--filled">
                        <i className="fas fa-calculator"></i>
                        Open the budget calculator
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="tfe-form-label mb-2">Which budget are you financing?</div>
            <p className="text-white-50 small mb-3">
                The partner sees the itinerary you attach here — matches, nights and total cost.
            </p>
            <div className="d-flex flex-column gap-2">
                {budgets.map((b) => (
                    <label
                        key={b.id}
                        className={`fan-partner-chip w-100${String(budgetId) === String(b.id) ? ' is-active' : ''}`}
                        style={{ '--partner-accent': '#0072CE', cursor: 'pointer', textAlign: 'left', justifyContent: 'flex-start' }}
                    >
                        <input
                            type="radio"
                            name="budget"
                            value={b.id}
                            checked={String(budgetId) === String(b.id)}
                            onChange={() => setBudgetId(b.id)}
                            style={{ marginRight: 6 }}
                        />
                        <span className="flex-fill">
                            <strong className="d-block text-white">{b.name || b.reference_id}</strong>
                            <span className="text-white-50 small">
                                {b.reference_id} · {formatMoney(b.total_cost, b.currency || 'USD')}
                                {b.nights ? ` · ${b.nights} nights` : ''}
                                {b.is_active ? ' · Active plan' : ''}
                            </span>
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );
}

function WizardStepPartner({ partners, partnerId, setPartnerId }) {
    return (
        <div>
            <div className="tfe-form-label mb-2">Route this request to</div>
            <p className="text-white-50 small mb-3">
                Pick a verified finance partner. They'll review the attached budget and reply
                inside the platform.
            </p>
            <div className="d-flex flex-wrap gap-2">
                {partners.map((p) => (
                    <button
                        type="button"
                        key={p.id}
                        onClick={() => setPartnerId(p.id)}
                        className={`fan-partner-chip${String(partnerId) === String(p.id) ? ' is-active' : ''}`}
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
    );
}

function WizardStepConsent({ budget, partner, notes, setNotes, consent, setConsent, errors }) {
    return (
        <div>
            <div className="tfe-form-label mb-2">Review your request</div>
            <div className="tfe-slab tfe-slab--flush mb-3" style={{ padding: 16 }}>
                <div className="d-flex justify-content-between align-items-start gap-3">
                    <div>
                        <div className="text-white-50 small">Amount</div>
                        <div className="text-white fw-bold" style={{ fontSize: '1.15rem' }}>
                            {formatMoney(Math.round(budget?.total_cost || 0), 'USD')}
                        </div>
                        <div className="text-white-50 small mt-1">
                            From budget {budget?.reference_id}
                            {budget?.currency && budget.currency !== 'USD'
                                ? ` (built in ${budget.currency})`
                                : ''}
                        </div>
                    </div>
                    {partner && <PoweredByBadge publisher={partner} variant="chip" />}
                </div>
            </div>

            <label className="tfe-form-label" htmlFor="req-notes">
                Anything the underwriter should know? (optional)
            </label>
            <textarea
                id="req-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="tfe-input"
                rows="3"
                maxLength={1000}
                placeholder="Employment, existing repayment plans, preferred term…"
            />
            {errors.notes && <div className="text-danger small mt-1">{errors.notes}</div>}

            <label className="d-flex align-items-start gap-2 mt-3" style={{ cursor: 'pointer' }}>
                <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    style={{ marginTop: 4 }}
                />
                <span className="text-white-50 small">
                    I consent to sharing my contact details and the attached budget summary
                    with <strong className="text-white">{partner?.display_name || 'the finance partner'}</strong> so they can
                    review this application. I understand I can withdraw it while it's still pending.
                </span>
            </label>
            {errors.consent && <div className="text-danger small mt-1">{errors.consent}</div>}
            {errors.amount && <div className="text-danger small mt-1">{errors.amount}</div>}
            {errors.purpose && <div className="text-danger small mt-1">{errors.purpose}</div>}
        </div>
    );
}

/* ── Loan row ───────────────────────────────────────────────────────── */

const STAGES = ['PENDING', 'APPROVED', 'DISBURSED'];

function LoanRow({ loan, onWithdraw }) {
    const activeIdx = STAGES.indexOf(loan.status);
    const rejected = loan.status === 'REJECTED';

    return (
        <div className="loan-row">
            <div className="loan-row__head">
                <div>
                    <div className="loan-row__ref">{loan.reference_id}</div>
                    <div className="loan-row__amount">{formatMoney(loan.amount, 'USD')}</div>
                    {loan.purpose && <div className="loan-row__purpose">{loan.purpose}</div>}
                </div>
                <div className="loan-row__meta">
                    <span className={`loan-status loan-status--${loan.status.toLowerCase()}`}>{loan.status}</span>
                    {loan.status === 'PENDING' && (
                        <button className="tfe-btn tfe-btn--sm" onClick={() => onWithdraw(loan.id)}>
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
                        {formatMoney(loan.budget.total_cost, loan.budget.currency || 'USD')}
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
