import React from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Link, router } from '@inertiajs/react';
import DashboardHero from '@/Components/Common/DashboardHero';
import StadiumSeatMap from '@/Components/Fan/StadiumSeatMap';
import ItineraryMap from '@/Components/Fan/ItineraryMap';
import CapacityBar from '@/Components/Common/CapacityBar';

/**
 * Fan-facing package detail page.
 *
 * Shows the "wow" trio for a single prepacked itinerary: hero + copy,
 * included matches list, seat map for the package's primary stadium,
 * and the multi-city itinerary map for its venues. CTA links back into
 * the BudgetCalculator with ?package=<id> so the wizard pre-fills.
 */
export default function PackageDetail({ auth, package: pkg, tournamentSummary, includedMatches = [], stadiumName }) {
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
                />

                <div className="row g-4 mt-2">
                    {/* Left column — description + matches */}
                    <div className="col-lg-8">
                        <div className="content-card">
                            <div className="card-header d-flex align-items-center">
                                <i className="fas fa-gift text-danger me-2"></i>
                                <h3 className="m-0">About this package</h3>
                                {pkg.is_featured && (
                                    <span
                                        className="ms-auto badge"
                                        style={{
                                            background: 'linear-gradient(135deg, #f59e0b, #dc143c)',
                                            color: '#fff', padding: '4px 10px', borderRadius: 999,
                                        }}
                                    >
                                        Featured
                                    </span>
                                )}
                            </div>
                            <p className="text-white-50">
                                {pkg.description || 'A curated tournament trip built by our travel team.'}
                            </p>

                            <div className="row g-3 mt-2">
                                <div className="col-6 col-md-3">
                                    <div className="p-3 rounded" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <div className="text-white-50 small">Nights</div>
                                        <div className="text-white fw-bold fs-5">{pkg.nights}</div>
                                    </div>
                                </div>
                                <div className="col-6 col-md-3">
                                    <div className="p-3 rounded" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <div className="text-white-50 small">Flight</div>
                                        <div className="text-white fw-bold fs-5 text-capitalize">{pkg.flight_class}</div>
                                    </div>
                                </div>
                                <div className="col-6 col-md-3">
                                    <div className="p-3 rounded" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <div className="text-white-50 small">Stay</div>
                                        <div className="text-white fw-bold fs-5">{pkg.accommodation_level.replace('_', ' ')}</div>
                                    </div>
                                </div>
                                <div className="col-6 col-md-3">
                                    <div className="p-3 rounded" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <div className="text-white-50 small">Matches</div>
                                        <div className="text-white fw-bold fs-5">{includedMatches.length}</div>
                                    </div>
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

                        {/* Seat map for the primary stadium */}
                        {stadiumName && (
                            <div className="content-card mt-4">
                                <div className="card-header">
                                    <i className="fas fa-chair text-warning me-2"></i>
                                    <h3 className="m-0">Seat map — {stadiumName}</h3>
                                </div>
                                <StadiumSeatMap
                                    stadiumName={stadiumName}
                                    capacity={parseCapacity(pickCapacity(tournamentSummary?.venues, stadiumName), 60000)}
                                    soldPct={availPct ?? 50}
                                    currency={currency}
                                    basePrice={tournamentSummary?.pricing?.ticket_prices?.['Group Stage'] || 150}
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
                                {currency} {Number(pkg.base_price).toLocaleString()}
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
                                className="btn-fan-custom w-100 justify-content-center"
                                style={{
                                    background: soldOut ? '#4b5563' : '#dc143c',
                                    borderColor: soldOut ? '#4b5563' : '#dc143c',
                                    cursor: soldOut ? 'not-allowed' : 'pointer',
                                }}
                            >
                                <i className={`fas ${soldOut ? 'fa-ban' : 'fa-arrow-right'} me-2`}></i>
                                {soldOut ? 'Sold out' : 'Use this package'}
                            </button>

                            <Link href={route('fan.budget-calculator')} className="btn-glass-pill w-100 justify-content-center mt-2">
                                <i className="fas fa-chevron-left me-2"></i>Back to picker
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

function pickCapacity(venues, name) {
    if (!venues || !name) return null;
    const v = venues.find(x => (x.name || '').toLowerCase() === name.toLowerCase());
    return v?.capacity ?? null;
}

function parseCapacity(raw, fallback) {
    if (raw === null || raw === undefined) return fallback;
    if (typeof raw === 'number' && !Number.isNaN(raw)) return raw;
    const digits = String(raw).replace(/[^\d]/g, '');
    const n = parseInt(digits, 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
}
