import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import FanLayout from '@/Layouts/FanLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import { formatMoney } from '@/lib/utils';

export default function LoanApplications({ auth, loans }) {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ amount: '', purpose: '', notes: '' });
    const [processing, setProcessing] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post(route('fan.loan-applications.store'), form, {
            onFinish: () => setProcessing(false),
            onSuccess: () => {
                setForm({ amount: '', purpose: '', notes: '' });
                setShowForm(false);
            },
        });
    };

    const withdraw = (id) => {
        if (confirm('Withdraw this application?')) {
            router.delete(route('fan.loan-applications.destroy', id));
        }
    };

    const statusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-500/10 text-yellow-500';
            case 'APPROVED': return 'bg-green-500/10 text-green-500';
            case 'REJECTED': return 'bg-red-500/10 text-red-500';
            case 'DISBURSED': return 'bg-blue-500/10 text-blue-500';
            default: return 'bg-white/10 text-white/60';
        }
    };

    return (
        <FanLayout user={auth.user} header="Loan Applications">
            <Head title="Loan Applications" />

            <div className="pb-12">
                <DashboardHero role="fan"
                    title="Loan Applications"
                    subtitle="Apply for funding for your World Cup trip."
                    breadcrumbs={[{ label: 'Wallet', href: route('fan.wallet') }, { label: 'Loans' }]}
                    bgImage="/assets/img/fan/backgrounds/payments_hero.png"
                />

                <div className="container px-4 mx-auto -mt-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white">My Applications</h2>
                        <button onClick={() => setShowForm(!showForm)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                            <i className="fas fa-plus mr-2"></i>New Application
                        </button>
                    </div>

                    {showForm && (
                        <div className="bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-8">
                            <h3 className="text-lg font-bold text-white mb-4">Apply for Funding</h3>
                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <label className="block text-white/60 text-sm mb-1">Amount (₦)</label>
                                    <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
                                        placeholder="e.g. 200000" required min="1000" />
                                </div>
                                <div>
                                    <label className="block text-white/60 text-sm mb-1">Purpose</label>
                                    <input type="text" value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
                                        placeholder="e.g. World Cup 2026 travel funding" required />
                                </div>
                                <div>
                                    <label className="block text-white/60 text-sm mb-1">Additional Notes (optional)</label>
                                    <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
                                        rows="3" placeholder="Any additional information..." />
                                </div>
                                <div className="flex gap-3">
                                    <button type="submit" disabled={processing}
                                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                                        {processing ? 'Submitting...' : 'Submit Application'}
                                    </button>
                                    <button type="button" onClick={() => setShowForm(false)}
                                        className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {loans.length === 0 ? (
                        <div className="bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
                            <i className="fas fa-file-invoice-dollar text-4xl text-white/20 mb-4"></i>
                            <p className="text-white/60">No loan applications yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {loans.map(loan => (
                                <div key={loan.id} className="bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-white font-semibold text-lg">{formatMoney(loan.amount)}</p>
                                            <p className="text-white/60 text-sm mt-1">{loan.purpose}</p>
                                            {loan.notes && <p className="text-white/40 text-xs mt-1">{loan.notes}</p>}
                                            <p className="text-white/40 text-xs mt-2">Applied {new Date(loan.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(loan.status)}`}>
                                                {loan.status}
                                            </span>
                                            {loan.status === 'PENDING' && (
                                                <button onClick={() => withdraw(loan.id)}
                                                    className="text-red-400 hover:text-red-300 text-sm">
                                                    <i className="fas fa-times"></i>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </FanLayout>
    );
}
