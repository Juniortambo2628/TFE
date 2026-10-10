import React from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Head, Link, router } from '@inertiajs/react';
import DashboardHero from '@/Components/Common/DashboardHero';
import ConfirmationDialog from '@/Components/ConfirmationDialog';
import MinorsBadge from '@/Components/Common/MinorsBadge';
import SchoolGroupWizard from '@/Components/Fan/SchoolGroupWizard';
import { formatMoney } from '@/lib/utils';
import { useState } from 'react';
import { useTournament } from '@/Context/TournamentContext';

export default function Itineraries({ itineraries }) {
    const { tournament } = useTournament();
    const [itineraryToConfirm, setItineraryToConfirm] = useState(null);
    const [schoolGroupFor, setSchoolGroupFor] = useState(null);
    const [withdrawFrom, setWithdrawFrom] = useState(null);

    // ?accept=<id> (the quote notification's link) opens that plan's accept
    // dialog directly — one tap from the bell to payment (Sprint 65).
    React.useEffect(() => {
        const id = new URLSearchParams(window.location.search).get('accept');
        if (!id) return;
        const plan = itineraries.find((i) => String(i.id) === id);
        if (plan && ['approved', 'modified'].includes(plan.status)) setItineraryToConfirm(plan.id);
    }, []);

    const getStatusPill = (status) => {
        switch (status) {
            case 'approved':
                return { variant: 'approved', label: 'Approved' };
            case 'modified':
                return { variant: 'pending', label: 'Revised' };
            case 'confirmed':
                return { variant: 'info', label: 'Booked' };
            default:
                return { variant: 'info', label: 'Pending' };
        }
    };

    const handleConfirm = () => {
        if (itineraryToConfirm) {
            router.post(route('fan.budget.confirm', itineraryToConfirm), {}, {
                onSuccess: () => setItineraryToConfirm(null)
            });
        }
    };

    const handleWithdraw = () => {
        if (!withdrawFrom) return;
        router.delete(route('fan.budgets.school-group.destroy', withdrawFrom), {
            preserveScroll: true,
            onSuccess: () => setWithdrawFrom(null),
        });
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

                <div className="tfe-slab mt-4">
                    <div className="tfe-slab__header">
                        <div>
                            <h2 className="tfe-slab__title">Recent Plans</h2>
                            <div className="tfe-slab__title-sub">Your saved travel plans and partner proposals</div>
                        </div>
                        <Link href={route('fan.budget-calculator')} className="tfe-btn tfe-btn--sm tfe-btn--filled">
                            <i className="fas fa-plus"></i> New Plan
                        </Link>
                    </div>

                    <div className="tfe-slab__body">
                        {itineraries.length === 0 ? (
                            <div className="tfe-empty">
                                <div className="tfe-empty__icon">
                                    <i className="fas fa-route"></i>
                                </div>
                                <div className="tfe-empty__title">No Travel Plans Yet</div>
                                <div className="tfe-empty__body">
                                    {`Use our budget calculator to start planning your ${tournament?.short_name || 'tournament'} journey.`}
                                </div>
                                <Link href={route('fan.budget-calculator')} className="tfe-btn tfe-btn--filled tfe-empty__action">
                                    Open Budget Calculator
                                </Link>
                            </div>
                        ) : (
                            <div className="itin-plans-grid">
                                {itineraries.map((itinerary) => {
                                    const pill = getStatusPill(itinerary.status);
                                    return (
                                        <div key={itinerary.id} className="itin-plan-card">
                                            <div className="itin-plan-card__head">
                                                <div>
                                                    <div className="itin-plan-card__ref">{itinerary.reference_id}</div>
                                                    <h3 className="itin-plan-card__title">{itinerary.name}</h3>
                                                    <div className="itin-plan-card__sub">Created on {itinerary.created_at}</div>
                                                </div>
                                                <div className="d-flex flex-column align-items-end gap-2">
                                                    <span className={`tfe-pill tfe-pill--${pill.variant} tfe-pill--standalone`}>{pill.label}</span>
                                                    {/* Renders nothing unless minors are actually
                                                        declared — the same component the partner's
                                                        queue and brief draw. */}
                                                    <MinorsBadge group={itinerary.school_group} compact />
                                                </div>
                                            </div>

                                            <div className="itin-plan-card__facts">
                                                <div>
                                                    <div className="itin-plan-card__fact-label">Your estimate</div>
                                                    <div className="itin-plan-card__fact-value">{formatMoney(itinerary.total_cost)}</div>
                                                </div>
                                                {itinerary.partner_cost > 0 && (
                                                    <div>
                                                        <div className="itin-plan-card__fact-label">Partner quote</div>
                                                        <div className="itin-plan-card__fact-value itin-plan-card__fact-value--accent">
                                                            {formatMoney(itinerary.partner_cost)}
                                                        </div>
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="itin-plan-card__fact-label">Matches</div>
                                                    <div className="itin-plan-card__fact-value">
                                                        <i className="fas fa-futbol"></i> {itinerary.match_count}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="itin-plan-card__fact-label">Hotel</div>
                                                    <div className="itin-plan-card__fact-value text-capitalize">
                                                        {itinerary.accommodation.replace('_', ' ')}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="itin-plan-card__fact-label">Flight</div>
                                                    <div className="itin-plan-card__fact-value text-capitalize">{itinerary.flight}</div>
                                                </div>
                                            </div>

                                            {itinerary.school_group && (
                                                <div className="itin-plan-card__school">
                                                    <div className="itin-plan-card__fact-label">School group</div>
                                                    <div className="itin-plan-card__fact-value">
                                                        {itinerary.school_group.school_name}
                                                    </div>
                                                    <div className="itin-plan-card__sub">
                                                        {itinerary.school_group.party_summary} ·
                                                        declared by {itinerary.school_group.official_name}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="itin-plan-card__actions">
                                                <Link
                                                    href={route('fan.budget-calculator', { id: itinerary.id })}
                                                    className="tfe-btn tfe-btn--sm"
                                                >
                                                    <i className="fas fa-edit"></i> Edit Plan
                                                </Link>
                                                {(itinerary.status === 'modified' || itinerary.status === 'approved') && itinerary.is_active && (
                                                    <button
                                                        onClick={() => setItineraryToConfirm(itinerary.id)}
                                                        className="tfe-btn tfe-btn--filled tfe-btn--sm"
                                                    >
                                                        <i className="fas fa-check-circle"></i> Review & Confirm
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => setSchoolGroupFor(itinerary)}
                                                    className="tfe-btn tfe-btn--sm"
                                                >
                                                    <i className="fas fa-school"></i>
                                                    {itinerary.school_group ? ' School group' : ' Declare school group'}
                                                </button>
                                                {itinerary.school_group && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setWithdrawFrom(itinerary.id)}
                                                        className="tfe-btn tfe-btn--sm tfe-btn--icon"
                                                        title="Withdraw the school group declaration"
                                                        aria-label="Withdraw the school group declaration"
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                )}
                                                {itinerary.is_active && (
                                                    <span className="itin-plan-card__active-flag">
                                                        <i className="fas fa-star"></i> Active Plan
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {schoolGroupFor && (
                    <SchoolGroupWizard
                        key={schoolGroupFor.id}
                        open
                        itinerary={schoolGroupFor}
                        onClose={() => setSchoolGroupFor(null)}
                    />
                )}

                <ConfirmationDialog
                    open={!!withdrawFrom}
                    onOpenChange={(open) => !open && setWithdrawFrom(null)}
                    title="Withdraw this declaration?"
                    description="The travel partner will stop seeing that this is a school group, including the minors flag. Withdraw it only if the declaration was made on the wrong plan."
                    onConfirm={handleWithdraw}
                    confirmText="Withdraw declaration"
                />

                <ConfirmationDialog
                    open={!!itineraryToConfirm}
                    onOpenChange={(open) => !open && setItineraryToConfirm(null)}
                    title="Confirm Itinerary?"
                    description="Are you sure you want to confirm this itinerary? This will create an official booking pending payment."
                    onConfirm={handleConfirm}
                    confirmText="Accept & pay"
                />
            </div>

            <style>{`
                .itin-plans-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                    gap: 18px;
                }
                .itin-plan-card {
                    background: linear-gradient(155deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.015));
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    padding: 20px 22px;
                    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
                    transition: transform 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .itin-plan-card:hover {
                    transform: translateY(-2px);
                    border-color: rgba(255, 255, 255, 0.16);
                    box-shadow: 0 18px 36px rgba(0, 0, 0, 0.5);
                }
                .itin-plan-card__head {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 12px;
                }
                .itin-plan-card__ref {
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 0.7rem;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    font-weight: 600;
                }
                .itin-plan-card__title {
                    color: #fff;
                    font-size: 1.05rem;
                    font-weight: 700;
                    margin: 4px 0 2px;
                    letter-spacing: -0.005em;
                }
                .itin-plan-card__sub {
                    color: rgba(255, 255, 255, 0.55);
                    font-size: 0.78rem;
                }
                .itin-plan-card__facts {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px 20px;
                }
                .itin-plan-card__fact-label {
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 0.68rem;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    font-weight: 600;
                    margin-bottom: 2px;
                }
                .itin-plan-card__fact-value {
                    color: #fff;
                    font-weight: 600;
                    font-size: 0.92rem;
                }
                .itin-plan-card__fact-value--accent { color: #fcd34d; }
                .itin-plan-card__school {
                    border-top: 1px solid rgba(255, 255, 255, 0.08);
                    padding-top: 14px;
                }
                .itin-plan-card__fact-value i { margin-right: 6px; opacity: 0.75; }
                .itin-plan-card__actions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    align-items: center;
                    margin-top: auto;
                }
                .itin-plan-card__actions .tfe-btn { flex: 1 1 auto; justify-content: center; }
                .itin-plan-card__active-flag {
                    font-size: 0.75rem;
                    color: #34d399;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    margin-left: auto;
                }
            `}</style>
        </FanLayout>
    );
}
