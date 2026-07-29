import React from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Head, Link, router } from '@inertiajs/react';
import DashboardHero from '@/Components/Common/DashboardHero';
import ConfirmationDialog from '@/Components/ConfirmationDialog';
import { formatMoney } from '@/lib/utils';
import { useState } from 'react';

export default function Itineraries({ itineraries }) {
    const [itineraryToConfirm, setItineraryToConfirm] = useState(null);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'approved':
                return { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981', label: 'Approved' };
            case 'modified':
                return { bg: 'rgba(255, 179, 0, 0.2)', color: '#ffb300', label: 'Revised' };
            case 'confirmed':
                return { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', label: 'Booked' };
            default:
                return { bg: 'rgba(255, 255, 255, 0.2)', color: '#fff', label: 'Pending' };
        }
    };

    const handleConfirm = () => {
        if (itineraryToConfirm) {
            router.post(route('fan.budget.confirm', itineraryToConfirm), {}, {
                onSuccess: () => setItineraryToConfirm(null)
            });
        }
    };

    return (
        <FanLayout title="My Itineraries">
            <div className="container-fluid">
                <DashboardHero role="fan" 
                    title="My Itineraries"
                    subtitle="View and manage your travel plans and partner proposals."
                    breadcrumbs={[
                        { label: 'Journey', href: route('fan.journey') },
                        { label: 'My Itineraries' }
                    ]}
                    bgImage="/assets/img/fan/backgrounds/gaming_hero.png"
                />

                <div className="content-card mt-4 p-4">
                    <div className="card-header border-bottom pb-3 mb-4 d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-2">
                             <i className="fas fa-map-marked-alt text-primary fs-4"></i>
                             <h2 className="m-0 fs-4 fw-bold">Recent Plans</h2>
                        </div>
                        <Link href={route('fan.budget-calculator')} className="btn-fan-custom btn-fan-custom-sm">
                            <i className="fas fa-plus me-2"></i> New Plan
                        </Link>
                    </div>

                    <div className="row g-4">
                        {itineraries.length === 0 ? (
                            <div className="col-12 text-center py-5">
                                <div className="p-5 bg-dark rounded border border-secondary">
                                    <i className="fas fa-route fa-4x text-white-50 mb-3"></i>
                                    <h3>No Travel Plans Yet</h3>
                                    <p className="text-white-50">Use our budget calculator to start planning your 2026 World Cup journey.</p>
                                    <Link href={route('fan.budget-calculator')} className="btn-fan-custom mt-3">
                                        Open Budget Calculator
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            itineraries.map((itinerary) => {
                                const style = getStatusStyle(itinerary.status);
                                return (
                                    <div key={itinerary.id} className="col-lg-6">
                                        <div className="p-4 bg-dark rounded border border-secondary hover-glow" style={{ transition: 'all 0.3s ease' }}>
                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                <div>
                                                    <span className="text-white-50 small text-uppercase tracking-wider">{itinerary.reference_id}</span>
                                                    <h3 className="h5 fw-bold text-white mb-0">{itinerary.name}</h3>
                                                    <p className="text-white-50 small mb-0">Created on {itinerary.created_at}</p>
                                                </div>
                                                <span className="badge" style={{ background: style.bg, color: style.color, border: `1px solid ${style.color}` }}>
                                                    {style.label}
                                                </span>
                                            </div>

                                            <div className="row g-3 mb-4">
                                                <div className="col-6">
                                                    <div className="small text-white-50">Your estimate</div>
                                                    <div className="fw-bold">{formatMoney(itinerary.total_cost)}</div>
                                                </div>
                                                {itinerary.partner_cost > 0 && (
                                                    <div className="col-6 text-end">
                                                        <div className="small text-yellow-500">Partner Quote</div>
                                                        <div className="fw-bold text-yellow-500">{formatMoney(itinerary.partner_cost)}</div>
                                                    </div>
                                                )}
                                                <div className="col-4">
                                                    <div className="small text-white-50">Matches</div>
                                                    <div className="fw-bold"><i className="fas fa-futbol me-1 small"></i> {itinerary.match_count}</div>
                                                </div>
                                                <div className="col-4">
                                                    <div className="small text-white-50">Hotel</div>
                                                    <div className="fw-bold text-capitalize">{itinerary.accommodation.replace('_', ' ')}</div>
                                                </div>
                                                <div className="col-4 text-end">
                                                    <div className="small text-white-50">Flight</div>
                                                    <div className="fw-bold text-capitalize">{itinerary.flight}</div>
                                                </div>
                                            </div>

                                            <div className="d-flex gap-2">
                                                <Link 
                                                    href={route('fan.budget-calculator', { id: itinerary.id })} 
                                                    className="btn-fan-custom btn-fan-custom-sm flex-grow-1 justify-content-center"
                                                >
                                                    <i className="fas fa-edit me-2"></i> Edit Plan
                                                </Link>
                                                {(itinerary.status === 'modified' || itinerary.status === 'approved') && itinerary.is_active && (
                                                    <button 
                                                        onClick={() => setItineraryToConfirm(itinerary.id)}
                                                        className="btn-fan-custom btn-fan-custom-sm flex-grow-1 justify-content-center"
                                                        style={{ background: '#dc143c', borderColor: '#dc143c' }}
                                                    >
                                                        <i className="fas fa-check-circle me-2"></i> Review & Confirm
                                                    </button>
                                                )}
                                                {itinerary.is_active && (
                                                    <span className="ms-auto align-self-center text-success small">
                                                        <i className="fas fa-star me-1"></i> Active Plan
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <ConfirmationDialog
                    open={!!itineraryToConfirm}
                    onOpenChange={(open) => !open && setItineraryToConfirm(null)}
                    title="Confirm Itinerary?"
                    description="Are you sure you want to confirm this itinerary? This will create an official booking pending payment."
                    onConfirm={handleConfirm}
                    confirmText="Review & Confirm"
                />
            </div>

            <style>{`
                .hover-glow:hover {
                    border-color: #dc143c !important;
                    box-shadow: 0 0 15px rgba(220, 20, 60, 0.15);
                    transform: translateY(-2px);
                }
            `}</style>
        </FanLayout>
    );
}
