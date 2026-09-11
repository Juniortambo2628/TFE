import React, { useState } from 'react';
import { router, useForm } from '@inertiajs/react';

/**
 * FinanceThisTrip — Sprint 14 CTA rendered on the BudgetCalculator
 * step-3 result view. Given the running budget total and a list of
 * finance partners, the fan picks one, tweaks amount + purpose, and
 * submits an application against this budget.
 *
 * Empty partner list ⇒ nothing renders. One partner ⇒ direct CTA.
 * Multiple ⇒ picker row.
 */
export default function FinanceThisTrip({ financePartners = [], budgetTotal, budgetId }) {
    if (!financePartners.length || !budgetTotal) return null;

    const [selected, setSelected] = useState(financePartners[0]);
    const [expanded, setExpanded] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        amount: Math.round(budgetTotal),
        purpose: 'Tournament trip financing',
        budget_id: budgetId || null,
        finance_partner_id: financePartners[0].id,
        notes: '',
    });

    const pickPartner = (partner) => {
        setSelected(partner);
        setData('finance_partner_id', partner.id);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('fan.loan-applications.store'), {
            preserveScroll: true,
            onSuccess: () => setExpanded(false),
        });
    };

    return (
        <div className="finance-cta" style={{ '--partner-accent': selected.theme_accent || '#0072CE' }}>
            <div className="finance-cta__header">
                <div className="finance-cta__lead">
                    <div className="finance-cta__eyebrow">Not paying up-front?</div>
                    <h4 className="finance-cta__title">Finance this trip</h4>
                    <p className="finance-cta__body">
                        Apply against your budget total and get an underwriting decision from a verified
                        Ecobank-backed finance partner.
                    </p>
                </div>
                {!expanded && (
                    <button type="button" className="finance-cta__btn" onClick={() => setExpanded(true)}>
                        <i className="fas fa-hand-holding-usd"></i>
                        Explore financing
                    </button>
                )}
            </div>

            {expanded && (
                <form onSubmit={submit} className="finance-cta__form">
                    {financePartners.length > 1 && (
                        <>
                            <div className="finance-cta__label">Choose a finance partner</div>
                            <div className="finance-cta__partner-row">
                                {financePartners.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => pickPartner(p)}
                                        className={`finance-cta__partner${selected.id === p.id ? ' is-active' : ''}`}
                                    >
                                        {p.logo_url ? (
                                            <img src={p.logo_url} alt={p.display_name} />
                                        ) : (
                                            <span className="finance-cta__partner-fallback">
                                                {p.display_name.charAt(0)}
                                            </span>
                                        )}
                                        <span>{p.display_name}</span>
                                        {p.verified && <i className="fas fa-check-circle text-success"></i>}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    <div className="finance-cta__grid">
                        <label>
                            <span>Amount (USD)</span>
                            <input
                                type="number"
                                value={data.amount}
                                onChange={(e) => setData('amount', e.target.value)}
                                min="1000"
                            />
                            {errors.amount && <em>{errors.amount}</em>}
                        </label>
                        <label>
                            <span>Purpose</span>
                            <input
                                type="text"
                                value={data.purpose}
                                onChange={(e) => setData('purpose', e.target.value)}
                            />
                            {errors.purpose && <em>{errors.purpose}</em>}
                        </label>
                    </div>

                    <label className="finance-cta__notes">
                        <span>Notes (optional)</span>
                        <textarea
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            rows={2}
                            placeholder="Anything the underwriter should know?"
                        />
                    </label>

                    <div className="finance-cta__actions">
                        <button type="button" onClick={() => setExpanded(false)} className="finance-cta__cancel">
                            Cancel
                        </button>
                        <button type="submit" disabled={processing} className="finance-cta__btn">
                            <i className="fas fa-paper-plane"></i>
                            Submit application
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
