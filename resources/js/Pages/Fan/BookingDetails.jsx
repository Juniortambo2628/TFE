import React, { useState, useEffect } from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Head, Link, router } from '@inertiajs/react';
import FanHero from '@/Components/Fan/FanHero';
import { usePaystackPayment } from 'react-paystack';
import axios from 'axios';
import { toast } from 'sonner';

export default function BookingDetails({ auth, booking, matches }) {
    const formatMoney = (amount) => 'KES ' + new Intl.NumberFormat().format(amount || 0);

    const [paystackConfig, setPaystackConfig] = useState({
        reference: '',
        email: auth.user.email,
        amount: 0,
        publicKey: '',
    });

    const initializePayment = usePaystackPayment(paystackConfig);

    const onSuccessPaystack = (reference) => {
        const loadingToast = toast.loading('Verifying booking payment...');
        router.post(route('fan.payments.verify'), { reference: reference.reference }, {
             onSuccess: () => {
                 toast.dismiss(loadingToast);
                 toast.success("Booking confirmed! Redirecting to your journey...");
                 setPaystackConfig(prev => ({ ...prev, reference: '' }));
                 // Redirect to journey or refresh page
                 setTimeout(() => router.visit(route('fan.journey')), 2000);
             },
             onError: () => {
                 toast.dismiss(loadingToast);
                 toast.error("Verification failed. Please contact support.");
             }
        });
    };

    const onClosePaystack = () => {
        toast.info('Payment cancelled.');
        setPaystackConfig(prev => ({ ...prev, reference: '' }));
    }

    useEffect(() => {
        if (paystackConfig.reference && paystackConfig.publicKey) {
            initializePayment(onSuccessPaystack, onClosePaystack);
        }
    }, [paystackConfig]);

    const handlePayment = () => {
        const loadingToast = toast.loading('Preparing checkout...');
        const amountToPay = booking.total_amount - booking.amount_paid;

        axios.post(route('fan.payments.initiate'), {
            amount: amountToPay,
            booking_id: booking.id,
            method: 'paystack',
            description: `Payment for booking ${booking.package_name}`
        })
        .then(response => {
            toast.dismiss(loadingToast);
            const { reference, public_key } = response.data;
            
            setPaystackConfig({
                reference,
                email: auth.user.email,
                amount: amountToPay * 100, // Paystack uses cents/kobo
                publicKey: public_key,
                currency: 'KES',
            });
        })
        .catch(error => {
             toast.dismiss(loadingToast);
             toast.error(error.response?.data?.message || 'Payment initiation failed');
        });
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'confirmed':
                return { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981', label: 'Confirmed' };
            case 'pending_payment':
                return { bg: 'rgba(255, 179, 0, 0.2)', color: '#ffb300', label: 'Payment Pending' };
            case 'cancelled':
                return { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', label: 'Cancelled' };
            default:
                return { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', label: status.replace('_', ' ') };
        }
    };

    const statusStyle = getStatusStyle(booking.status);

    return (
        <FanLayout title={`Booking: ${booking.package_name}`}>
            <Head title={`Booking: ${booking.package_name}`} />
            
            <div className="container-fluid">
                <FanHero 
                    title={booking.package_name}
                    subtitle={`Reference: ${booking.id.toString().padStart(6, '0')}`}
                    breadcrumbs={[
                        { label: 'Journey', href: route('fan.journey') },
                        { label: 'Booking Details' }
                    ]}
                    bgImage="/assets/img/fan/backgrounds/stadium_hero.png"
                />

                <div className="row mt-4">
                    <div className="col-lg-8">
                        {/* Booking Overview */}
                        <div className="content-card p-4 mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h2 className="fs-4 fw-bold m-0 text-white">Travel Summary</h2>
                                <span className="badge p-2 px-3" style={{ background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.color}` }}>
                                    {statusStyle.label}
                                </span>
                            </div>

                            <div className="row g-4 mb-4">
                                <div className="col-md-4">
                                    <div className="p-3 bg-dark rounded border border-secondary text-center">
                                        <div className="text-white-50 small text-uppercase">Flight Class</div>
                                        <div className="fw-bold fs-5 text-capitalize">{booking.flight_info}</div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="p-3 bg-dark rounded border border-secondary text-center">
                                        <div className="text-white-50 small text-uppercase">Accommodation</div>
                                        <div className="fw-bold fs-5 text-capitalize">{booking.accommodation.replace('_', ' ')}</div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="p-3 bg-dark rounded border border-secondary text-center">
                                        <div className="text-white-50 small text-uppercase">Booking Date</div>
                                        <div className="fw-bold fs-5">{booking.booking_date}</div>
                                    </div>
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
                                    <span className="fw-bold">{formatMoney(booking.total_amount)}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-white-50">Amount Paid</span>
                                    <span className="text-success fw-bold">{formatMoney(booking.amount_paid)}</span>
                                </div>
                                <hr className="border-secondary" />
                                <div className="d-flex justify-content-between">
                                    <span className="fs-5 fw-bold">Balance Due</span>
                                    <span className="fs-5 fw-bold text-danger">{formatMoney(booking.total_amount - booking.amount_paid)}</span>
                                </div>
                            </div>

                            {booking.status === 'pending_payment' && (
                                <>
                                    <div className="alert alert-warning border-warning bg-transparent text-warning-emphasis p-3 mb-4 rounded-3">
                                        <i className="fas fa-exclamation-triangle me-2"></i>
                                        Payment is required to secure this booking. 
                                    </div>
                                    <button 
                                        onClick={handlePayment}
                                        className="btn-fan-custom w-100 justify-content-center py-3 mb-3"
                                        style={{ background: '#dc143c', borderColor: '#dc143c' }}
                                    >
                                        <i className="fas fa-credit-card me-2"></i> Confirm & Pay Now
                                    </button>
                                </>
                            )}

                            <Link href={route('fan.journey')} className="btn-fan-custom w-100 justify-content-center text-white-50">
                                <i className="fas fa-wallet me-2"></i> Manage Other Payments
                            </Link>
                        </div>

                        {/* Help Card */}
                        <div className="p-4 bg-dark rounded border border-secondary">
                            <h3 className="fs-5 fw-bold mb-3 text-white">Need Help?</h3>
                            <p className="text-white-50 small">If you have questions about your itinerary or need to make changes, our support team is available 24/7.</p>
                            <Link href="#" className="text-danger text-decoration-none small fw-bold">
                                <i className="fas fa-headset me-2"></i> Contact Travel Partner
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
