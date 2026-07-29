import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import FanLayout from '@/Layouts/FanLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import { formatMoney } from '@/lib/utils';

export default function SavingsGoals({ auth, goals }) {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', target_amount: '', target_date: '' });
    const [processing, setProcessing] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post(route('fan.savings-goals.store'), form, {
            onFinish: () => setProcessing(false),
            onSuccess: () => {
                setForm({ name: '', target_amount: '', target_date: '' });
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

    return (
        <FanLayout user={auth.user} header="Savings Goals">
            <Head title="Savings Goals" />

            <div className="pb-12">
                <DashboardHero role="fan"
                    title="Savings Goals"
                    subtitle="Set targets and track your World Cup savings progress."
                    breadcrumbs={[{ label: 'Wallet', href: route('fan.wallet') }, { label: 'Savings' }]}
                    bgImage="/assets/img/fan/backgrounds/payments_hero.png"
                />

                <div className="container px-4 mx-auto -mt-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-zinc-900/50 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
                            <span className="text-white/60 text-sm">Total Saved</span>
                            <h2 className="text-2xl font-bold text-white mt-1">{formatMoney(totalSaved)}</h2>
                        </div>
                        <div className="bg-zinc-900/50 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
                            <span className="text-white/60 text-sm">Total Target</span>
                            <h2 className="text-2xl font-bold text-white mt-1">{formatMoney(totalTarget)}</h2>
                        </div>
                        <div className="bg-zinc-900/50 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
                            <span className="text-white/60 text-sm">Goals</span>
                            <h2 className="text-2xl font-bold text-white mt-1">{goals.length}</h2>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white">My Goals</h2>
                        <button onClick={() => setShowForm(!showForm)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                            <i className="fas fa-plus mr-2"></i>New Goal
                        </button>
                    </div>

                    {showForm && (
                        <div className="bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-8">
                            <h3 className="text-lg font-bold text-white mb-4">Create Savings Goal</h3>
                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <label className="block text-white/60 text-sm mb-1">Goal Name</label>
                                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
                                        placeholder="e.g. World Cup Tickets Fund" required />
                                </div>
                                <div>
                                    <label className="block text-white/60 text-sm mb-1">Target Amount (₦)</label>
                                    <input type="number" value={form.target_amount} onChange={e => setForm({ ...form, target_amount: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
                                        placeholder="e.g. 500000" required min="1000" />
                                </div>
                                <div>
                                    <label className="block text-white/60 text-sm mb-1">Target Date (optional)</label>
                                    <input type="date" value={form.target_date} onChange={e => setForm({ ...form, target_date: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500" />
                                </div>
                                <div className="flex gap-3">
                                    <button type="submit" disabled={processing}
                                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                                        {processing ? 'Creating...' : 'Create Goal'}
                                    </button>
                                    <button type="button" onClick={() => setShowForm(false)}
                                        className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

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
                                            <span className="text-white font-bold">{formatMoney(goal.current_amount)}</span>
                                            <span className="text-white/40 text-xs">of {formatMoney(goal.target_amount)}</span>
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
