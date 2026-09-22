import React, { useEffect, useState } from 'react';
import RequestFinancingWizard from '@/Components/Fan/RequestFinancingWizard';

/**
 * FinanceThisTrip — the "Not paying up-front?" CTA that sits under the
 * Budget Calculator result. Sprint 44 rewrite: the inline form (amount +
 * purpose fields, in-place submit) is gone; the CTA now opens the shared
 * RequestFinancingWizard modal — same UX the /fan/loan-applications page
 * uses, with T&amp;C + data-sharing consent and an explicit confirm step.
 *
 * The pulse ring + dismissible "First time here?" hint from Sprint 27
 * stay: they're the reason first-time fans actually notice the CTA.
 */
const HINT_STORAGE_KEY = 'tfe_finance_hint_seen';

export default function FinanceThisTrip({
    financePartners = [],
    budgetTotal,
    budgetCurrency = 'USD',
    savedBudgets = [],
    tournament = null,
}) {
    if (!financePartners.length || !budgetTotal) return null;

    const [showHint, setShowHint] = useState(false);
    const [wizardOpen, setWizardOpen] = useState(false);
    const primaryPartner = financePartners[0];

    useEffect(() => {
        try {
            if (!localStorage.getItem(HINT_STORAGE_KEY)) {
                setShowHint(true);
            }
        } catch {
            // Private mode / storage disabled — the hint just won't show.
        }
    }, []);

    const dismissHint = () => {
        setShowHint(false);
        try { localStorage.setItem(HINT_STORAGE_KEY, '1'); } catch { /* noop */ }
    };

    const openWizard = () => {
        dismissHint();
        setWizardOpen(true);
    };

    return (
        <>
            <div
                className={`finance-cta${showHint ? ' finance-cta--pulse' : ''}`}
                style={{ '--partner-accent': primaryPartner?.theme_accent || '#0072CE' }}
            >
                {showHint && (
                    <div className="finance-cta__hint">
                        <i className="fas fa-arrow-down"></i>
                        <span>First time here? You can finance the trip below.</span>
                        <button type="button" onClick={dismissHint} className="finance-cta__hint-close" aria-label="Dismiss hint">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                )}
                <div className="finance-cta__header">
                    <div className="finance-cta__lead">
                        <div className="finance-cta__eyebrow">Not paying up-front?</div>
                        <h4 className="finance-cta__title">Finance this trip</h4>
                        <p className="finance-cta__body">
                            Apply against your current estimate and get an underwriting decision
                            from a verified finance partner. The amount and itinerary details
                            carry over automatically — no forms to retype.
                        </p>
                    </div>
                    <button type="button" className="finance-cta__btn" onClick={openWizard}>
                        <i className="fas fa-hand-holding-usd"></i>
                        Explore financing
                    </button>
                </div>
            </div>

            <RequestFinancingWizard
                open={wizardOpen}
                onClose={() => setWizardOpen(false)}
                budgets={savedBudgets}
                partners={financePartners}
                tournament={tournament}
                currentEstimate={budgetTotal}
                currentCurrency={budgetCurrency}
            />
        </>
    );
}
