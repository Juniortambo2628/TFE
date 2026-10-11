import React from 'react';
import { formatMoney } from '@/lib/utils';
import { getFlightOrigins, getTicketPrices, getInsuranceDaily, getMerchandisePerMatch } from '@/Data/BudgetPricingData';
import AccentCard from '@/Components/Common/AccentCard';
import StadiumBowl from '@/Components/Common/StadiumBowl';
import CostScenarioChart from '@/Components/Fan/CostScenarioChart';
import ItineraryMap from '@/Components/Fan/ItineraryMap';
import FinanceThisTrip from '@/Components/Fan/FinanceThisTrip';
import DonutChart from './DonutChart';

/**
 * The Budget Calculator's results section.
 *
 * Split out of BudgetCalculator.jsx and loaded lazily by it: recharts, the
 * itinerary map and the seat-map wrapper are only needed once there is a
 * result, so a fan on step 1 no longer downloads them.
 */
const CATEGORY_DEFS = [
    { key: 'match_tickets', label: 'Match Tickets', accent: '#ef4444' },
    { key: 'flights', label: 'Flights', accent: '#3b82f6' },
    { key: 'accommodation', label: 'Accommodation', accent: '#f59e0b' },
    { key: 'food_and_drink', label: 'Food & Drink', accent: '#f97316', icon: 'fas fa-utensils' },
    { key: 'local_transport', label: 'Local Transport', accent: '#22c55e', icon: 'fas fa-bus' },
    { key: 'insurance', label: 'Travel Insurance', accent: '#14b8a6', icon: 'fas fa-shield-alt' },
    { key: 'visa', label: 'Visa', accent: '#8b5cf6', icon: 'fas fa-passport' },
    { key: 'merchandise', label: 'Merchandise', accent: '#ec4899', icon: 'fas fa-shopping-bag' },
    { key: 'miscellaneous', label: 'Miscellaneous', accent: '#64748b', icon: 'fas fa-ellipsis-h' },
];

const DONUT_LABELS = {
    match_tickets: 'Tickets', flights: 'Flights', accommodation: 'Accommodation',
    food_and_drink: 'Food & Drink', local_transport: 'Transport', insurance: 'Insurance',
    visa: 'Visa', merchandise: 'Merchandise', miscellaneous: 'Misc',
};

function breakdownDetails(key, ctx) {
    const { pricing, flightOrigin, flightClass, accommodation, nights, travelGroupSize, matchCount,
        selectedFlight, selectedHotel, realHotelPrice } = ctx;
    const originLabel = getFlightOrigins(pricing).find((o) => o.id === flightOrigin)?.label || 'Origin';
    const ticketStages = Object.entries(getTicketPrices(pricing)).map(([s, p]) => `${s}: $${p}`).join(', ');

    switch (key) {
        case 'match_tickets':
            return `Estimated for ${matchCount} match(es). Prices by stage — ${ticketStages}.`;
        case 'flights':
            if (selectedFlight) {
                const seg = selectedFlight.segments?.[0];
                return `Real price from Google Flights: ${seg?.airline || 'Airline'} (${seg?.flight_number || ''}), ${selectedFlight.stops === 0 ? 'Non-stop' : selectedFlight.stops + ' stop(s)'}, ${selectedFlight.total_duration_minutes} min flight time.`;
            }
            return `Round-trip ${flightClass.replace('_', ' ')} class flight from ${originLabel}. Includes event-time demand adjustments.`;
        case 'accommodation':
            if (selectedHotel) {
                return `${selectedHotel.name} (${selectedHotel.rating?.toFixed(1)}★) — $${realHotelPrice}/night × ${nights} nights${travelGroupSize > 1 ? ` shared by ${travelGroupSize} travelers` : ''}.`;
            }
            return `${nights} nights of ${accommodation.replace('_', '-')} accommodation for ${travelGroupSize > 1 ? `${travelGroupSize} travelers (shared)` : '1 traveler'}. Adjusted for city cost tiers and demand surge.`;
        case 'food_and_drink':
            return 'Daily food and drink allowance adjusted for local cost of living and spending tier.';
        case 'local_transport':
            return 'Local transportation (rideshare, metro) estimated per day.';
        case 'insurance':
            return `Travel insurance at $${getInsuranceDaily(pricing)}/day for ${nights} days.`;
        case 'visa':
            return 'Visa costs for host country entry (if applicable).';
        case 'merchandise':
            return `Estimated merchandise and souvenirs at $${getMerchandisePerMatch(pricing)}/match.`;
        case 'miscellaneous':
            return 'Entertainment, souvenirs, and other expenses.';
        default:
            return '';
    }
}

export default function CalculatorResults({
    estimatedCost, currency, rate, breakdown, budgetToEdit,
    selectedMatches, matchCount, nights, accommodation, flightOrigin, flightClass, travelGroupSize,
    selectedFlight, selectedHotel, realFlightPrice, realHotelPrice,
    pricing, tournament, venueImageFor, venueBowls,
    financePartners, savedBudgets,
    saving, onReset, onViewItinerary, onSave,
}) {
    const firstMatch = selectedMatches[0];
    const stadiumBg = (firstMatch && venueImageFor(firstMatch.venue)) || '/assets/img/backdrops/stadium-sideview.jpg';
    const hotelBg = selectedHotel?.images?.[0] || null;
    const flightBg = selectedFlight?.airline_logo || null;

    const art = {
        match_tickets: { bgImage: stadiumBg },
        flights: flightBg ? { bgImage: flightBg } : { bgImage: '/assets/img/backdrops/plane-square.jpg', icon: 'fas fa-plane' },
        accommodation: hotelBg ? { bgImage: hotelBg } : { icon: 'fas fa-hotel' },
    };

    const ctx = {
        pricing, flightOrigin, flightClass, accommodation, nights, travelGroupSize, matchCount,
        selectedFlight, selectedHotel, realHotelPrice,
    };

    const revised = budgetToEdit?.partner_cost > 0 && budgetToEdit.partner_status === 'modified';

    return (
        <div className="section-card result-card">
            <div className="section-header">
                <div className="section-icon">
                    <i className="fas fa-chart-pie"></i>
                </div>
                <div>
                    <h3>Estimated Breakdown</h3>
                    <p className="section-subtitle">Detailed cost analysis</p>
                </div>
            </div>

            <div className="result-total">
                {(selectedFlight || selectedHotel) && (
                    <div className="result-real-prices">
                        {selectedFlight && (
                            <span className="result-real-price">
                                <i className="fas fa-plane me-1"></i>Real flight: ${realFlightPrice}/person
                            </span>
                        )}
                        {selectedHotel && (
                            <span className="result-real-price">
                                <i className="fas fa-hotel me-1"></i>Real hotel: ${realHotelPrice}/night
                            </span>
                        )}
                    </div>
                )}
                {revised ? (
                    <div className="partner-revised-cost mb-3">
                        <div className="tfe-pill tfe-pill--pending mb-2">
                            <i className="fas fa-certificate me-2"></i>PARTNER REVISED PROPOSAL
                        </div>
                        <h2 className="partner-revised-cost__value">
                            {formatMoney(budgetToEdit.partner_cost, budgetToEdit.currency || currency)}
                        </h2>
                        <p className="text-white-50 small">
                            Your Estimate: <span className="text-decoration-line-through">{formatMoney(estimatedCost, currency)}</span>
                        </p>
                    </div>
                ) : (
                    <>
                        <h2>{formatMoney(estimatedCost, currency)}</h2>
                        <p>Estimated total for {matchCount} matches, {nights} days</p>
                    </>
                )}
            </div>

            <div className="result-chart-section">
                <DonutChart
                    data={Object.keys(DONUT_LABELS)
                        .map((k) => ({ label: DONUT_LABELS[k], value: breakdown[k] || 0 }))
                        .filter((d) => d.value > 0)}
                />
            </div>

            <div className="breakdown-grid">
                {CATEGORY_DEFS.map((cat) => {
                    const a = art[cat.key] || { icon: cat.icon };
                    return (
                        <AccentCard
                            key={cat.key}
                            LinkComponent="div"
                            accent={cat.accent}
                            bgImage={a.bgImage || undefined}
                            artwork={a.icon ? { icon: a.icon } : undefined}
                            eyebrow={cat.label}
                            title={formatMoney(breakdown[cat.key] || 0, currency)}
                            desc={breakdownDetails(cat.key, ctx)}
                        />
                    );
                })}
            </div>

            {/* The fan has just seen what Match Tickets costs them; this is
                what they are buying, opened on their own ground first. */}
            {venueBowls.length > 0 && (
                <section className="result-subsection result-subsection--seatmap">
                    <div className="result-subsection__head">
                        <span className="result-subsection__icon"><i className="fas fa-chair" aria-hidden="true"></i></span>
                        <div>
                            <h4 className="result-subsection__title">Where you'll be sitting</h4>
                            <p className="result-subsection__subtitle">Seating tiers at your venues, and how full each one is.</p>
                        </div>
                    </div>
                    <StadiumBowl bowls={venueBowls} height={400} />
                </section>
            )}

            <section className="result-subsection result-subsection--scenarios">
                <div className="result-subsection__head">
                    <span className="result-subsection__icon"><i className="fas fa-chart-column" aria-hidden="true"></i></span>
                    <div>
                        <h4 className="result-subsection__title">Cost scenarios</h4>
                        <p className="result-subsection__subtitle">
                            See how your total shifts if you tweak one variable. Baseline is your current plan.
                        </p>
                    </div>
                </div>
                <CostScenarioChart
                    currentTotal={estimatedCost}
                    matchCount={matchCount || 1}
                    nights={nights}
                    accommodation={accommodation}
                    pricing={pricing}
                    currency={currency}
                />
            </section>

            {/* Loans are stored in USD, so the display total goes back to USD. */}
            {financePartners.length > 0 && estimatedCost > 0 && (
                <section className="result-subsection result-subsection--finance">
                    <div className="result-subsection__head">
                        <span className="result-subsection__icon"><i className="fas fa-hand-holding-usd" aria-hidden="true"></i></span>
                        <div>
                            <h4 className="result-subsection__title">Financing</h4>
                            <p className="result-subsection__subtitle">
                                Route this trip to a verified finance partner instead of paying up-front.
                            </p>
                        </div>
                    </div>
                    <FinanceThisTrip
                        financePartners={financePartners}
                        budgetTotal={estimatedCost / (rate || 1)}
                        budgetCurrency="USD"
                        savedBudgets={savedBudgets}
                        tournament={tournament}
                    />
                </section>
            )}

            <section className="result-subsection result-subsection--map">
                <div className="result-subsection__head">
                    <span className="result-subsection__icon"><i className="fas fa-map-location-dot" aria-hidden="true"></i></span>
                    <div>
                        <h4 className="result-subsection__title">Your route across host cities</h4>
                        <p className="result-subsection__subtitle">
                            Selected venues, distances between them, and everywhere else the tournament plays.
                        </p>
                    </div>
                </div>
                <ItineraryMap venues={(tournament && tournament.venues) || []} selectedMatches={selectedMatches} />
            </section>

            <div className="d-flex flex-wrap gap-3 mt-4">
                <button type="button" className="tfe-btn flex-fill" onClick={onReset}>
                    <i className="fas fa-redo me-2"></i>Start Over
                </button>
                <button type="button" className="tfe-btn flex-fill" onClick={onViewItinerary}>
                    <i className="fas fa-file-alt me-2"></i>View Itinerary
                </button>
                <button type="button" className="tfe-btn tfe-btn--filled flex-fill" onClick={onSave} disabled={saving}>
                    {saving ? (
                        <><i className="fas fa-spinner fa-spin me-2"></i>Saving...</>
                    ) : (
                        <><i className="fas fa-save me-2"></i>Save Itinerary</>
                    )}
                </button>
            </div>
        </div>
    );
}
