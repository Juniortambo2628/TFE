import React from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Head, Link, router, usePage, usePoll } from '@inertiajs/react';
import DashboardHero from '@/Components/Common/DashboardHero';
import { formatMoney, formatDateTime } from '@/lib/utils';
import StepFlow from '@/Components/Common/StepFlow';
import MobileActionBar from '@/Components/Common/MobileActionBar';
import TfeModal from '@/Components/Common/TfeModal';
import { bookingTimeline } from '@/lib/tripTimeline';

export default function BookingDetails({
    auth,
    booking,
    matches,
    checkout = null,
    mpesa = null,
    mpesaDirect = false,
    mpesaAttempt = null,
    mpesaPhone = null,
    timeline = {},
    savingsLinks = [],
}) {
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
    const [phoneOpen, setPhoneOpen] = React.useState(false);
    const [phone, setPhone] = React.useState(mpesaPhone || '');
    const [phoneError, setPhoneError] = React.useState(null);
    const expiresAt = booking?.expires_at ? new Date(booking.expires_at) : null;
    const { flash } = usePage().props;

    // Direct Daraja collects the number first; the hosted Paystack path asks
    // for it on their own page, and demo settles without any prompt.
    const needsPhone = mpesaDirect && checkout !== 'demo';
    const promptPending = mpesaAttempt?.status === 'pending';
    const promptFailed = mpesaAttempt?.status === 'failed';

    const payNow = (method = 'card', phone = null) => {
        setPaying(method);
        router.post(
            route('fan.bookings.pay', booking.id),
            phone ? { method, phone } : { method },
            { onFinish: () => setPaying(false) },
        );
    };

    const openMpesa = () => {
        if (needsPhone) {
            setPhoneError(null);
            setPhoneOpen(true);
            return;
        }
        payNow('mpesa');
    };

    const submitPhone = (e) => {
        e.preventDefault();
        const digits = String(phone).replace(/\D/g, '');
        if (!/^(?:254|0)?[71]\d{8}$/.test(digits)) {
            setPhoneError('Enter a valid Safaricom number, e.g. 0712345678.');
            return;
        }
        setPhoneError(null);
        setPhoneOpen(false);
        payNow('mpesa', digits);
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

    const payHelp = checkout === 'mpesa'
        ? 'M-Pesa prompts come straight from Safaricom. TFE never sees your M-Pesa PIN.'
        : (mpesaDirect && checkout !== 'demo')
            ? 'Card payments run through Paystack, M-Pesa prompts come from Safaricom. TFE never sees your card or M-Pesa PIN.'
            : 'Secure payment by Paystack. TFE never sees your card or M-Pesa PIN.';

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

                {/* Flash errors/successes from the pay endpoints. This page
                    rendered none until Nov 2026, so every controller rejection
                    ("hold expired", "M-Pesa not available", bad phone) was
                    invisible here. */}
                {flash?.success && (
                    <div className="dash-flash-success" role="status">
                        <i className="fas fa-check-circle me-2" aria-hidden="true"></i>
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="dash-flash-error" role="alert">
                        <i className="fas fa-exclamation-circle me-2" aria-hidden="true"></i>
                        {flash.error}
                    </div>
                )}

                {/* Phones: the way to pay is pinned, whichever way it is. The
                    bar used to render only with in-app checkout, so with no
                    Paystack key (the default) a fan landed on "Payment due"
                    with the partner's link two screens down (booking-path
                    pass, UX review 2 Nov 2026). */}
                {booking.status === 'pending_payment' && !checkout && (
                    <MobileActionBar
                        note={partnerPayUrl
                            ? `Balance ${formatMoney(booking.total_amount - booking.amount_paid, currency)} · paid on the partner's checkout`
                            // Honest, not "we'll let you know": nothing in the backend
                            // sets partner_pay_url or notifies on it today, so without
                            // Paystack the partner is the only route to paying.
                            : 'Online payment is not switched on yet. Message your partner to arrange payment.'}
                    >
                        {partnerPayUrl ? (
                            <a href={partnerPayUrl} target="_blank" rel="noreferrer" className="tfe-btn tfe-btn--filled">
                                <i className="fas fa-external-link-alt" aria-hidden="true"></i> Complete on partner
                            </a>
                        ) : (
                            <Link href={route('fan.communication')} className="tfe-btn">
                                <i className="fas fa-headset" aria-hidden="true"></i> Contact partner
                            </Link>
                        )}
                    </MobileActionBar>
                )}

                {booking.status === 'pending_payment' && checkout && (
                    <MobileActionBar
                        note={promptPending
                            ? 'Check your phone — enter your M-Pesa PIN to finish paying.'
                            : `Balance ${formatMoney(booking.total_amount - booking.amount_paid, currency)}${expiresAt ? ` · held until ${formatDateTime(expiresAt)}` : ''}`}
                    >
                        {/* Buttons stand down while a prompt is live: paying by
                            card mid-prompt could settle the same balance twice. */}
                        {!promptPending && (
                            <>
                                {mpesa !== null && (
                                    <button type="button" className="tfe-btn tfe-btn--filled" disabled={Boolean(paying)} onClick={openMpesa}>
                                        <i className="fas fa-mobile-alt" aria-hidden="true"></i> M-Pesa
                                    </button>
                                )}
                                {checkout !== 'mpesa' && (
                                    <button type="button" className={`tfe-btn ${mpesa === null ? 'tfe-btn--filled' : ''}`} disabled={Boolean(paying)} onClick={() => payNow('card')}>
                                        <i className="fas fa-credit-card" aria-hidden="true"></i> {mpesa === null ? 'Pay now' : 'Card'}
                                    </button>
                                )}
                            </>
                        )}
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
                                    <div className="booking-hold-note">
                                        <i className="fas fa-exclamation-triangle me-2"></i>
                                        Payment is required to secure this booking.
                                        {expiresAt && ` It is held until ${formatDateTime(expiresAt)}.`}
                                    </div>

                                    {/* A live prompt owns the whole block: the fan
                                        is at their phone, and offering card or
                                        savings beside it invites settling the
                                        same balance twice. */}
                                    {promptPending ? (
                                        <div className="tfe-slab" role="status">
                                            <div className="tfe-slab__body">
                                                <div className="fw-bold text-white mb-2">
                                                    <i className="fas fa-mobile-alt me-2" aria-hidden="true"></i>Check your phone
                                                </div>
                                                <p className="mb-2 text-white-50">
                                                    We sent an M-Pesa prompt for <strong className="text-white">{formatMoney(Math.round(mpesa || 0), 'KES')}</strong>.
                                                    Enter your PIN to approve it — this page updates on its own.
                                                </p>
                                                <p className="tfe-form-help mb-0">
                                                    <i className="fas fa-spinner fa-spin me-1" aria-hidden="true"></i>
                                                    Waiting for confirmation…
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {promptFailed && (
                                                <div className="dash-flash-error" role="alert">
                                                    <i className="fas fa-exclamation-circle me-2" aria-hidden="true"></i>
                                                    Your M-Pesa payment didn't go through — the prompt expired or was cancelled. You can try again.
                                                </div>
                                            )}
                                            {savingsLinks.length > 0 && <PayFromSavings booking={booking} links={savingsLinks} currency={currency} />}
                                            {checkout ? (
                                                <>
                                                    {/* M-Pesa first where it is offered: most East African
                                                        fans pay by phone, not card (Sprint 66). */}
                                                    {mpesa !== null && (
                                                        <button
                                                            type="button"
                                                            onClick={openMpesa}
                                                            disabled={Boolean(paying)}
                                                            className="tfe-btn tfe-btn--filled tfe-btn--lg w-100 justify-content-center mb-2"
                                                        >
                                                            <i className="fas fa-mobile-alt me-2" aria-hidden="true"></i>
                                                            {paying === 'mpesa'
                                                                ? (needsPhone ? 'Opening…' : 'Opening M-Pesa…')
                                                                : `Pay ${formatMoney(Math.round(mpesa), 'KES')} with M-Pesa`}
                                                            {checkout === 'demo' && ' (demo)'}
                                                        </button>
                                                    )}
                                                    {checkout !== 'mpesa' && (
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
                                                    )}
                                                    <p className="tfe-form-help mb-3">
                                                        <i className="fas fa-shield-alt me-1" aria-hidden="true"></i>
                                                        {payHelp}
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
                                <i className="fas fa-headset me-2"></i> Contact Travel Partner
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Direct STK: collect the number, then the prompt goes out. */}
            <TfeModal
                open={phoneOpen}
                onClose={() => setPhoneOpen(false)}
                size="sm"
                fit
                label="M-Pesa"
                title="Pay with M-Pesa"
                heading={mpesa ? formatMoney(Math.round(mpesa), 'KES') : ''}
                subheading="Enter the number that should receive the prompt"
                footer={(
                    <>
                        <button type="button" className="tfe-btn" onClick={() => setPhoneOpen(false)}>Cancel</button>
                        <button
                            type="submit"
                            form="mpesa-phone-form"
                            className="tfe-btn tfe-btn--filled"
                            disabled={Boolean(paying)}
                        >
                            <i className={`fas ${paying ? 'fa-spinner fa-spin' : 'fa-mobile-alt'}`} aria-hidden="true"></i>
                            {paying ? 'Sending…' : 'Send prompt'}
                        </button>
                    </>
                )}
            >
                <form id="mpesa-phone-form" onSubmit={submitPhone}>
                    <div className="tfe-form-field">
                        <label className="tfe-form-label" htmlFor="mpesa-stk-phone">Safaricom number</label>
                        <input
                            id="mpesa-stk-phone"
                            className="tfe-input"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            placeholder="0712 345 678"
                            value={phone}
                            onChange={(e) => { setPhone(e.target.value); setPhoneError(null); }}
                            aria-describedby="mpesa-stk-help"
                        />
                        {phoneError && <p className="tfe-form-error" role="alert">{phoneError}</p>}
                        <p className="tfe-form-help" id="mpesa-stk-help">
                            You'll get a prompt on this number. Enter your M-Pesa PIN to approve the payment.
                        </p>
                    </div>
                </form>
            </TfeModal>

            {/* Mounted only while a prompt is live: polls the booking page's
                own props until the callback (or the server-side query
                fallback) flips the attempt, then unmounts and stops. */}
            {promptPending && <MpesaWatcher />}

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
 * Re-requests the booking + attempt while an STK prompt is live. Inertia
 * pauses polling in background tabs, and unmounting (prompt settled) stops it.
 */
function MpesaWatcher() {
    usePoll(3000, { only: ['booking', 'mpesaAttempt'] }, { keepAlive: false });
    return null;
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
