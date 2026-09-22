import React, { useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import TfeModal from '@/Components/Common/TfeModal';
import PoweredByBadge from '@/Components/Common/PoweredByBadge';
import { formatMoney } from '@/lib/utils';

/**
 * RequestFinancingWizard — the one shared TfeModal wizard fans use to
 * apply for financing. Shipped in Sprint 43 as an inline definition on
 * Fan/LoanApplications; extracted to a shared component in Sprint 44 so
 * the Budget Calculator (which used to render an ugly inline
 * FinanceThisTrip form) reuses the exact same UX.
 *
 * Two entry points:
 *   1. `budgets` list  — the fan already has saved itineraries, picks
 *      one as the amount source.
 *   2. `currentEstimate` — the fan is mid-calculation on the calculator;
 *      no saved budget yet. We build a synthetic "Current itinerary
 *      estimate" as an additional option so the amount still comes from
 *      "the estimate of the final itinerary" (KT's phrasing) rather
 *      than a free-form form field.
 *
 * The consent step collects both a Terms &amp; Conditions acknowledgement
 * and a data-sharing consent, then a final submit.
 */
export default function RequestFinancingWizard({
    open,
    onClose,
    budgets = [],
    partners = [],
    tournament = null,
    currentEstimate = null,
    currentCurrency = 'USD',
}) {
    // Build the selectable list: saved budgets + a synthetic
    // "current calculator estimate" entry when we have one and no
    // saved budget is already active. Synthetic id 'current' is
    // reserved and never sent to the server as a budget_id.
    const options = useMemo(() => {
        const rows = budgets.map((b) => ({
            id: String(b.id),
            source: 'budget',
            title: b.name || b.reference_id,
            subtitle: [
                b.reference_id,
                formatMoney(b.total_cost, b.currency || 'USD'),
                b.nights ? `${b.nights} nights` : null,
                b.is_active ? 'Active plan' : null,
            ].filter(Boolean).join(' · '),
            amount: Math.round(Number(b.total_cost) || 0),
            currency: b.currency || 'USD',
            reference: b.reference_id,
            raw: b,
        }));
        if (Number(currentEstimate) > 0) {
            rows.unshift({
                id: 'current',
                source: 'current',
                title: 'Current itinerary estimate',
                subtitle: `From what you're building right now · ${formatMoney(currentEstimate, currentCurrency)}`,
                amount: Math.round(Number(currentEstimate) || 0),
                currency: currentCurrency,
                reference: null,
                raw: null,
            });
        }
        return rows;
    }, [budgets, currentEstimate, currentCurrency]);

    const primaryOptionId = options[0]?.id || '';
    const [step, setStep] = useState(1);
    const [pickedId, setPickedId] = useState(primaryOptionId);
    const [partnerId, setPartnerId] = useState(partners[0]?.id ? String(partners[0].id) : '');
    const [notes, setNotes] = useState('');
    const [consentTerms, setConsentTerms] = useState(false);
    const [consentShare, setConsentShare] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);

    // Reset internal state to the initial values every time the modal opens.
    // A fresh open() shouldn't inherit half-filled state from a prior aborted
    // run, and the picked option should track "what's most useful right now"
    // (the current calc if present, else the active budget).
    React.useEffect(() => {
        if (!open) return;
        setStep(1);
        setPickedId(primaryOptionId);
        setPartnerId(partners[0]?.id ? String(partners[0].id) : '');
        setNotes('');
        setConsentTerms(false);
        setConsentShare(false);
        setErrors({});
        setSubmitted(false);
    }, [open, primaryOptionId, partners]);

    const picked = options.find((o) => o.id === pickedId) || options[0] || null;
    const partner = partners.find((p) => String(p.id) === partnerId) || partners[0] || null;

    const close = () => {
        onClose?.();
    };

    const submit = () => {
        if (!consentTerms || !consentShare || !picked || !partner) return;
        setProcessing(true);
        setErrors({});
        const purpose = picked.reference
            ? `Financing for ${tournament?.short_name || 'tournament'} trip — ${picked.reference}`
            : `Financing for ${tournament?.short_name || 'tournament'} trip (calculator estimate)`;
        router.post(
            route('fan.loan-applications.store'),
            {
                budget_id: picked.source === 'budget' && picked.raw?.id ? picked.raw.id : null,
                finance_partner_id: partner.id,
                amount: picked.amount,
                purpose,
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
                        in your notifications and on the financing page.
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

    // Bail early when there's nothing to finance and no way to build one.
    if (!options.length) {
        return (
            <TfeModal open={open} title="Request financing" onClose={close} size="md">
                <div className="tfe-empty" style={{ padding: '16px 0' }}>
                    <div className="tfe-empty__icon"><i className="fas fa-calculator"></i></div>
                    <h4 className="tfe-empty__title">No itinerary to finance yet</h4>
                    <p className="tfe-empty__body">
                        Build a budget in the calculator and save it, then request
                        financing against the full trip.
                    </p>
                    <div className="tfe-empty__action">
                        <Link href={route('fan.budget-calculator')} className="tfe-btn tfe-btn--filled">
                            <i className="fas fa-calculator"></i>
                            Open the budget calculator
                        </Link>
                    </div>
                </div>
            </TfeModal>
        );
    }

    const totalSteps = partners.length > 1 ? 3 : 2;
    const isBudgetStep = step === 1;
    const isPartnerStep = step === 2 && partners.length > 1;
    const isConsentStep = step === totalSteps;
    const consentReady = consentTerms && consentShare;

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
                                disabled={isBudgetStep ? !picked : isPartnerStep ? !partner : false}
                                className="tfe-btn tfe-btn--filled"
                            >
                                Continue
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={submit}
                                disabled={processing || !consentReady || !picked || !partner}
                                className="tfe-btn tfe-btn--filled"
                            >
                                <i className="fas fa-paper-plane"></i>
                                {processing ? 'Submitting…' : 'Confirm & submit'}
                            </button>
                        )}
                    </div>
                </div>
            }
        >
            {isBudgetStep && (
                <StepPickBudget
                    options={options}
                    pickedId={pickedId}
                    setPickedId={setPickedId}
                />
            )}

            {isPartnerStep && (
                <StepPickPartner
                    partners={partners}
                    partnerId={partnerId}
                    setPartnerId={setPartnerId}
                />
            )}

            {isConsentStep && (
                <StepReviewConsent
                    picked={picked}
                    partner={partner}
                    notes={notes}
                    setNotes={setNotes}
                    consentTerms={consentTerms}
                    setConsentTerms={setConsentTerms}
                    consentShare={consentShare}
                    setConsentShare={setConsentShare}
                    errors={errors}
                />
            )}
        </TfeModal>
    );
}

function StepPickBudget({ options, pickedId, setPickedId }) {
    return (
        <div>
            <div className="tfe-form-label mb-2">Which itinerary are you financing?</div>
            <p className="text-white-50 small mb-3">
                The partner sees a summary of what you attach here — matches, nights and the total cost.
            </p>
            <div className="d-flex flex-column gap-2">
                {options.map((o) => (
                    <label
                        key={o.id}
                        className={`fan-partner-chip w-100${String(pickedId) === String(o.id) ? ' is-active' : ''}`}
                        style={{ '--partner-accent': '#0072CE', cursor: 'pointer', textAlign: 'left', justifyContent: 'flex-start' }}
                    >
                        <input
                            type="radio"
                            name="picked-budget"
                            value={o.id}
                            checked={String(pickedId) === String(o.id)}
                            onChange={() => setPickedId(o.id)}
                            style={{ marginRight: 6 }}
                        />
                        <span className="flex-fill">
                            <strong className="d-block text-white">{o.title}</strong>
                            <span className="text-white-50 small">{o.subtitle}</span>
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );
}

function StepPickPartner({ partners, partnerId, setPartnerId }) {
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
                        onClick={() => setPartnerId(String(p.id))}
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

function StepReviewConsent({
    picked, partner, notes, setNotes,
    consentTerms, setConsentTerms,
    consentShare, setConsentShare,
    errors,
}) {
    return (
        <div>
            <div className="tfe-form-label mb-2">Review your request</div>
            <div className="tfe-slab tfe-slab--flush mb-3" style={{ padding: 16 }}>
                <div className="d-flex justify-content-between align-items-start gap-3">
                    <div>
                        <div className="text-white-50 small">Amount</div>
                        <div className="text-white fw-bold" style={{ fontSize: '1.15rem' }}>
                            {formatMoney(picked?.amount || 0, picked?.currency || 'USD')}
                        </div>
                        <div className="text-white-50 small mt-1">
                            {picked?.reference
                                ? <>From budget {picked.reference}{picked.currency && picked.currency !== 'USD' ? ` (built in ${picked.currency})` : ''}</>
                                : <>Taken from your current calculator estimate</>}
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

            <div className="mt-3 d-flex flex-column gap-2">
                <label className="d-flex align-items-start gap-2" style={{ cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={consentTerms}
                        onChange={(e) => setConsentTerms(e.target.checked)}
                        style={{ marginTop: 4 }}
                    />
                    <span className="text-white-50 small">
                        I have read and agree to the platform's <strong className="text-white">terms and conditions</strong> for
                        financing requests, including the underwriting decision and any repayment
                        obligations the finance partner sets out.
                    </span>
                </label>

                <label className="d-flex align-items-start gap-2" style={{ cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={consentShare}
                        onChange={(e) => setConsentShare(e.target.checked)}
                        style={{ marginTop: 4 }}
                    />
                    <span className="text-white-50 small">
                        I consent to sharing my contact details and this itinerary summary
                        with <strong className="text-white">{partner?.display_name || 'the finance partner'}</strong> so they
                        can review the application. I understand I can withdraw it while it's pending.
                    </span>
                </label>
            </div>
            {errors.consent && <div className="text-danger small mt-1">{errors.consent}</div>}
            {errors.amount && <div className="text-danger small mt-1">{errors.amount}</div>}
            {errors.purpose && <div className="text-danger small mt-1">{errors.purpose}</div>}
        </div>
    );
}
