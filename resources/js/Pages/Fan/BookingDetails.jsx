import React from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Head, Link, router } from '@inertiajs/react';
import DashboardHero from '@/Components/Common/DashboardHero';
import { formatMoney, formatDateTime } from '@/lib/utils';
import StepFlow from '@/Components/Common/StepFlow';
import MobileActionBar from '@/Components/Common/MobileActionBar';
import { bookingTimeline } from '@/lib/tripTimeline';

export default function BookingDetails({ auth, booking, matches, checkout = null, mpesa = null, timeline = {}, savingsLinks = [] }) {
    // The whole trip on one line (Sprint 66) — every state from a real field.
    const tripSteps = bookingTimeline({
        status: booking?.status,
        total: booking?.total_amount,
        paid: booking?.amount_paid,
        matchCount: (matches || []).length,
        ticketsBought: timeline.tickets_bought || 0,
        firstMatchAt: timeline.first_match_at || null,
    });
    const partnerPayUrl = booking?.partner_pay_url || null;
    const currency = booking?.currency || 'USD';
    const [paying, setPaying] = React.useState(false);
    const expiresAt = booking?.expires_at ? new Date(booking.expires_at) : null;

    const payNow = (method = 'card') => {
        setPaying(method);
        router.post(route('fan.bookings.pay', booking.id), { method }, { onFinish: () => setPaying(false) });
    };

    const getStatusPill = (status) => {
        switch (status) {
            case 'confirmed':       return { variant: 'approved', label: 'Confirmed' };
            case 'pending_payment': return { variant: 'pending',  label: 'Payment Pending' };
            case 'cancelled':       return { variant: 'rejected', label: 'Cancelled' };
            default:                return { variant: 'info',     label: String(status || 'unknown').replace('_', ' ') };
        }
    };

    const statusPill = getStatusPill(booking.status);

    return (
        <FanLayout title={`Booking: ${booking.package_name}`}>
            <Head title={`Booking: ${booking.package_name}`} />
            
            <div className="container-fluid">
                <DashboardHero role="fan" 
                    title={booking.package_name}
                    subtitle={`Reference: ${booking.id.toString().padStart(6, '0')}`}
                    breadcrumbs={[
                        { label: 'Journey', href: route('fan.journey') },
                        { label: 'Booking Details' }
                    ]}
                    bgImage="/assets/img/fan/backgrounds/stadium_hero.png"
                />

                {booking.status === 'pending_payment' && checkout && (
                    <MobileActionBar note={`Balance ${formatMoney(booking.total_amount - booking.amount_paid, currency)}${expiresAt ? ` · held until ${formatDateTime(expiresAt)}` : ''}`}>
                        {mpesa !== null && (
                            <button type="button" className="tfe-btn tfe-btn--filled" disabled={Boolean(paying)} onClick={() => payNow('mpesa')}>
                                <i className="fas fa-mobile-alt" aria-hidden="true"></i> M-Pesa
                            </button>
                        )}
                        <button type="button" className={`tfe-btn ${mpesa === null ? 'tfe-btn--filled' : ''}`} disabled={Boolean(paying)} onClick={() => payNow('card')}>
                            <i className="fas fa-credit-card" aria-hidden="true"></i> {mpesa === null ? 'Pay now' : 'Card'}
                        </button>
                    </MobileActionBar>
                )}

                <div className="content-card p-4 mt-4">
                    <h2 className="fs-5 fw-bold mb-3 text-white">Your trip</h2>
                    <StepFlow variant="inline" steps={tripSteps} />
                    {tripSteps.find((st) => st.key === 'arrangements')?.detail && (
                        <p className="tfe-form-help mt-2 mb-0">
                            {tripSteps.find((st) => st.key === 'arrangements').detail}.
                            {(matches || []).length > (timeline.tickets_bought || 0) && (
                                <> <Link href={route('fan.tickets.index')}>Get your match tickets</Link>.</>
                            )}
                        </p>
                    )}
                </div>

                <div className="row mt-4">
                    <div className="col-lg-8">
                        {/* Booking Overview */}
                        <div className="content-card p-4 mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h2 className="fs-4 fw-bold m-0 text-white">Travel Summary</h2>
                                <span className={`tfe-pill tfe-pill--${statusPill.variant}`}>
                                    {statusPill.label}
                                </span>
                            </div>

                            <div className="tfe-stat-grid mb-4">
                                <div className="tfe-tile tfe-tile--blue">
                                    <div className="tfe-tile__label">Flight Class</div>
                                    <div className="tfe-tile__value text-capitalize" style={{ fontSize: '1.5rem' }}>{booking.flight_info || 'To be arranged'}</div>
                                </div>
                                <div className="tfe-tile tfe-tile--teal">
                                    <div className="tfe-tile__label">Accommodation</div>
                                    <div className="tfe-tile__value text-capitalize" style={{ fontSize: '1.5rem' }}>{booking.accommodation ? booking.accommodation.replace('_', ' ') : 'To be arranged'}</div>
                                </div>
                                <div className="tfe-tile tfe-tile--amber">
                                    <div className="tfe-tile__label">Booking Date</div>
                                    <div className="tfe-tile__value" style={{ fontSize: '1.5rem' }}>{booking.booking_date}</div>
                                </div>
                            </div>

                            <h3 className="fs-5 fw-bold mb-3 text-white">Matches Included</h3>
                            <div className="d-flex flex-column gap-3">
                                {matches.map((fixture) => (
                                    <div key={fixture.id} className="p-3 bg-dark rounded border border-secondary d-flex align-items-center justify-content-between hover-glow" style={{ transition: 'all 0.3s' }}>
                                        <div className="d-flex align-items-center gap-4">
                                            <div className="text-center" style={{ minWidth: '80px' }}>
                                                <div className="small text-white-50">{new Date(fixture.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                                <div className="fw-bold">{fixture.time}</div>
                                            </div>
                                            <div className="fs-5 fw-bold">
                                                {fixture.home_team} <span className="text-danger">vs</span> {fixture.away_team}
                                            </div>
                                        </div>
                                        <div className="text-end text-white-50 small">
                                            <div>{fixture.venue}</div>
                                            <div className="text-uppercase">{fixture.stage}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-4">
                        {/* Financial Card */}
                        <div className="content-card p-4 mb-4 glow-crimson">
                            <h2 className="fs-4 fw-bold mb-4 text-white">Payment Status</h2>
                            
                            <div className="mb-4">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-white-50">Total Package Cost</span>
                                    <span className="fw-bold">{formatMoney(booking.total_amount, currency)}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-white-50">Amount Paid</span>
                                    <span className="text-success fw-bold">{formatMoney(booking.amount_paid, currency)}</span>
                                </div>
                                <hr className="border-secondary" />
                                <div className="d-flex justify-content-between">
                                    <span className="fs-5 fw-bold">Balance Due</span>
                                    <span className="fs-5 fw-bold text-danger">{formatMoney(booking.total_amount - booking.amount_paid, currency)}</span>
                                </div>
                            </div>

                            {booking.status === 'pending_payment' && (
                                <>
                                    <div className="alert alert-warning border-warning bg-transparent text-warning-emphasis p-3 mb-4 rounded-3">
                                        <i className="fas fa-exclamation-triangle me-2"></i>
                                        Payment is required to secure this booking.
                                        {expiresAt && ` It is held until ${formatDateTime(expiresAt)}.`}
                                    </div>
                                    {savingsLinks.length > 0 && <PayFromSavings booking={booking} links={savingsLinks} currency={currency} />}
                                    {checkout ? (
                                        <>
                                            {/* M-Pesa first where it is offered: most East African
                                                fans pay by phone, not card (Sprint 66). */}
                                            {mpesa !== null && (
                                                <button
                                                    type="button"
                                                    onClick={() => payNow('mpesa')}
                                                    disabled={Boolean(paying)}
                                                    className="tfe-btn tfe-btn--filled tfe-btn--lg w-100 justify-content-center mb-2"
                                                >
                                                    <i className="fas fa-mobile-alt me-2" aria-hidden="true"></i>
                                                    {paying === 'mpesa' ? 'Opening M-Pesa…' : `Pay ${formatMoney(Math.round(mpesa), 'KES')} with M-Pesa`}
                                                    {checkout === 'demo' && ' (demo)'}
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => payNow('card')}
                                                disabled={Boolean(paying)}
                                                className={`tfe-btn tfe-btn--lg w-100 justify-content-center mb-3 ${mpesa === null ? 'tfe-btn--filled' : ''}`}
                                            >
                                                <i className="fas fa-credit-card me-2" aria-hidden="true"></i>
                                                {paying === 'card' ? 'Opening checkout…' : `Pay ${formatMoney(booking.total_amount - booking.amount_paid, currency)} by card`}
                                                {checkout === 'demo' && ' (demo)'}
                                            </button>
                                            <p className="tfe-form-help mb-3">
                                                <i className="fas fa-shield-alt me-1" aria-hidden="true"></i>
                                                Secure payment by Paystack. TFE never sees your card or M-Pesa PIN.
                                            </p>
                                        </>
                                    ) : partnerPayUrl ? (
                                        <a href={partnerPayUrl} target="_blank" rel="noreferrer" className="tfe-btn tfe-btn--filled tfe-btn--lg w-100 justify-content-center mb-3">
                                            <i className="fas fa-external-link-alt me-2"></i> Complete on partner
                                        </a>
                                    ) : (
                                        <button className="tfe-btn tfe-btn--lg w-100 justify-content-center mb-3" disabled>
                                            <i className="fas fa-clock me-2"></i> Awaiting partner checkout link
                                        </button>
                                    )}
                                </>
                            )}

                            <Link href={route('fan.journey')} className="tfe-btn w-100 justify-content-center">
                                <i className="fas fa-wallet me-2"></i> Manage Other Payments
                            </Link>
                        </div>

                        {/* Help Card */}
                        <div className="p-4 bg-dark rounded border border-secondary">
                            <h3 className="fs-5 fw-bold mb-3 text-white">Need Help?</h3>
                            <p className="text-white-50 small">If you have questions about your itinerary or need to make changes, our support team is available 24/7.</p>
                            {/* Was href="#" — a dead link (Sprint 68). Messages is where
                                partner conversations live. */}
                            <Link href={route('fan.communication')} className="tfe-booking-help-link small fw-bold">
                                <i className="fas fa-headset me-2" aria-hidden="true"></i> Contact Travel Partner
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .hover-glow:hover {
                    border-color: #dc143c !important;
                    background: rgba(220, 20, 60, 0.05) !important;
                }
                .glow-crimson {
                    border: 1px solid rgba(220, 20, 60, 0.3) !important;
                    box-shadow: 0 0 20px rgba(220, 20, 60, 0.1);
                }
            `}</style>
        </FanLayout>
    );
}

/**
 * Sprint 67 — the fan authorises their bank to pay the travel partner from
 * their trip savings. The bank checks the balance and moves the money; TFE
 * records only that the booking was paid, with the bank's reference.
 */
function PayFromSavings({ booking, links, currency }) {
    const [linkId, setLinkId] = React.useState(links[0].id);
    const [authorise, setAuthorise] = React.useState(false);
    const [busy, setBusy] = React.useState(false);
    const link = links.find((l) => l.id === Number(linkId)) || links[0];
    const due = booking.total_amount - booking.amount_paid;

    const pay = () => {
        setBusy(true);
        router.post(route('fan.bookings.pay-from-savings', booking.id), { link_id: link.id, authorise }, { onFinish: () => setBusy(false) });
    };

    return (
        <div className="tfe-slab mb-3">
            <div className="tfe-slab__body">
                <div className="fw-bold text-white mb-2"><i className="fas fa-university me-2" aria-hidden="true"></i>Pay from my trip savings</div>
                {links.length > 1 && (
                    <select className="tfe-select tfe-select--sm mb-2" value={linkId} onChange={(e) => setLinkId(e.target.value)} aria-label="Savings account">
                        {links.map((l) => <option key={l.id} value={l.id}>{l.bank}{l.goal ? ` — ${l.goal}` : ''}</option>)}
                    </select>
                )}
                <label className="tfe-check">
                    <input type="checkbox" checked={authorise} onChange={(e) => setAuthorise(e.target.checked)} />
                    <span>I authorise {link.bank} to pay {formatMoney(due, currency)} from my savings to the travel partner for this booking.</span>
                </label>
                <button type="button" className="tfe-btn tfe-btn--filled w-100 justify-content-center mt-2" disabled={!authorise || busy} onClick={pay}>
                    {busy ? 'Asking your bank…' : `Pay ${formatMoney(due, currency)} from savings`}
                </button>
                <p className="tfe-form-help mt-2 mb-0">You'll confirm your password first. Your bank checks the balance and pays the partner directly.</p>
            </div>
        </div>
    );
}
