import React from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useTournament } from '@/Context/TournamentContext';
import DashboardHero from '@/Components/Common/DashboardHero';
import PartnerCarousel from '@/Components/Common/PartnerCarousel';
import FanFooter from '@/Components/Fan/FanFooter';
import AdPlaceholder from '@/Components/Common/AdPlaceholder';
import FanTutorial from '@/Components/Fan/FanTutorial';
import MatchCard from '@/Components/Fan/MatchCard';
import StatCard from '@/Components/Common/StatCard';
import ActiveLoanTile from '@/Components/Fan/ActiveLoanTile';
import QuickActionsGrid from '@/Components/Common/QuickActionsGrid';
import ContentCard from '@/Components/Common/ContentCard';
import PillBadge from '@/Components/Common/PillBadge';
import { formatMoney } from '@/lib/utils';

// Sprint 33 — map partner_status onto a PillBadge variant so the
// Planned Budget tile can show status inline instead of stacking it
// as subtext.
function pillForPartnerStatus(status) {
    if (!status) return { label: 'Pending', variant: 'pending' };
    const s = status.toLowerCase();
    if (s === 'approved') return { label: 'Approved', variant: 'approved' };
    if (s === 'modified') return { label: 'Modified', variant: 'info' };
    if (s === 'rejected') return { label: 'Rejected', variant: 'rejected' };
    return { label: 'Pending', variant: 'pending' };
}

export default function Dashboard({ auth, nextAction = null, activeBudget, activeLoan = null, stats, recentPayments, recentBookings, activities, suggestedMatches = [], isConcluded = false, nextActiveTournament = null }) {
    const { tournament, switchTournament } = useTournament();

    // Four stops, not twenty-five (Sprint 66): testers met a "Step 1 of 25"
    // overlay on top of the dashboard before they could use it. The tour now
    // points at the few things that move a trip forward; the sidebar labels
    // explain the rest themselves.
    const tutorialSteps = [
        {
            target: 'dashboard-hero-section',
            title: 'Welcome',
            content: `This is your home for ${tournament?.short_name || tournament?.name || 'the tournament'}. The card at the top always shows the one thing to do next.`,
        },
        {
            target: 'qa-budget',
            title: 'Plan a trip',
            content: 'Get an estimate and the partner packages that fit — book in a few taps.',
        },
        {
            target: 'sidebar-item-my-itineraries',
            title: 'Your plans',
            content: 'Saved plans and partner quotes live here. Accept a quote and pay in one step.',
        },
        {
            target: 'header-notifications-btn',
            title: 'Updates',
            content: 'Quotes, payments and booking reminders arrive here.',
        },
    ];

    return (
        <FanLayout title="Dashboard">
             <FanTutorial steps={tutorialSteps} />
            {/* Wrapper for the dashboard content to match legacy structure if needed */}
            <div className=""> 
                
            <DashboardHero role="fan" 
                id="dashboard-hero-section"
                title={isConcluded 
                    ? `${tournament?.name || 'Tournament'} — Results`
                    : `Welcome back, ${auth.user.name.split(' ')[0]}!`
                }
                subtitle={isConcluded
                    ? `This tournament has concluded. Here's your overview.`
                    : `Your ${tournament?.short_name || 'tournament'} journey is on track. Here's your current overview.`
                }
                bgImage="/assets/img/fan/backgrounds/stadium_hero.png"
            />

            {nextAction && <NextActionCard action={nextAction} />}

            {/* Concluded tournament nudge — token-driven, matches the new
                slab treatment used elsewhere on the dashboard. */}
            {isConcluded && nextActiveTournament && (
                <ContentCard
                    className="mb-4"
                    title="Ready for the next tournament?"
                    subtitle={`${nextActiveTournament.name} is next — start planning now.`}
                    action={
                        <button
                            type="button"
                            onClick={() => switchTournament(nextActiveTournament.id, '/fan/dashboard')}
                            className="tfe-quick-action"
                            style={{ padding: '8px 14px' }}
                        >
                            <span className="tfe-quick-action__label">Switch to {nextActiveTournament.short_name || nextActiveTournament.name}</span>
                        </button>
                    }
                >
                    <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem' }}>
                        Your current tournament has concluded. Jump into the next one to keep planning.
                    </div>
                </ContentCard>
            )}

            {/* Summary Cards */}
            <div className="tfe-stat-grid">
                <StatCard
                    label="Planned Budget"
                    value={activeBudget ? formatMoney(activeBudget.total_cost, activeBudget.currency || 'USD') : formatMoney(0, 'USD')}
                    icon="fa-wallet"
                    accent="red"
                    pill={pillForPartnerStatus(activeBudget?.partner_status)}
                />

                <StatCard
                    label="Total Paid"
                    value={formatMoney(stats.paid)}
                    icon="fa-credit-card"
                    accent="teal"
                    subtext={`${stats.payments_count} transactions`}
                />

                <StatCard
                    label="Active Bookings"
                    value={stats.bookings}
                    icon="fa-ticket-alt"
                    accent="amber"
                    subtext={stats.bookings === 1 ? '1 confirmed trip' : `${stats.bookings} confirmed trips`}
                />

                <StatCard
                    label="Joined Tribes"
                    value={stats.joined_tribes_count || 0}
                    icon="fa-users"
                    accent="violet"
                    subtext="Active communities"
                />
            </div>

            {/* Sprint 16 — active-loan tile. Only renders when the fan has
                an in-flight application; falls back gracefully otherwise. */}
            {activeLoan && <ActiveLoanTile loan={activeLoan} />}

                {/* Suggested Matches Section */}
                {(() => {
                    const teamSupport = auth.user?.team_support;
                    if (!teamSupport || suggestedMatches.length === 0) return null;

                    return (
                        <div className="suggested-matches-section">
                            <div className="card-header">
                                <h3>Suggested Matches</h3>
                                <span className="match-count">{suggestedMatches.length} matches</span>
                            </div>

                            <div className="suggested-matches-grid">
                                {suggestedMatches.map((match) => (
                                    <MatchCard 
                                        key={match.id}
                                        match={match}
                                        mode="suggested"
                                        showAction={true}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })()}

                {/* Content Cards Grid */}
                <div className="content-cards-grid mt-4">
                    {/* Quick Actions */}
                    <ContentCard id="quick-actions-card" title="Quick Actions">
                        <QuickActionsGrid
                            actions={[
                                { id: 'qa-wallet',  label: 'My Wallet',  icon: 'fa-credit-card', href: route('fan.wallet') },
                                { id: 'qa-travel',  label: 'Travel Info', icon: 'fa-plane',       href: route('fan.journey') },
                                { id: 'qa-store',   label: 'Fan Store',   icon: 'fa-tshirt',      href: route('fan.store') },
                                ...(!isConcluded ? [
                                    { id: 'qa-predict', label: 'Predict & Win', icon: 'fa-futbol',    href: route('fan.predict-win') },
                                    { id: 'qa-events',  label: 'Events',        icon: 'fa-calendar',  href: route('fan.events') },
                                    { id: 'qa-budget',  label: 'Budget Calc',   icon: 'fa-calculator', href: route('fan.budget-calculator') },
                                ] : []),
                            ]}
                        />
                        <div className="tfe-slab__body" style={{ paddingTop: 0 }}>
                            <AdPlaceholder position="vertical" />
                        </div>
                    </ContentCard>

                    {/* Recent Activity */}
                    <ContentCard
                        title="Recent Activity"
                        action={
                            <Link href={route('fan.activities')} className="tfe-pill tfe-pill--info" style={{ textDecoration: 'none' }}>
                                View all →
                            </Link>
                        }
                    >
                        <div className="activity-list">
                            {activities && activities.length > 0 ? (
                                activities.map(activity => (
                                    <div key={activity.id} className="activity-item">
                                        <div className="activity-icon">
                                            <i className={`fas ${activity.type === 'payment' ? 'fa-credit-card' : 'fa-ticket-alt'}`}></i>
                                        </div>
                                        <div className="activity-info">
                                            <div className="activity-title">{activity.title}</div>
                                            <div className="activity-label">{activity.description}</div>
                                        </div>
                                        <div className="activity-details">
                                            <div className="activity-amount">{formatMoney(activity.amount)}</div>
                                            <div className="activity-date">{activity.date}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <i className="fas fa-clock"></i>
                                    <h4>No Recent Activity</h4>
                                    <p>Your recent activity will appear here.</p>
                                </div>
                            )}
                        </div>
                    </ContentCard>

                    {/* Payment History */}
                    <ContentCard
                        className="mt-3"
                        title="Payment History"
                        subtitle={recentPayments?.length ? `${recentPayments.length} recent payments` : null}
                    >
                        <div className="payments-list">
                             {recentPayments && recentPayments.length > 0 ? (
                                 recentPayments.map(payment => (
                                     <div key={payment.id} className="payment-item d-flex justify-content-between py-2 border-bottom border-secondary">
                                        <div className="payment-info">
                                            <div className="payment-title font-weight-bold">{payment.description || 'Payment'}</div>
                                            <div className="payment-package text-muted small">{payment.reference}</div>
                                        </div>
                                        <div className="payment-details text-end">
                                            <div className="payment-amount">{formatMoney(payment.amount)}</div>
                                            <div className="payment-date small text-white-50">{new Date(payment.created_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                 <div className="empty-state">
                                    <i className="fas fa-credit-card"></i>
                                    <h4>No Payment History</h4>
                                    <p>Your payment history will appear here.</p>
                                </div>
                            )}
                        </div>
                    </ContentCard>
                </div>

                {/* Horizontal Ad Placeholder */}
                <div className="mt-5 mb-4">
                    <AdPlaceholder position="horizontal" />
                </div>

                {/* Partners Carousel */}
                <PartnerCarousel />

                {/* Footer Section */}
                <FanFooter />

            </div>
        </FanLayout>
    );
}

/**
 * The one thing to do next (Sprint 65) — computed server-side by
 * `DashboardController::nextAction()`, so there is one rule for it.
 */
function NextActionCard({ action }) {
    const icon = { pay: 'fas fa-lock', accept: 'fas fa-check-circle', wait: 'fas fa-hourglass-half', plan: 'fas fa-plane' }[action.kind] || 'fas fa-arrow-right';
    const hoursLeft = action.expires_at
        ? Math.max(0, Math.round((new Date(action.expires_at) - Date.now()) / 36e5))
        : null;

    return (
        <ContentCard className="mb-4 tfe-next-action">
            <div className="d-flex flex-wrap align-items-center gap-3">
                <i className={`${icon} fs-3`} aria-hidden="true"></i>
                <div className="flex-grow-1">
                    <div className="fw-bold text-white">{action.title}</div>
                    <div className="tfe-form-help">
                        {action.amount ? formatMoney(action.amount, action.currency) : null}
                        {hoursLeft !== null && ` · held for ${hoursLeft}h more`}
                    </div>
                </div>
                <Link href={action.href} className={`tfe-btn ${action.kind === 'wait' ? '' : 'tfe-btn--filled'}`}>
                    {action.cta}
                </Link>
            </div>
        </ContentCard>
    );
}
