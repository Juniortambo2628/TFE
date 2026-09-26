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

export default function Dashboard({ auth, activeBudget, activeLoan = null, stats, recentPayments, recentBookings, activities, suggestedMatches = [], isConcluded = false, nextActiveTournament = null }) {
    const { tournament, switchTournament } = useTournament();

    const tutorialSteps = [
        // 1. Welcome
        {
            target: 'dashboard-hero-section',
            title: 'Welcome to Your Dashboard',
            content: `This is your central hub for ${tournament?.short_name || tournament?.name || 'the tournament'}. Here you can see your trip overview, budget status, and upcoming activities.`
        },
        
        // 2. Header Links
        {
            target: 'nav-link-social',
            title: 'Social Feed',
            content: 'Connect with other fans, share your moments, and see what is trending in the community.'
        },
        {
            target: 'nav-link-tribes',
            title: 'Fan Tribes',
            content: 'Join or create Tribes to group up with friends and fellow fans for a shared experience.'
        },
        {
            target: 'nav-link-store',
            title: 'Fan Store',
            content: 'Browse and purchase official merchandise, kits, and memorabilia.'
        },
        {
            target: 'nav-link-predict',
            title: 'Predict & Win',
            content: 'Participate in match predictions and win exciting prizes.'
        },

        // 3. Sidebar Links
        {
            target: 'sidebar-item-home',
            title: 'Home',
            content: 'Return to this dashboard overview at any time.'
        },
        {
            target: 'sidebar-item-profile',
            title: 'Your Profile',
            content: 'Manage your personal details, preferences, and account settings.'
        },
        {
             target: 'sidebar-item-stories',
             title: 'Stories',
             content: 'Watch and share short video stories from your journey.'
        },
        {
            target: 'sidebar-item-journey',
            title: 'My Journey',
            content: 'Track your overall travel progress and milestones.'
        },
        {
            target: 'sidebar-item-my-itineraries',
            title: 'My Itineraries',
            content: 'View and manage your saved trip plans and booked itineraries.'
        },
        {
            target: 'sidebar-item-events',
            title: 'Events',
            content: 'Discover events happening around the matches and host cities.'
        },
        {
            target: 'sidebar-item-match-schedule',
            title: 'Match Schedule',
            content: 'View the full tournament schedule and add matches to your plan.'
        },
        {
            target: 'sidebar-item-communication',
            title: 'Messages',
            content: 'Communicate with support, tribe members, and other fans.'
        },
        {
            target: 'sidebar-item-payments',
            title: 'Payments',
            content: 'Track your payment history and manage your budget.'
        },
        {
            target: 'sidebar-item-security',
            title: 'Security',
            content: 'Manage your account security, password, and 2FA settings.'
        },
        {
            target: 'sidebar-item-contact',
            title: 'Contact Support',
            content: 'Get help and support whenever you need it.'
        },

        // 4. Quick Actions
        {
             target: 'qa-wallet',
             title: 'My Wallet',
             content: 'Quickly access your digital wallet to view balance and top up.'
        },
        {
             target: 'qa-travel',
             title: 'Travel Info',
             content: 'See your flight and accommodation details at a glance.'
        },
        {
             target: 'qa-store',
             title: 'Shop Now',
             content: 'Head directly to the store to grab the latest gear.'
        },
        {
             target: 'qa-predict',
             title: 'Make a Prediction',
             content: 'Jump straight into the action and predict the next match result.'
        },
        {
             target: 'qa-events',
             title: 'Find Events',
             content: 'Explore what is happening nearby right now.'
        },
        {
             target: 'qa-budget',
             title: 'Budget Calculator',
             content: 'Plan your expenses and estimate costs for your trip.'
        },

        // 5. Header Dropdowns/Icons
        {
            target: 'header-notifications-btn',
            title: 'Notifications',
            content: 'Stay updated with real-time alerts about your bookings and activities.'
        },
        {
            target: 'header-messages-btn',
            title: 'Quick Messages',
            content: 'Access your recent messages without leaving the dashboard.'
        },
        {
            target: 'header-user-profile',
            title: 'User Menu',
            content: 'Access your profile, settings, and logout option here.'
        }
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
