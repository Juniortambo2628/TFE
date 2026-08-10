import React from 'react';
import { Head, Link } from '@inertiajs/react';
import FanLayout from '@/Layouts/FanLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import { cn } from '@/lib/utils';
import { useTournament } from '@/Context/TournamentContext';

export default function Wallet({ auth, walletData }) {
    const { tournament } = useTournament();
    const { balance, savings, goalTarget, loanBalance, transactions } = walletData;
    const progress = goalTarget > 0 ? (savings / goalTarget) * 100 : 0;

    return (
        <FanLayout user={auth.user} header="My Wallet & Savings">
            <Head title="Wallet" />

            <div className="pb-12">
                {/* Hero Section */}
                <DashboardHero role="fan" 
                    title="Financial Overview"
                    subtitle={`Manage your savings, track your ${tournament?.short_name || 'tournament'} budget, and view recent transactions.`}
                    breadcrumbs={[{ label: 'Wallet' }]}
                    bgImage="/assets/img/fan/backgrounds/payments_hero.png"
                />

                <div className="container px-4 mx-auto -mt-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Main Balance Card */}
                        <div className="bg-zinc-900/50 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-white/60 text-sm">Escrow Balance</span>
                                <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                                    <i className="fas fa-wallet text-xl"></i>
                                </div>
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-1">
                                ₦{parseFloat(balance).toLocaleString()}
                            </h2>
                            <p className="text-green-500 text-sm flex items-center gap-1">
                                <i className="fas fa-lock"></i> Secured in Escrow
                            </p>
                        </div>

                        {/* Savings Goal Card */}
                        <div className="bg-zinc-900/50 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-white/60 text-sm">Target Progress</span>
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                    <i className="fas fa-bullseye text-xl"></i>
                                </div>
                            </div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-xl font-bold text-white">{Math.round(progress)}%</span>
                                <span className="text-white/40 text-xs">Goal: ₦{parseFloat(goalTarget).toLocaleString()}</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-blue-500 transition-all duration-1000" 
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* Loans Card */}
                        <div className="bg-zinc-900/50 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-white/60 text-sm">Approved Funding</span>
                                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                                    <i className="fas fa-hand-holding-usd text-xl"></i>
                                </div>
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-1">
                                ₦{parseFloat(loanBalance).toLocaleString()}
                            </h2>
                            <Link href={route('fan.contact')} className="text-purple-500 text-sm hover:underline">
                                Apply for more funding
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
                        {/* Transaction History */}
                        <div className="lg:col-span-2">
                            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden">
                                <div className="p-6 border-bottom border-white/5 flex justify-between items-center bg-white/5">
                                    <h3 className="text-white font-semibold">Transaction History</h3>
                                    <button className="text-white/40 text-sm hover:text-white transition-colors">
                                        View All
                                    </button>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {transactions && transactions.length > 0 ? (
                                        transactions.map((tx) => (
                                            <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-full flex items-center justify-center",
                                                        tx.type === 'deposit' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                                                    )}>
                                                        <i className={cn("fas", tx.type === 'deposit' ? "fa-arrow-down" : "fa-arrow-up")}></i>
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-medium">{tx.description}</div>
                                                        <div className="text-white/40 text-xs">{tx.date}</div>
                                                    </div>
                                                </div>
                                                <div className={cn(
                                                    "font-bold",
                                                    tx.type === 'deposit' ? "text-green-500" : "text-white"
                                                )}>
                                                    {tx.type === 'deposit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-12 text-center">
                                            <div className="text-white/20 mb-2">
                                                <i className="fas fa-receipt text-4xl"></i>
                                            </div>
                                            <p className="text-white/40">No transactions found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions / Info */}
                        <div className="space-y-6">
                            <div className="bg-gradient-to-br from-red-600 to-red-800 p-6 rounded-2xl shadow-xl">
                                <h4 className="text-white font-bold mb-2">Book Your Trip</h4>
                                <p className="text-white/80 text-sm mb-4">You can now use your escrow balance to book matches and accommodation.</p>
                                <Link 
                                    href={route('fan.match-schedule')}
                                    className="w-full py-2 bg-white text-red-700 rounded-xl font-bold text-center block hover:bg-zinc-100 transition-colors"
                                >
                                    Browse Tickets
                                </Link>
                            </div>

                            <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-2xl">
                                <h4 className="text-white font-semibold mb-4">Financial Tips</h4>
                                <ul className="space-y-4 text-sm text-white/60">
                                    <li className="flex gap-3">
                                        <i className="fas fa-info-circle text-blue-500 mt-1"></i>
                                        <span>Regular deposits to your escrow increase your priority for match ticket selection.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <i className="fas fa-shield-alt text-green-500 mt-1"></i>
                                        <span>All funds are secured and fully refundable if your visa application is unsuccessful.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </FanLayout>
    );
}
