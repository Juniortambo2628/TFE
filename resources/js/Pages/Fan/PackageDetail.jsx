import React from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Link, router } from '@inertiajs/react';
import DashboardHero from '@/Components/Common/DashboardHero';
import StadiumBowl from '@/Components/Common/StadiumBowl';
import ItineraryMap from '@/Components/Fan/ItineraryMap';
import CapacityBar from '@/Components/Common/CapacityBar';
import PoweredByBadge from '@/Components/Common/PoweredByBadge';
import { formatMoney } from '@/lib/utils';

/**
 * Fan-facing package detail page.
 *
 * Shows the "wow" trio for a single prepacked itinerary: hero + copy,
 * included matches list, a 3D seat map of the package's own venues, and
 * the multi-city itinerary map for them. CTA links back into
 * the BudgetCalculator with ?package=<id> so the wizard pre-fills.
 */
export default function PackageDetail({ auth, package: pkg, tournamentSummary, includedMatches = [], venueBowls = [] }) {
    if (!pkg) return null;

    const currency = pkg.currency || tournamentSummary?.pricing?.currency || 'USD';
    const soldOut = pkg.is_sold_out;
    const availPct = pkg.availability_pct;

    const useThisPackage = () => {
        router.visit(route('fan.budget-calculator') + `?package=${pkg.id}`);
    };

    return (
        <FanLayout title={pkg.name}>
            <div className="container-fluid">
                <DashboardHero
                    role="fan"
                    title={pkg.name}
                    subtitle={`${tournamentSummary?.short_name || tournamentSummary?.name || 'Tournament'} · ${(tournamentSummary?.hosts || []).join(' · ')}`}
                    breadcrumbs={[
                        { label: 'Packages', href: route('fan.budget-calculator') },
                        { label: pkg.name },
                    ]}
                    bgImage={pkg.hero_image || '/assets/img/fan/backgrounds/gaming_hero.png'}
                >
                    {pkg.publisher && (
                        <PoweredByBadge publisher={pkg.publisher} variant="strip" />
                    )}
                </DashboardHero>

                <div className="row g-4 mt-2">
                    {/* Left column — description + matches */}
                    <div className="col-lg-8">
                        <div className="content-card">
                            <div className="card-header d-flex align-items-center">
                                <i className="fas fa-gift text-danger me-2"></i>
                                <h3 className="m-0">About this package</h3>
                                {pkg.is_featured && (
                                    <span className="tfe-pill tfe-pill--live ms-auto">Featured</span>
                                )}
                            </div>
                            <p className="text-white-50">
                                {pkg.description || 'A curated tournament trip built by our travel team.'}
                            </p>

                            <div className="tfe-stat-grid mt-3">
                                <div className="tfe-tile tfe-tile--blue">
                                    <div className="tfe-tile__label">Nights</div>
                                    <div className="tfe-tile__value">{pkg.nights}</div>
                                </div>
                                <div className="tfe-tile tfe-tile--cyan">
                                    <div className="tfe-tile__label">Flight</div>
                                    <div className="tfe-tile__value text-capitalize">{pkg.flight_class}</div>
                                </div>
                                <div className="tfe-tile tfe-tile--teal">
                                    <div className="tfe-tile__label">Stay</div>
                                    <div className="tfe-tile__value">{pkg.accommodation_level.replace('_', ' ')}</div>
                                </div>
                                <div className="tfe-tile tfe-tile--amber">
                                    <div className="tfe-tile__label">Matches</div>
                                    <div className="tfe-tile__value">{includedMatches.length}</div>
                                </div>
                            </div>
                        </div>

                        {/* Included matches list */}
                        {includedMatches.length > 0 && (
                            <div className="content-card mt-4">
                                <div className="card-header">
                                    <i className="fas fa-futbol text-info me-2"></i>
                                    <h3 className="m-0">Included matches</h3>
                                </div>
                                <div className="d-flex flex-column gap-2">
                                    {includedMatches.map((m) => (
                                        <div
                                            key={m.id}
                                            className="d-flex align-items-center justify-content-between p-3 rounded"
                                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                                        >
                                            <div>
                                                <div className="text-white fw-semibold">
                                                    {m.homeTeam} <span className="text-white-50 mx-2">vs</span> {m.awayTeam}
                                                </div>
                                                <div className="text-white-50 small">
                                                    {m.date}{m.time ? ` · ${m.time}` : ''}{m.stage ? ` · ${m.stage}` : ''}
                                                </div>
                                            </div>
                                            <div className="text-white-50 small text-end" style={{ minWidth: 160 }}>
                                                <i className="fas fa-map-marker-alt me-1"></i>
                                                {m.venue || 'Venue TBC'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Seat map — the package's own venues, primary first.
                            Occupancy is the venues' real ticket inventory; it is
                            deliberately NOT the package's own availability, which
                            is a different number entirely (seats left on this
                            itinerary, not in the ground) and reading one as the
                            other is what the previous map did. */}
                        {venueBowls.length > 0 && (
                            <div className="content-card mt-4">
                                <div className="card-header">
                                    <i className="fas fa-chair text-warning me-2"></i>
                                    <h3 className="m-0">Seat map</h3>
                                </div>
                                <StadiumBowl
                                    bowls={venueBowls}
                                    height={400}
                                    note="Seats shown are the ground's own inventory, not this package's allocation. Your seats are confirmed when you book."
                                />
                            </div>
                        )}

                        {/* Multi-city itinerary map */}
                        <div className="content-card mt-4">
                            <div className="card-header">
                                <i className="fas fa-map-location-dot text-info me-2"></i>
                                <h3 className="m-0">Where you'll go</h3>
                            </div>
                            <ItineraryMap
                                venues={tournamentSummary?.venues || []}
                                selectedMatches={includedMatches}
                                height={340}
                            />
                        </div>
                    </div>

                    {/* Right column — sticky booking card */}
                    <div className="col-lg-4">
                        <div
                            className="content-card position-sticky"
                            style={{ top: '1rem' }}
                        >
                            <div className="text-white-50 small">Fixed price</div>
                            <div className="text-white fw-bold" style={{ fontSize: '2rem' }}>
                                {formatMoney(pkg.base_price, currency || 'USD')}
                            </div>
                            <div className="text-white-50 small mb-3">per person, all-in</div>

                            <CapacityBar
                                sold={pkg.sold_count}
                                capacity={pkg.capacity}
                                pct={availPct}
                                size="md"
                                seatsLeftLabel
                                className="mb-3"
                            />

                            <button
                                type="button"
                                onClick={useThisPackage}
                                disabled={soldOut}
                                className="tfe-btn tfe-btn--filled tfe-btn--lg w-100 justify-content-center"
                            >
                                <i className={`fas ${soldOut ? 'fa-ban' : 'fa-arrow-right'}`} />
                                {soldOut ? 'Sold out' : 'Use this package'}
                            </button>

                            <Link href={route('fan.budget-calculator')} className="tfe-btn w-100 justify-content-center mt-2">
                                <i className="fas fa-chevron-left" />Back to picker
                            </Link>

                            <div className="mt-3 text-white-50" style={{ fontSize: '0.75rem' }}>
                                <i className="fas fa-info-circle me-1"></i>
                                Selecting this package pre-fills the calculator so you can still tweak nights, matches or accommodation before saving.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </FanLayout>
    );
}
