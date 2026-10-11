import React from 'react';
import { formatMoney, formatNumber } from '@/lib/utils';
import '../../../css/fan/itinerary-summary.css';

/**
 * ItinerarySummary — the printable trip plan (e.g. to take to a bank).
 *
 * Sprint 69: every amount is shown in the plan's OWN currency. This used to
 * assume the breakdown was in KES and divide by an exchange rate for a USD
 * column, but since Sprint 28 the calculator stores the breakdown in the
 * fan's chosen currency (USD by default) — so a $1,600 trip printed as
 * "KES 1,600 ($12)". One currency, no second guessed rate. Styles moved
 * from ~60 inline objects into itinerary-summary.css.
 */
const ROWS = [
    { key: 'match_tickets', label: 'Match Tickets' },
    { key: 'flights', label: 'Flights' },
    { key: 'accommodation', label: 'Accommodation' },
    { key: 'food_and_drink', label: 'Food & Drink' },
    { key: 'local_transport', label: 'Local Transport' },
    { key: 'insurance', label: 'Travel Insurance' },
    { key: 'visa', label: 'Visa Fees' },
    { key: 'merchandise', label: 'Merchandise' },
    { key: 'miscellaneous', label: 'Miscellaneous' },
];

const longDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(`${dateStr}T00:00:00`);
    return Number.isNaN(d.getTime())
        ? dateStr
        : d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};

const duration = (minutes) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

function Section({ icon, title, children }) {
    return (
        <section className="itin-doc__section">
            <h2 className="itin-doc__h2"><i className={`fas ${icon}`} aria-hidden="true"></i>{title}</h2>
            {children}
        </section>
    );
}

export default function ItinerarySummary({
    tournament,
    selectedMatches = [],
    selectedFlight = null,
    selectedHotel = null,
    breakdown = {},
    estimatedCost = 0,
    currency = 'USD',
    nights = 7,
    travelGroupSize = 1,
    spendingTier = 'mid_range',
}) {
    const money = (v) => formatMoney(v, currency);
    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const byDate = {};
    selectedMatches.forEach((m) => {
        const key = m.date || 'Unknown';
        (byDate[key] = byDate[key] || []).push(m);
    });

    return (
        <div className="itin-doc">
            <header className="itin-doc__head">
                <div className="itin-doc__kicker">Travel Itinerary &amp; Budget</div>
                <h1 className="itin-doc__title">{tournament?.short_name || 'Tournament'} Trip Plan</h1>
                <div className="itin-doc__muted">Prepared {today}</div>
            </header>

            <Section icon="fa-info-circle" title="Trip Overview">
                <div className="itin-doc__facts">
                    <div><strong>Tournament:</strong> {tournament?.name || 'N/A'}</div>
                    <div><strong>Duration:</strong> {nights} days</div>
                    <div><strong>Travelers:</strong> {travelGroupSize} {travelGroupSize === 1 ? 'person' : 'people'}</div>
                    <div><strong>Spending Level:</strong> {spendingTier.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</div>
                    <div><strong>Matches:</strong> {selectedMatches.length}</div>
                    <div><strong>Currency:</strong> {currency}</div>
                </div>
            </Section>

            {selectedMatches.length > 0 && (
                <Section icon="fa-futbol" title={`Selected Matches (${selectedMatches.length})`}>
                    {Object.entries(byDate).map(([date, matches]) => (
                        <div key={date} className="itin-doc__day">
                            <div className="itin-doc__day-label">{longDate(date)}</div>
                            {matches.map((m) => (
                                <div key={m.id ?? `${m.homeTeam}-${m.awayTeam}`} className="itin-doc__row">
                                    <span>
                                        <strong>{m.homeTeam}</strong> vs <strong>{m.awayTeam}</strong>
                                        <span className="itin-doc__faint"> {m.stage}{m.time ? ` · ${m.time}` : ''}</span>
                                    </span>
                                    <span className="itin-doc__faint">{m.venue}</span>
                                </div>
                            ))}
                        </div>
                    ))}
                </Section>
            )}

            {selectedFlight && (
                <Section icon="fa-plane" title="Flight Details">
                    <div className="itin-doc__box">
                        {selectedFlight.segments?.map((seg, i) => (
                            <div key={i} className="itin-doc__seg">
                                <div>
                                    <div className="itin-doc__strong">{seg.airline} {seg.flight_number}</div>
                                    <div className="itin-doc__muted">
                                        {seg.departure_time?.split(' ')[1] || seg.departure_time} → {seg.arrival_time?.split(' ')[1] || seg.arrival_time}
                                        {' · '}{seg.departure_airport} → {seg.arrival_airport}
                                        {seg.airplane ? ` · ${seg.airplane}` : ''}
                                    </div>
                                </div>
                                <div className="itin-doc__muted">{duration(seg.duration)}</div>
                            </div>
                        ))}
                        {selectedFlight.layovers?.length > 0 && (
                            <div className="itin-doc__note">
                                Layovers: {selectedFlight.layovers.map((l) => `${l.name} (${duration(l.duration)})`).join(', ')}
                            </div>
                        )}
                        {/* Live search prices are quoted in USD by the provider. */}
                        <div className="itin-doc__price">
                            {formatMoney(selectedFlight.price_usd)} per person × {travelGroupSize} = {formatMoney(selectedFlight.price_usd * travelGroupSize)}
                        </div>
                    </div>
                </Section>
            )}

            {selectedHotel && (
                <Section icon="fa-hotel" title="Accommodation Details">
                    <div className="itin-doc__box">
                        <div className="itin-doc__strong">{selectedHotel.name}</div>
                        <div className="itin-doc__muted">
                            Rating: {selectedHotel.rating?.toFixed(1)} ★ · {formatNumber(selectedHotel.reviews)} reviews
                            {selectedHotel.check_in_time && ` · Check-in: ${selectedHotel.check_in_time}`}
                        </div>
                        {selectedHotel.amenities?.length > 0 && (
                            <div className="itin-doc__note">Amenities: {selectedHotel.amenities.slice(0, 6).join(', ')}</div>
                        )}
                        <div className="itin-doc__price">
                            {formatMoney(selectedHotel.price_per_night_usd)}/night × {nights} nights = {formatMoney(selectedHotel.price_per_night_usd * nights)}
                        </div>
                    </div>
                </Section>
            )}

            <Section icon="fa-receipt" title="Cost Breakdown">
                <table className="itin-doc__table">
                    <thead>
                        <tr><th>Category</th><th>{currency}</th></tr>
                    </thead>
                    <tbody>
                        {ROWS.map(({ key, label }) => (
                            <tr key={key} className={breakdown[key] > 0 ? 'is-set' : ''}>
                                <td>{label}</td>
                                <td>{money(breakdown[key] || 0)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr><td>TOTAL</td><td>{money(estimatedCost)}</td></tr>
                    </tfoot>
                </table>
            </Section>

            {travelGroupSize > 1 && (
                <div className="itin-doc__per-person">
                    <div><strong>Per Person Cost:</strong> {money(estimatedCost / travelGroupSize)}</div>
                    <div className="itin-doc__per-person-sub">Based on {travelGroupSize} travelers sharing accommodation</div>
                </div>
            )}

            <Section icon="fa-sticky-note" title="Notes">
                <ul className="itin-doc__notes">
                    <li>All prices are estimates based on current market rates and may vary at time of booking.</li>
                    <li>Flight prices are round-trip per person. Hotel prices are per room per night.</li>
                    <li>Visa costs depend on nationality and host country requirements.</li>
                    <li>This itinerary is prepared for budget planning and financing application purposes.</li>
                </ul>
            </Section>

            <footer className="itin-doc__foot">
                <div>The Football Experience — Smart Budget Calculator</div>
                <div>Generated on {today} · This document is for informational purposes only</div>
            </footer>
        </div>
    );
}
