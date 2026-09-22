import React from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Head, Link, router } from '@inertiajs/react';
import DashboardHero from '@/Components/Common/DashboardHero';
import AdPlaceholder from '@/Components/Common/AdPlaceholder';
import ConfirmationDialog from '@/Components/ConfirmationDialog';
import { useTournament } from '@/Context/TournamentContext';
import WeatherCard from '@/Components/Fan/WeatherCard';
import { formatMoney } from '@/lib/utils';

export default function Journey({ auth, paymentData, activeBudget, weather = undefined }) {
    const { tournament } = useTournament();
    const { totalBookings, totalPaid, totalDue, bookings, paymentSchedules } = paymentData;
    const progress = totalPaid + totalDue > 0 ? Math.round((totalPaid / (totalPaid + totalDue)) * 100) : 0;
    // Sprint 29 — the aggregate tiles (Total Paid / Pending) sum across
    // every booking; if a fan has bookings in different currencies the
    // sum is only meaningful when they all agree, so we display the
    // most-common currency and fall back to the active budget's or USD.
    const primaryCurrency =
        bookings?.[0]?.currency ||
        activeBudget?.currency ||
        'USD';

    const [timeLeft, setTimeLeft] = React.useState({});
    const [itineraryToConfirm, setItineraryToConfirm] = React.useState(null);

    React.useEffect(() => {
        const timer = setInterval(() => {
            const updatedTimeLeft = {};
            bookings.forEach(booking => {
                if (booking.status === 'pending_payment' && booking.expires_at) {
                    const difference = new Date(booking.expires_at) - new Date();
                    if (difference > 0) {
                        updatedTimeLeft[booking.id] = {
                            h: Math.floor((difference / (1000 * 60 * 60))),
                            m: Math.floor((difference / 1000 / 60) % 60),
                            s: Math.floor((difference / 1000) % 60)
                        };
                    } else {
                        updatedTimeLeft[booking.id] = 'Expired';
                    }
                }
            });
            setTimeLeft(updatedTimeLeft);
        }, 1000);

        return () => clearInterval(timer);
    }, [bookings]);

    const formatTime = (time) => {
        if (time === 'Expired') return <span className="text-danger fw-bold">Expired</span>;
        if (!time) return null;
        return `${time.h}h ${time.m}m ${time.s}s`;
    };

    return (
        <FanLayout title="My Journey">
            <div className="container-fluid">
                
                <DashboardHero role="fan" 
                    title={`My ${tournament?.short_name || 'Tournament'} Journey`}
                    subtitle="Track your booking progress, payment schedule, and travel itinerary."
                    breadcrumbs={[
                        { label: 'My Journey' }
                    ]}
                    bgImage="/assets/img/fan/backgrounds/gaming_hero.png"
                />

                {/* Ad Placeholder Top */}
                <div className="mb-4">
                    <AdPlaceholder position="horizontal" />
                </div>

                {/* Sprint 40 polish — migrated to .tfe-tile so the Journey
                    summary row matches every other dashboard's stat row. The
                    fan-card-premium glow variant now only lives on truly
                    branded surfaces (Predict, Store) rather than data tiles. */}
                <div className="tfe-stat-grid mb-5">
                    {[
                        { icon: 'fa-ticket-alt', variant: 'red',    label: 'Active Bookings', value: totalBookings,                          sub: totalBookings > 0 ? 'In Progress' : 'No Bookings' },
                        { icon: 'fa-credit-card', variant: 'blue',   label: 'Total Paid',      value: formatMoney(totalPaid, primaryCurrency), sub: `${paymentData.paymentsCount} payments` },
                        { icon: 'fa-clock',       variant: 'rose',   label: 'Pending',         value: formatMoney(totalDue,  primaryCurrency), sub: `${paymentSchedules.length} installments` },
                        { icon: 'fa-chart-line',  variant: 'teal',   label: 'Progress',        value: `${progress}%`,                          sub: 'On track' },
                    ].map((t, i) => (
                        <div key={i} className={`tfe-tile tfe-tile--${t.variant}`}>
                            <div className="tfe-tile__head">
                                <div className="tfe-tile__icon"><i className={`fas ${t.icon}`} /></div>
                            </div>
                            <div className="tfe-tile__value">{t.value}</div>
                            <div className="tfe-tile__label">{t.label}</div>
                            {t.sub && <div className="tfe-tile__subtext">{t.sub}</div>}
                        </div>
                    ))}
                </div>

                {/* Planned Journey (Active Budget) */}
                {activeBudget && (
                    <div className="content-card planned-journey-card mb-4">
                        <div className="card-header d-flex align-items-center gap-2">
                             <i className="fas fa-map-marked-alt text-primary"></i>
                            <h3 className="m-0">My Planned Journey</h3>
                             {activeBudget.partner_status === 'approved' ? (
                                 <span className="tfe-pill tfe-pill--approved ms-auto"><i className="fas fa-check-circle me-1"></i>Confirmed By Partner</span>
                             ) : activeBudget.partner_status === 'modified' ? (
                                 <span className="tfe-pill tfe-pill--pending ms-auto"><i className="fas fa-exclamation-circle me-1"></i>Revised Proposal</span>
                             ) : (
                                 <span className="tfe-pill tfe-pill--info ms-auto"><i className="fas fa-clock me-1"></i>Pending Partner Approval</span>
                             )}
                        </div>
                        <div className="card-body">
                             <div className="row g-4 text-center">
                                <div className="col-md-4">
                                     <span className="d-block text-white-50 small text-uppercase">Estimated Budget</span>
                                     <span className="h4 fw-bold text-white">{formatMoney(activeBudget.total_cost, activeBudget.currency || 'USD')}</span>
                                </div>
                                <div className="col-md-4 border-start border-end border-secondary">
                                     <span className="d-block text-white-50 small text-uppercase">Matches Planned</span>
                                     <span className="h4 fw-bold text-white">{activeBudget.match_count} Matches</span>
                                </div>
                                <div className="col-md-4">
                                     <span className="d-block text-white-50 small text-uppercase">Accommodation</span>
                                     <span className="h4 fw-bold text-white">{activeBudget.accommodation_level.replace('_', ' ')}</span>
                                </div>
                             </div>
                             <div className="text-center mt-4 d-flex justify-content-center gap-3">
                                 <Link href={route('fan.budget-calculator', { id: activeBudget.id })} className="tfe-btn">
                                    <i className="fas fa-edit me-2"></i> Edit Plan
                                </Link>
                                {(activeBudget.partner_status === 'approved' || activeBudget.partner_status === 'modified') && (
                                    <button 
                                        onClick={() => setItineraryToConfirm(activeBudget.id)}
                                        className="tfe-btn tfe-btn--filled"
                                    >
                                        <i className="fas fa-check-circle me-2"></i> Confirm & Book
                                    </button>
                                )}
                             </div>
                        </div>
                    </div>
                )}

                <div className="content-cards-grid mt-4">
                    {/* Active Bookings List */}
                    <div className="content-card bookings-card">
                        <div className="card-header border-bottom pb-2 mb-3">
                            <i className="fas fa-suitcase-rolling text-warning me-2"></i>
                            <h3 className="m-0">Current Bookings</h3>
                        </div>
                        
                        {bookings.length === 0 ? (
                            <div className="text-center py-5">
                                <i className="fas fa-ticket-alt fa-3x text-white-50 mb-3"></i>
                                <h4>No Active Bookings</h4>
                                <p className="text-white-50">{`You don't have any active ${tournament?.short_name || 'tournament'} bookings yet.`}</p>
                                <Link href={route('fan.budget-calculator')} className="tfe-btn tfe-btn--filled mt-3">
                                    <i className="fas fa-plus me-2"></i> Create New Plan
                                </Link>
                            </div>
                        ) : (
                             <div className="d-flex flex-column gap-3">
                                 {bookings.map(booking => (
                                    <div key={booking.id} className="p-3 bg-dark rounded border border-secondary text-white shadow-sm hover-glow">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                                <h5 className="mb-1 text-white fw-bold">{booking.package_name}</h5>
                                                 <span className="badge bg-secondary me-2 text-white">{booking.package_type} Package</span>
                                                <span className={`badge ${booking.status === 'confirmed' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                                    {booking.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className="text-end">
                                                <div className="fw-bold text-white">{formatMoney(booking.total_amount, booking.currency || primaryCurrency)}</div>
                                                <small className="text-success fw-bold">Paid: {formatMoney(booking.amount_paid, booking.currency || primaryCurrency)}</small>
                                            </div>
                                        </div>
                                        
                                        {booking.status === 'pending_payment' && booking.expires_at && (
                                            <div className="mb-3">
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <span className="small text-white-50"><i className="fas fa-clock me-1"></i> Payment Deadline</span>
                                                    <span className="small text-danger fw-bold">{formatTime(timeLeft[booking.id])}</span>
                                                </div>
                                                <div className="progress bg-secondary" style={{ height: '6px' }}>
                                                    <div 
                                                        className="progress-bar bg-danger" 
                                                        style={{ 
                                                            width: `${Math.max(0, Math.min(100, ( (new Date(booking.expires_at) - new Date()) / (48 * 60 * 60 * 1000) ) * 100))}%`,
                                                            transition: 'width 1s linear'
                                                        }}
                                                    ></div>
                                                </div>
                                                <div className="small text-white-50 mt-2" style={{ fontSize: '0.75rem' }}>
                                                    <i className="fas fa-info-circle me-1"></i> 
                                                    Complete payment to secure your booking. Once it expires, you'll need to submit a new travel request.
                                                </div>
                                            </div>
                                        )}

                                        <Link
                                            href={route('fan.bookings.show', booking.id)}
                                            className="tfe-btn tfe-btn--sm w-100 justify-content-center"
                                        >
                                            <i className="fas fa-eye me-2"></i> View Details
                                        </Link>
                                    </div>
                                ))}
                             </div>
                        )}
                    </div>

                    {/* Payment Schedule */}
                    <div className="content-card payment-schedule-card">
                        <div className="card-header border-bottom pb-2 mb-3">
                            <i className="fas fa-calendar-check text-success me-2"></i>
                            <h3 className="m-0">Payment Schedule</h3>
                        </div>

                        {paymentSchedules.length === 0 ? (
                             <div className="text-center py-5">
                                 <i className="fas fa-calendar fa-3x text-muted mb-3"></i>
                                 <p className="text-white-50">No pending payments.</p>
                             </div>
                        ) : (
                            <div className="d-flex flex-column gap-3">
                                {paymentSchedules.map(schedule => (
                                    <div key={schedule.id} className="d-flex justify-content-between align-items-center p-3 bg-dark rounded border border-secondary">
                                        <div>
                                            <div className="fw-bold">{schedule.description}</div>
                                            <small className="text-white-50">Payment #{schedule.payment_number} • Due: {schedule.due_date}</small>
                                        </div>
                                        <div className="text-end">
                                            <div className="fw-bold mb-1">{formatMoney(schedule.amount, schedule.currency || primaryCurrency)}</div>
                                            {schedule.status === 'pending' ? (
                                                <Link href={route('fan.payments', { amount: schedule.amount, description: schedule.description })} className="btn btn-sm btn-success">Pay Now</Link>
                                            ) : (
                                                 <span className="badge bg-success">Paid</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Weather + packing checklist (Open-Meteo, deferred) */}
                <WeatherCard weather={weather} tournamentName={tournament?.short_name || tournament?.name} />

                {/* Travel Info */}
                <div className="content-card travel-info-card mt-4">
                     <div className="card-header border-bottom pb-2 mb-3">
                        <i className="fas fa-plane text-info me-2"></i>
                        <h3 className="m-0">Travel Information</h3>
                    </div>
                    <div className="row g-4">
                        <div className="col-md-4">
                             <h4 className="h6 text-white"><i className="fas fa-plane me-2"></i> Flight Details</h4>
                             <p className="small text-white-50 fst-italic">Flight details will be provided closer to your travel date.</p>
                        </div>
                         <div className="col-md-4">
                             <h4 className="h6 text-white"><i className="fas fa-bed me-2"></i> Accommodation</h4>
                             <p className="small text-white-50 fst-italic">Accommodation details will be confirmed with your booking.</p>
                        </div>
                         <div className="col-md-4">
                             <h4 className="h6 text-white"><i className="fas fa-ticket-alt me-2"></i> Match Tickets</h4>
                             <p className="small text-white-50 fst-italic">Match tickets will be allocated based on your package selection.</p>
                        </div>
                    </div>
                </div>

                <ConfirmationDialog
                    open={!!itineraryToConfirm}
                    onOpenChange={(open) => !open && setItineraryToConfirm(null)}
                    title="Confirm Itinerary?"
                    description="Confirm this itinerary and create a booking? This will start the booking process."
                    onConfirm={() => {
                        router.post(route('fan.budget.confirm', itineraryToConfirm), {}, {
                            onSuccess: () => setItineraryToConfirm(null)
                        });
                    }}
                    confirmText="Confirm & Book"
                />
            </div>
        </FanLayout>
    );
}
