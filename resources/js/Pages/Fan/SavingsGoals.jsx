import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import FanLayout from '@/Layouts/FanLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import SummaryTiles from '@/Components/Common/SummaryTiles';
import TfeModal from '@/Components/Common/TfeModal';
import { formatMoney } from '@/lib/utils';
import { SUPPORTED_CURRENCIES } from '@/Data/BudgetPricingData';
import { useTournament } from '@/Context/TournamentContext';

export default function SavingsGoals({ auth, goals }) {
    const { tournament } = useTournament();
    const [showForm, setShowForm] = useState(false);
    // Sprint 30 — a goal saves for one specific currency; a fan planning
    // a EUR trip should see their target in EUR, not the platform default.
    const [form, setForm] = useState({ name: '', target_amount: '', target_date: '', currency: 'USD' });
    const [processing, setProcessing] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post(route('fan.savings-goals.store'), form, {
            onFinish: () => setProcessing(false),
            onSuccess: () => {
                setForm({ name: '', target_amount: '', target_date: '', currency: 'USD' });
                setShowForm(false);
            },
        });
    };

    const remove = (id) => {
        if (confirm('Delete this savings goal?')) {
            router.delete(route('fan.savings-goals.destroy', id));
        }
    };

    const totalSaved = goals.reduce((sum, g) => sum + parseFloat(g.current_amount || 0), 0);
    const totalTarget = goals.reduce((sum, g) => sum + parseFloat(g.target_amount || 0), 0);
    // The aggregate tiles sum across every goal; when the fan mixes
    // currencies the sum is only meaningful once they agree, so we
    // label the totals in whichever currency their goals use most.
    const primaryCurrency = goals?.[0]?.currency || 'USD';

    return (
        <FanLayout title="Savings Goals">
            <Head title="Savings Goals" />

            <div className="pb-12">
                <DashboardHero role="fan"
                    title="Savings Goals"
                    subtitle={`Set targets and track your ${tournament?.short_name || 'tournament'} savings progress.`}
                    breadcrumbs={[{ label: 'Wallet', href: route('fan.wallet') }, { label: 'Savings' }]}
                    bgImage="/assets/img/fan/backgrounds/payments_hero.png"
                />

                <div className="container px-4 mx-auto -mt-8">
                    <SummaryTiles
                        className="mb-4"
                        items={[
                            { label: 'Total Saved',  value: formatMoney(totalSaved, primaryCurrency),  icon: 'fa-piggy-bank', accent: 'teal',  subtext: 'Across every goal' },
                            { label: 'Total Target', value: formatMoney(totalTarget, primaryCurrency), icon: 'fa-bullseye',   accent: 'blue',  subtext: 'What you’re aiming for' },
                            { label: 'Goals',        value: goals.length,                              icon: 'fa-flag',       accent: 'rose',  subtext: 'Open plans' },
                        ]}
                    />

                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2 className="text-xl font-bold text-white m-0">My Goals</h2>
                        <button
                            type="button"
                            onClick={() => setShowForm(true)}
                            className="tfe-btn tfe-btn--filled"
                        >
                            <i className="fas fa-plus me-2"></i> New Goal
                        </button>
                    </div>

                    <TfeModal open={showForm} title="Create savings goal" onClose={() => setShowForm(false)} size="md">
                        <form onSubmit={submit}>
                            <div className="tfe-form-field">
                                <label className="tfe-form-label">Goal name</label>
                                <input
                                    type="text"
                                    className="tfe-input"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder={`e.g. ${tournament?.short_name || 'Tournament'} Tickets Fund`}
                                    required
                                />
                            </div>
                            <div className="row g-3 mt-1">
                                <div className="col-8">
                                    <label className="tfe-form-label">Target amount</label>
                                    <input
                                        type="number"
                                        className="tfe-input"
                                        value={form.target_amount}
                                        onChange={e => setForm({ ...form, target_amount: e.target.value })}
                                        placeholder="e.g. 5000"
                                        required
                                        min="1000"
                                    />
                                </div>
                                <div className="col-4">
                                    <label className="tfe-form-label">Currency</label>
                                    <select
                                        className="tfe-select"
                                        value={form.currency}
                                        onChange={e => setForm({ ...form, currency: e.target.value })}
                                    >
                                        {SUPPORTED_CURRENCIES.map(c => (
                                            <option key={c.code} value={c.code}>{c.code}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-12">
                                    <label className="tfe-form-label">Target date <span className="tfe-form-help">(optional)</span></label>
                                    <input
                                        type="date"
                                        className="tfe-input"
                                        value={form.target_date}
                                        onChange={e => setForm({ ...form, target_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="d-flex justify-content-end gap-2 mt-4">
                                <button type="button" className="tfe-btn" onClick={() => setShowForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="tfe-btn tfe-btn--filled" disabled={processing}>
                                    {processing ? 'Creating…' : 'Create goal'}
                                </button>
                            </div>
                        </form>
                    </TfeModal>

                    {goals.length === 0 ? (
                        <div className="bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
                            <i className="fas fa-piggy-bank text-4xl text-white/20 mb-4"></i>
                            <p className="text-white/60">No savings goals yet. Create one to start tracking!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {goals.map(goal => {
                                const progress = goal.target_amount > 0
                                    ? Math.min((parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) * 100, 100)
                                    : 0;
                                return (
                                    <div key={goal.id} className="bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="text-white font-semibold">{goal.name}</h3>
                                                <p className="text-white/40 text-xs">
                                                    {goal.target_date ? `Target: ${new Date(goal.target_date).toLocaleDateString()}` : 'No deadline'}
                                                </p>
                                            </div>
                                            <button onClick={() => remove(goal.id)} className="text-red-400 hover:text-red-300 text-sm">
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-white font-bold">{formatMoney(goal.current_amount, goal.currency || 'USD')}</span>
                                            <span className="text-white/40 text-xs">of {formatMoney(goal.target_amount, goal.currency || 'USD')}</span>
                                        </div>
                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                                style={{ width: `${progress}%` }} />
                                        </div>
                                        <p className="text-white/40 text-xs mt-2 text-right">{Math.round(progress)}%</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </FanLayout>
    );
}
