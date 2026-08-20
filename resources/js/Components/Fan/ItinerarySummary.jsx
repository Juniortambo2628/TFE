import React from 'react';

/**
 * ItinerarySummary — A professional, printable itinerary document
 * for use when seeking financing from a banking partner.
 *
 * Props:
 *  - tournament: tournament config object
 *  - selectedMatches: array of match objects
 *  - selectedFlight: flight selection from SerpAPI
 *  - selectedHotel: hotel selection from SerpAPI
 *  - breakdown: cost breakdown object (KES)
 *  - estimatedCost: total KES cost
 *  - nights: trip duration
 *  - travelGroupSize: number of travelers
 *  - spendingTier: budget/mid_range/luxury
 *  - flightOrigin: selected origin
 *  - tournamentPricing: pricing config
 */
export default function ItinerarySummary({
    tournament,
    selectedMatches = [],
    selectedFlight = null,
    selectedHotel = null,
    breakdown = {},
    estimatedCost = 0,
    nights = 7,
    travelGroupSize = 1,
    spendingTier = 'mid_range',
    flightOrigin = '',
    tournamentPricing = {},
}) {
    const USD_TO_KES = tournamentPricing?.exchange_rate || 130;
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    };

    const formatDuration = (minutes) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    };

    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const groupedMatches = {};
    selectedMatches.forEach(m => {
        const key = m.date || 'Unknown';
        if (!groupedMatches[key]) groupedMatches[key] = [];
        groupedMatches[key].push(m);
    });

    const usdEquivalent = Math.round(estimatedCost / USD_TO_KES);

    return (
        <div className="itinerary-summary" style={{ fontFamily: "'Georgia', serif", color: '#1a1a1a', maxWidth: '800px', margin: '0 auto', background: '#fff', padding: '40px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', borderBottom: '3px double #1a1a1a', paddingBottom: '20px', marginBottom: '30px' }}>
                <div style={{ fontSize: '0.8rem', letterSpacing: '3px', textTransform: 'uppercase', color: '#666', marginBottom: '8px' }}>
                    Travel Itinerary & Budget
                </div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '700', margin: '0 0 4px' }}>
                    {tournament?.short_name || 'Tournament'} Trip Plan
                </h1>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                    Prepared for Financing Application — {today}
                </div>
            </div>

            {/* Trip Overview */}
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.1rem', borderBottom: '1px solid #ddd', paddingBottom: '6px', marginBottom: '12px' }}>
                    <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>Trip Overview
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9rem' }}>
                    <div><strong>Tournament:</strong> {tournament?.name || 'N/A'}</div>
                    <div><strong>Duration:</strong> {nights} days</div>
                    <div><strong>Travelers:</strong> {travelGroupSize} {travelGroupSize === 1 ? 'person' : 'people'}</div>
                    <div><strong>Spending Level:</strong> {spendingTier.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                    <div><strong>Matches:</strong> {selectedMatches.length}</div>
                    <div><strong>Budget Date:</strong> {today}</div>
                </div>
            </div>

            {/* Selected Matches */}
            {selectedMatches.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '1.1rem', borderBottom: '1px solid #ddd', paddingBottom: '6px', marginBottom: '12px' }}>
                        <i className="fas fa-futbol" style={{ marginRight: '8px' }}></i>Selected Matches ({selectedMatches.length})
                    </h2>
                    {Object.entries(groupedMatches).map(([date, matches]) => (
                        <div key={date} style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#555', marginBottom: '6px' }}>
                                {formatDate(date)}
                            </div>
                            {matches.map((m, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dotted #eee', fontSize: '0.85rem' }}>
                                    <span>
                                        <strong>{m.homeTeam}</strong> vs <strong>{m.awayTeam}</strong>
                                        <span style={{ color: '#888', marginLeft: '8px' }}>
                                            {m.stage} {m.time ? `· ${m.time}` : ''}
                                        </span>
                                    </span>
                                    <span style={{ color: '#888' }}>{m.venue}</span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {/* Flight Details */}
            {selectedFlight && (
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '1.1rem', borderBottom: '1px solid #ddd', paddingBottom: '6px', marginBottom: '12px' }}>
                        <i className="fas fa-plane" style={{ marginRight: '8px' }}></i>Flight Details
                    </h2>
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', background: '#fafafa' }}>
                        {selectedFlight.segments?.map((seg, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: i < selectedFlight.segments.length - 1 ? '12px' : 0 }}>
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{seg.airline} {seg.flight_number}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                        {seg.departure_time?.split(' ')[1] || seg.departure_time} → {seg.arrival_time?.split(' ')[1] || seg.arrival_time}
                                        {' · '}{seg.departure_airport} → {seg.arrival_airport}
                                        {' · '}{seg.airplane}
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                    {formatDuration(seg.duration)}
                                </div>
                            </div>
                        ))}
                        {selectedFlight.layovers?.length > 0 && (
                            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '8px', borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
                                Layovers: {selectedFlight.layovers.map(l => `${l.name} (${formatDuration(l.duration)})`).join(', ')}
                            </div>
                        )}
                        <div style={{ textAlign: 'right', marginTop: '8px', fontWeight: '700', fontSize: '1rem', color: '#059669' }}>
                            ${selectedFlight.price_usd} per person × {travelGroupSize} = ${selectedFlight.price_usd * travelGroupSize}
                        </div>
                    </div>
                </div>
            )}

            {/* Hotel Details */}
            {selectedHotel && (
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '1.1rem', borderBottom: '1px solid #ddd', paddingBottom: '6px', marginBottom: '12px' }}>
                        <i className="fas fa-hotel" style={{ marginRight: '8px' }}></i>Accommodation Details
                    </h2>
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', background: '#fafafa' }}>
                        <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{selectedHotel.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                            Rating: {selectedHotel.rating?.toFixed(1)} ★ · {selectedHotel.reviews?.toLocaleString()} reviews
                            {selectedHotel.check_in_time && ` · Check-in: ${selectedHotel.check_in_time}`}
                        </div>
                        {selectedHotel.amenities?.length > 0 && (
                            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>
                                Amenities: {selectedHotel.amenities.slice(0, 6).join(', ')}
                            </div>
                        )}
                        <div style={{ textAlign: 'right', marginTop: '8px', fontWeight: '700', fontSize: '1rem', color: '#059669' }}>
                            ${selectedHotel.price_per_night_usd}/night × {nights} nights = ${selectedHotel.price_per_night_usd * nights}
                        </div>
                    </div>
                </div>
            )}

            {/* Cost Breakdown */}
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.1rem', borderBottom: '1px solid #ddd', paddingBottom: '6px', marginBottom: '12px' }}>
                    <i className="fas fa-receipt" style={{ marginRight: '8px' }}></i>Cost Breakdown
                </h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #ddd' }}>
                            <th style={{ textAlign: 'left', padding: '8px 0' }}>Category</th>
                            <th style={{ textAlign: 'right', padding: '8px 0' }}>USD</th>
                            <th style={{ textAlign: 'right', padding: '8px 0' }}>KES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            { key: 'match_tickets', label: 'Match Tickets' },
                            { key: 'flights', label: 'Flights' },
                            { key: 'accommodation', label: 'Accommodation' },
                            { key: 'food_and_drink', label: 'Food & Drink' },
                            { key: 'local_transport', label: 'Local Transport' },
                            { key: 'insurance', label: 'Travel Insurance' },
                            { key: 'visa', label: 'Visa Fees' },
                            { key: 'merchandise', label: 'Merchandise' },
                            { key: 'miscellaneous', label: 'Miscellaneous' },
                        ].map(({ key, label }) => {
                            const kesVal = breakdown[key] || 0;
                            const usdVal = Math.round(kesVal / USD_TO_KES);
                            return (
                                <tr key={key} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '8px 0' }}>{label}</td>
                                    <td style={{ textAlign: 'right', padding: '8px 0' }}>${usdVal.toLocaleString()}</td>
                                    <td style={{ textAlign: 'right', padding: '8px 0', fontWeight: kesVal > 0 ? '600' : '400' }}>
                                        KES {kesVal.toLocaleString()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr style={{ borderTop: '2px solid #1a1a1a', fontWeight: '700' }}>
                            <td style={{ padding: '12px 0', fontSize: '1rem' }}>TOTAL</td>
                            <td style={{ textAlign: 'right', padding: '12px 0', fontSize: '1rem' }}>${usdEquivalent.toLocaleString()}</td>
                            <td style={{ textAlign: 'right', padding: '12px 0', fontSize: '1rem' }}>KES {estimatedCost.toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Per Person Breakdown */}
            {travelGroupSize > 1 && (
                <div style={{ marginBottom: '24px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.85rem', color: '#166534' }}>
                        <strong>Per Person Cost:</strong> KES {Math.round(estimatedCost / travelGroupSize).toLocaleString()} (${Math.round(usdEquivalent / travelGroupSize).toLocaleString()})
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '4px' }}>
                        Based on {travelGroupSize} travelers sharing accommodation
                    </div>
                </div>
            )}

            {/* Notes */}
            <div style={{ marginTop: '30px', borderTop: '1px solid #ddd', paddingTop: '16px' }}>
                <h2 style={{ fontSize: '1.1rem', borderBottom: '1px solid #ddd', paddingBottom: '6px', marginBottom: '12px' }}>
                    <i className="fas fa-sticky-note" style={{ marginRight: '8px' }}></i>Notes
                </h2>
                <ul style={{ fontSize: '0.8rem', color: '#666', paddingLeft: '20px', lineHeight: '1.6' }}>
                    <li>All prices are estimates based on current market rates and may vary at time of booking.</li>
                    <li>Flight prices are round-trip per person. Hotel prices are per room per night.</li>
                    <li>Visa costs depend on nationality and host country requirements.</li>
                    <li>This itinerary is prepared for budget planning and financing application purposes.</li>
                    <li>Exchange rate used: 1 USD = KES {USD_TO_KES}</li>
                </ul>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '16px', borderTop: '2px solid #ddd', fontSize: '0.7rem', color: '#999' }}>
                <div>The Football Experience — Smart Budget Calculator</div>
                <div>Generated on {today} · This document is for informational purposes only</div>
            </div>
        </div>
    );
}
