import React from 'react';
import { Head, Link } from '@inertiajs/react';
import FanLayout from '@/Layouts/FanLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import SummaryTiles from '@/Components/Common/SummaryTiles';
import { cn, formatMoney } from '@/lib/utils';
import { useTournament } from '@/Context/TournamentContext';

export default function Wallet({ auth, walletData }) {
    const { tournament } = useTournament();
    const { balance, savings, goalTarget, loanBalance, transactions } = walletData;
    const progress = goalTarget > 0 ? (savings / goalTarget) * 100 : 0;

    return (
        <FanLayout title="Wallet">
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
                    <SummaryTiles
                        items={[
                            { label: 'Escrow Balance',   value: formatMoney(balance),     icon: 'fa-wallet',           accent: 'teal',   subtext: 'Secured in escrow' },
                            { label: 'Target Progress',  value: `${Math.round(progress)}%`, icon: 'fa-bullseye',         accent: 'blue',   subtext: `Goal: ${formatMoney(goalTarget)}` },
                            { label: 'Approved Funding', value: formatMoney(loanBalance), icon: 'fa-hand-holding-usd', accent: 'violet', subtext: 'From partners' },
                        ]}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                        {/* Transaction History */}
                        <div className="lg:col-span-2">
                            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden">
                                <div className="p-6 border-bottom border-white/5 flex justify-between items-center bg-white/5">
                                    <h3 className="text-white font-semibold">Transaction History</h3>
                                    <Link href={route('fan.journey')} className="tfe-btn tfe-btn--sm">
                                        View All
                                    </Link>
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
                                                    {tx.type === 'deposit' ? '+' : '-'}{formatMoney(tx.amount)}
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
                                    className="tfe-btn tfe-btn--filled w-full"
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
