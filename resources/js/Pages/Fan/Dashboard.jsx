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
import { formatMoney } from '@/lib/utils';

export default function Dashboard({ auth, activeBudget, stats, recentPayments, recentBookings, activities, suggestedMatches = [], isConcluded = false, nextActiveTournament = null }) {
    const { tournament, switchTournament } = useTournament();

    const tutorialSteps = [
        // 1. Welcome
        {
            target: 'dashboard-hero-section',
            title: 'Welcome to Your Dashboard',
            content: 'This is your central hub for World Cup 2026. Here you can see your trip overview, budget status, and upcoming activities.'
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

            {/* Concluded Tournament Banner */}
            {isConcluded && nextActiveTournament && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(59,130,246,0.15))',
                    border: '1px solid rgba(34,197,94,0.3)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <i className="fas fa-calendar-check" style={{ color: '#4ade80', fontSize: '1.2rem' }}></i>
                        <div>
                            <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>
                                Ready for the next tournament?
                            </div>
                            <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                                {nextActiveTournament.name} is {nextActiveTournament.start_date ? `coming up` : 'next'} — start planning now.
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => switchTournament(nextActiveTournament.slug, '/fan/dashboard')}
                        style={{
                            background: '#22c55e',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <i className="fas fa-arrow-right me-1"></i>
                        Switch to {nextActiveTournament.name}
                    </button>
                </div>
            )}

            {/* Summary Cards */}
            <div className="summary-cards-grid">
                <StatCard 
                    label="Planned Budget"
                    value={activeBudget ? formatMoney(activeBudget.total_cost) : 'KES 0'}
                    icon="fa-wallet"
                    variant="red"
                    subtext={activeBudget ? activeBudget.partner_status : 'Pending'}
                />
                
                <StatCard 
                    label="Total Paid"
                    value={formatMoney(stats.paid)}
                    icon="fa-credit-card"
                    variant="blue"
                    subtext={`${stats.payments_count} transactions`}
                />
                
                <StatCard 
                    label="Active Bookings"
                    value={`${stats.bookings} ${stats.bookings === 1 ? 'BOOKING' : 'BOOKINGS'}`}
                    icon="fa-ticket-alt"
                    variant="red"
                    subtext="Confirmed"
                />
                
                <StatCard 
                    label="Joined Tribes"
                    value={`${stats.joined_tribes_count || 0} ${stats.joined_tribes_count === 1 ? 'COMMUNITY' : 'COMMUNITIES'}`}
                    icon="fa-users"
                    variant="blue"
                    subtext="Active Communities"
                />
            </div>

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
                    <div id="quick-actions-card" className="content-card quick-actions-card">
                        <div className="card-header">
                            <i className="fas fa-bolt"></i>
                            <h3>Quick Actions</h3>
                        </div>
                        <div className="quick-actions-grid p-2">
                            <Link id="qa-wallet" href={route('fan.payments')} className="fan-card-premium glow-red dash-quick-action-card">
                                <div className="card-content-gaming">
                                    <div className="card-icon-gaming accent-fan"><i className="fas fa-credit-card"></i></div>
                                    <span className="card-title-gaming">My Wallet</span>
                                </div>
                            </Link>
                            <Link id="qa-travel" href={route('fan.journey')} className="fan-card-premium glow-blue dash-quick-action-card">
                                <div className="card-content-gaming">
                                    <div className="card-icon-gaming" style={{ color: 'var(--fan-cyan)' }}><i className="fas fa-plane"></i></div>
                                    <span className="card-title-gaming">Travel Info</span>
                                </div>
                            </Link>
                             <Link id="qa-store" href={route('fan.store')} className="fan-card-premium glow-red dash-quick-action-card">
                                <div className="card-content-gaming">
                                    <div className="card-icon-gaming accent-fan"><i className="fas fa-tshirt"></i></div>
                                    <span className="card-title-gaming">Fan Store</span>
                                </div>
                            </Link>
                            {!isConcluded && (<>
                             <Link id="qa-predict" href={route('fan.predict-win')} className="fan-card-premium glow-blue dash-quick-action-card">
                                <div className="card-content-gaming">
                                    <div className="card-icon-gaming" style={{ color: 'var(--fan-cyan)' }}><i className="fas fa-futbol"></i></div>
                                    <span className="card-title-gaming">Predict & Win</span>
                                </div>
                            </Link>
                             <Link id="qa-events" href={route('fan.events')} className="fan-card-premium glow-red dash-quick-action-card">
                                <div className="card-content-gaming">
                                    <div className="card-icon-gaming accent-fan"><i className="fas fa-calendar"></i></div>
                                    <span className="card-title-gaming">Events</span>
                                </div>
                            </Link>
                              <Link id="qa-budget" href={route('fan.budget-calculator')} className="fan-card-premium glow-blue dash-quick-action-card">
                                <div className="card-content-gaming">
                                    <div className="card-icon-gaming" style={{ color: 'var(--fan-cyan)' }}><i className="fas fa-calculator"></i></div>
                                    <span className="card-title-gaming">Budget Calc</span>
                                </div>
                            </Link>
                            </>)}
                        </div>
                        
                        {/* Vertical Ad Placeholder in Sidebar/Quick Actions Column */}
                        <div className="mt-4">
                            <AdPlaceholder position="vertical" />
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="content-card activity-card">
                        <div className="card-header">
                            <i className="fas fa-clock"></i>
                            <h3>Recent Activity</h3>
                        </div>
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
                        <Link href={route('fan.activities')} className="btn-fan-custom btn-fan-custom-sm w-100 mt-2">
                            <i className="fas fa-eye"></i>
                            <span>View All Activity</span>
                        </Link>
                    </div>

                     {/* Payment History Card (New) */}
                    <div className="content-card payments-list-card mt-3">
                         <div className="card-header">
                            <i className="fas fa-history"></i>
                            <h3>Payment History</h3>
                        </div>
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
                    </div>
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
