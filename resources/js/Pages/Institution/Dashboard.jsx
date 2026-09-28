import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import InstitutionLayout from '@/Layouts/InstitutionLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import ContentCard from '@/Components/Common/ContentCard';
import ConfirmationDialog from '@/Components/ConfirmationDialog';
import MinorsBadge from '@/Components/Common/MinorsBadge';
import SchoolGroupWizard from '@/Components/Fan/SchoolGroupWizard';
import { formatMoney } from '@/lib/utils';

/**
 * The group dashboard (Sprint 62).
 *
 * A school's questions are not a fan's. It does not want a Predict streak
 * and a shopping basket; it wants to know how many young people it is
 * accountable for on this platform, and which of its trips a partner is
 * looking at without a declaration behind it.
 *
 * The undeclared count leads for that reason. A plan already sitting in a
 * partner's queue with no declaration is the exact window the declaration
 * model exists to close, so it is a called-out panel rather than a number
 * somebody has to go and derive.
 */
export default function InstitutionDashboard({ institution, trips = [], stats }) {
    const [declareFor, setDeclareFor] = useState(null);
    const [withdrawFrom, setWithdrawFrom] = useState(null);

    const undeclared = trips.filter((t) => !t.school_group);
    const declared = trips.filter((t) => t.school_group);

    const handleWithdraw = () => {
        if (!withdrawFrom) return;
        router.delete(route('fan.budgets.school-group.destroy', withdrawFrom), {
            preserveScroll: true,
            onSuccess: () => setWithdrawFrom(null),
        });
    };

    return (
        <InstitutionLayout title="Group Dashboard">
            <div className="container-fluid">
                <DashboardHero
                    role="institution"
                    title={institution?.institution_name || 'Your institution'}
                    subtitle={[institution?.type_label, institution?.location].filter(Boolean).join(' · ')
                        || 'Plan and declare group trips in one place.'}
                    breadcrumbs={[{ label: 'Group Dashboard' }]}
                    bgImage="/assets/img/backdrops/stadium-fans.jpg"
                />

                {/* Verification is stated, never assumed. An account that
                    could present itself as verified on self-declaration is an
                    account whose verification means nothing. */}
                {institution && !institution.is_verified && (
                    <div className="tfe-slab mt-4">
                        <div className="tfe-slab__body d-flex flex-wrap align-items-center gap-3">
                            <span className="tfe-pill tfe-pill--pending">
                                <i className="fas fa-clock"></i> Verification {institution.verification_status}
                            </span>
                            <span className="text-white-50">
                                You can plan and declare trips now. TFE verifies your institution before a
                                group booking is confirmed — add a registration number on your{' '}
                                <Link href={route('institution.profile')} className="text-white">institution page</Link>{' '}
                                to speed that up.
                            </span>
                        </div>
                    </div>
                )}

                <div className="summary-cards-grid mt-4">
                    <Tile icon="fas fa-route" variant="teal" value={stats.trips} label="Group trips" />
                    <Tile icon="fas fa-file-signature" variant="blue" value={stats.declared} label="Declared" />
                    <Tile
                        icon="fas fa-triangle-exclamation"
                        variant={stats.undeclared > 0 ? 'amber' : 'graph'}
                        value={stats.undeclared}
                        label="Awaiting declaration"
                        // "All trips declared" for an institution with no
                        // trips is a claim about nothing — the same small
                        // untruth as an "0 minors" chip on a solo trip.
                        subtext={stats.undeclared > 0
                            ? 'A partner may already be quoting these'
                            : (stats.trips > 0 ? 'All trips declared' : null)}
                    />
                    <Tile icon="fas fa-child" variant="rose" value={stats.minors} label="Travellers under 18" subtext={`${stats.adults} accompanying adults`} />
                    <Tile icon="fas fa-hourglass-half" variant="violet" value={stats.awaiting_partner} label="Awaiting partner" />
                </div>

                {undeclared.length > 0 && (
                    <div className="mt-4">
                        <ContentCard
                            title="These trips need a declaration"
                            subtitle="A partner sees the request as soon as it is saved. Until you declare, it carries no group details and no minors flag."
                        >
                            <div className="d-flex flex-column gap-2">
                                {undeclared.map((trip) => (
                                    <div key={trip.id} className="inst-row">
                                        <div>
                                            <div className="inst-row__ref">{trip.reference_id}</div>
                                            <strong className="text-white">{trip.name}</strong>
                                            <div className="text-white-50 small">
                                                {formatMoney(trip.total_cost, trip.currency)} · saved {trip.created_at}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="tfe-btn tfe-btn--filled tfe-btn--sm"
                                            onClick={() => setDeclareFor(trip)}
                                        >
                                            <i className="fas fa-file-signature"></i> Declare group
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </ContentCard>
                    </div>
                )}

                <div className="mt-4">
                    <ContentCard
                        title="Declared group trips"
                        subtitle="What each travel partner sees on your request."
                        action={
                            <Link href={route('fan.budget-calculator')} className="tfe-btn tfe-btn--sm">
                                <i className="fas fa-plus"></i> Plan a trip
                            </Link>
                        }
                    >
                        {declared.length === 0 ? (
                            <div className="tfe-empty tfe-empty--inline">
                                <div className="tfe-empty__icon"><i className="fas fa-school"></i></div>
                                <div className="tfe-empty__title">No declarations yet</div>
                                <div className="tfe-empty__body">
                                    Plan a trip in the calculator, then declare your travelling party against it.
                                </div>
                                <Link href={route('fan.budget-calculator')} className="tfe-btn tfe-btn--filled tfe-empty__action">
                                    Open the trip planner
                                </Link>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="tfe-table tfe-table--compact">
                                    <thead>
                                        <tr>
                                            <th>Trip</th>
                                            <th>Travelling party</th>
                                            <th>Declared by</th>
                                            <th>Partner</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {declared.map((trip) => (
                                            <tr key={trip.id}>
                                                <td>
                                                    <div className="inst-row__ref">{trip.reference_id}</div>
                                                    <strong className="text-white">{trip.name}</strong>
                                                    <div className="text-white-50 small">
                                                        {formatMoney(trip.total_cost, trip.currency)}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex flex-column gap-2 align-items-start">
                                                        <span className="text-white">{trip.school_group.party_summary}</span>
                                                        <MinorsBadge group={trip.school_group} compact />
                                                        {!trip.school_group.is_complete && (
                                                            <span className="tfe-form-error">Incomplete declaration</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="text-white">{trip.school_group.official_name}</span>
                                                    <div className="text-white-50 small">{trip.school_group.official_role}</div>
                                                    <div className="text-white-50 small">{trip.school_group.declared_at}</div>
                                                </td>
                                                <td>
                                                    <span className={`tfe-pill tfe-pill--${trip.status === 'approved' ? 'approved' : 'pending'}`}>
                                                        {trip.status === 'approved' ? 'Quoted' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-2 justify-content-end">
                                                        <button
                                                            type="button"
                                                            className="tfe-btn tfe-btn--sm"
                                                            onClick={() => setDeclareFor(trip)}
                                                        >
                                                            Amend
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="tfe-btn tfe-btn--sm tfe-btn--icon"
                                                            title="Withdraw the declaration"
                                                            aria-label="Withdraw the declaration"
                                                            onClick={() => setWithdrawFrom(trip.id)}
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </ContentCard>
                </div>

                {/* Mounted conditionally and keyed: useForm reads its initial
                    values on FIRST mount only (Sprint 57). */}
                {declareFor && (
                    <SchoolGroupWizard
                        key={declareFor.id}
                        open
                        itinerary={declareFor}
                        institution={institution}
                        onClose={() => setDeclareFor(null)}
                    />
                )}

                <ConfirmationDialog
                    open={!!withdrawFrom}
                    onOpenChange={(open) => !open && setWithdrawFrom(null)}
                    title="Withdraw this declaration?"
                    description="The travel partner will stop seeing that this is a group trip, including the minors flag. Withdraw it only if the declaration was made on the wrong plan."
                    onConfirm={handleWithdraw}
                    confirmText="Withdraw declaration"
                />
            </div>

            <style>{`
                .inst-row {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                    padding: 14px 16px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.03);
                }
                .inst-row__ref {
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 0.68rem;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    font-weight: 600;
                }
            `}</style>
        </InstitutionLayout>
    );
}

function Tile({ icon, variant, value, label, subtext }) {
    return (
        <div className={`tfe-tile tfe-tile--${variant}`}>
            <div className="tfe-tile__head">
                <span className="tfe-tile__icon"><i className={icon}></i></span>
            </div>
            <div className="tfe-tile__value">{value}</div>
            <div className="tfe-tile__label">{label}</div>
            {subtext && <div className="tfe-tile__subtext">{subtext}</div>}
        </div>
    );
}
