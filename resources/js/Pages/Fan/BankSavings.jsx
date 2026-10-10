import React from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import FanLayout from '@/Layouts/FanLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import ContentCard from '@/Components/Common/ContentCard';
import ConfirmationDialog from '@/Components/ConfirmationDialog';
import { formatMoney, formatDateTime } from '@/lib/utils';
import { savingsProgress } from '@/lib/savings';
import '../../../css/trust-signals.css';
import '../../../css/trip-planner.css';

/**
 * A fan's trip savings account at their bank (Sprint 67, prototype).
 *
 * Every number on this page was fetched from the bank on THIS request, behind
 * a fresh password check, and is not stored by TFE. "As of" says when.
 */
export default function BankSavings({ link, goal, available, balances = {}, asOf, transactions = [], currencies = [] }) {
    const [confirmDisconnect, setConfirmDisconnect] = React.useState(false);
    const deposit = useForm({ amount: '', currency: goal?.currency && currencies.includes(goal.currency) ? goal.currency : (currencies[0] || 'USD') });
    const progress = savingsProgress({ balances, goal });

    return (
        <FanLayout title="Trip savings">
            <Head title="Trip savings" />
            <div className="container-fluid">
                <DashboardHero
                    role="fan"
                    title={goal ? `Saving for ${goal.name}` : 'Trip savings'}
                    subtitle={`Your account at ${link.bank}. TFE shows it; the bank holds it.`}
                    bgImage="/assets/img/fan/backgrounds/finance_hero.png"
                    breadcrumbs={[{ label: 'Savings goals', href: route('fan.savings-goals') }, { label: link.bank }]}
                />

                {!available && (
                    <div className="tfe-empty tfe-empty--inline mt-4">
                        <div className="tfe-empty__title">{link.bank} is not responding right now.</div>
                        <div className="tfe-empty__body">Your money is safe at the bank — TFE just cannot show it this minute. Try again shortly.</div>
                    </div>
                )}

                {available && (
                    <div className="tfe-card-grid tfe-card-grid--2 mt-4">
                        <ContentCard title="Saved" subtitle={asOf ? `From ${link.bank}, ${formatDateTime(asOf)}` : null}>
                            {Object.keys(balances).length === 0 ? (
                                <p className="tfe-form-help mb-0">Nothing saved yet — make your first deposit below.</p>
                            ) : (
                                <dl className="tfe-planner-breakdown">
                                    {Object.entries(balances).map(([cur, amt]) => (
                                        <div key={cur}><dt>{cur}</dt><dd>{formatMoney(amt, cur)}</dd></div>
                                    ))}
                                </dl>
                            )}
                            {progress && (
                                <div className="mt-3">
                                    <div className="d-flex justify-content-between tfe-form-help">
                                        <span>{formatMoney(progress.saved, progress.currency)} of {formatMoney(progress.target, progress.currency)}</span>
                                        <span>{progress.pct}%</span>
                                    </div>
                                    <div className="tfe-savings-bar" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}>
                                        <span style={{ width: `${progress.pct}%` }} />
                                    </div>
                                    {Object.keys(balances).some((c) => c !== progress.currency && balances[c] > 0) && (
                                        <p className="tfe-form-help mt-2 mb-0">
                                            Only {progress.currency} counts toward this goal here. Savings in other currencies are still yours —
                                            {' '}{link.bank} converts them at its own rate when it pays a partner.
                                        </p>
                                    )}
                                    {progress.perMonth !== null && (
                                        <p className="tfe-form-help mt-2 mb-0">
                                            Save about {formatMoney(progress.perMonth, progress.currency)} a month to reach it by {goal.target_date}.
                                        </p>
                                    )}
                                </div>
                            )}
                        </ContentCard>

                        <ContentCard title="Add to your savings" subtitle="The money goes straight to the bank.">
                            <form
                                onSubmit={(e) => { e.preventDefault(); deposit.post(route('fan.bank-savings.deposit', link.id)); }}
                                className="tfe-form-grid tfe-form-grid--2"
                            >
                                <div className="tfe-form-field">
                                    <label className="tfe-form-label" htmlFor="dep-amount">Amount</label>
                                    <input id="dep-amount" className="tfe-input" inputMode="decimal" value={deposit.data.amount} onChange={(e) => deposit.setData('amount', e.target.value)} />
                                    {deposit.errors.amount && <div className="tfe-form-error">{deposit.errors.amount}</div>}
                                </div>
                                <div className="tfe-form-field">
                                    <label className="tfe-form-label" htmlFor="dep-cur">Currency</label>
                                    <select id="dep-cur" className="tfe-select" value={deposit.data.currency} onChange={(e) => deposit.setData('currency', e.target.value)}>
                                        {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="tfe-form-field tfe-form-field--wide">
                                    <button type="submit" className="tfe-btn tfe-btn--filled" disabled={deposit.processing || !deposit.data.amount}>
                                        <i className="fas fa-mobile-alt" aria-hidden="true"></i> Deposit with {link.bank}
                                    </button>
                                </div>
                            </form>
                        </ContentCard>
                    </div>
                )}

                {available && (
                    <ContentCard className="mt-4" title="History" subtitle="From the bank. Not stored by TFE.">
                        {transactions.length === 0 ? (
                            <p className="tfe-form-help mb-0">No transactions yet.</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="tfe-table tfe-table--compact">
                                    <thead><tr><th>Date</th><th>Description</th><th className="text-end">Amount</th></tr></thead>
                                    <tbody>
                                        {transactions.map((t) => (
                                            <tr key={t.reference}>
                                                <td>{new Date(t.occurred_at).toLocaleDateString()}</td>
                                                <td>{t.description}</td>
                                                <td className="text-end">{t.amount < 0 ? '−' : '+'}{formatMoney(Math.abs(t.amount), t.currency)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </ContentCard>
                )}

                <ContentCard className="mt-4" title="Connection">
                    <p className="tfe-form-help">
                        Connected {link.consented_at ? new Date(link.consented_at).toLocaleDateString() : ''}. TFE can show your balance and history,
                        start deposits, and ask {link.bank} to pay a partner when you authorise it.
                    </p>
                    <button type="button" className="tfe-btn tfe-btn--sm" onClick={() => setConfirmDisconnect(true)}>
                        Disconnect from TFE
                    </button>
                </ContentCard>
            </div>

            <ConfirmationDialog
                open={confirmDisconnect}
                onOpenChange={setConfirmDisconnect}
                title="Disconnect this account?"
                description={`TFE will stop showing this account. The account and your money stay at ${link.bank} — contact them to close it.`}
                confirmText="Disconnect"
                onConfirm={() => router.delete(route('fan.bank-savings.disconnect', link.id))}
            />
        </FanLayout>
    );
}
