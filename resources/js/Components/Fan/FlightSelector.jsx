import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

/**
 * FlightSelector — Search and select real flights via SerpAPI (Google Flights).
 *
 * Props:
 *  - departureId: IATA code for departure airport (e.g., 'NBO')
 *  - arrivalId: IATA code for arrival airport (e.g., 'JFK')
 *  - outboundDate: YYYY-MM-DD
 *  - returnDate: YYYY-MM-DD (optional, for round-trip)
 *  - adults: number of passengers
 *  - onFlightSelected: callback with selected flight data
 *  - selectedFlight: currently selected flight (if any)
 */
export default function FlightSelector({
    departureId,
    arrivalId,
    outboundDate,
    returnDate,
    adults = 1,
    onFlightSelected,
    selectedFlight = null,
}) {
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [priceInsights, setPriceInsights] = useState(null);
    const [sortOrder, setSortOrder] = useState('price');
    const [maxStops, setMaxStops] = useState('any');
    const [source, setSource] = useState(null);
    const [flightClass, setFlightClass] = useState('1');

    const searchFlights = async () => {
        if (!departureId || !arrivalId || !outboundDate) {
            toast.warning('Missing search parameters');
            return;
        }

        setLoading(true);
        setSearched(true);

        try {
            const params = {
                departure_id: departureId,
                arrival_id: arrivalId,
                outbound_date: outboundDate,
                adults,
                travel_class: flightClass,
                sort_by: '2',
            };

            if (returnDate) {
                params.return_date = returnDate;
            }

            if (maxStops !== 'any') {
                params.stops = parseInt(maxStops);
            }

            const res = await axios.post('/api/search/flights', params, { timeout: 20000 });

            if (res.data?.success && res.data.data) {
                setFlights(res.data.data.flights || []);
                setPriceInsights(res.data.data.price_insights || null);
                setSource(res.data.data.source);

                if ((res.data.data.flights || []).length === 0) {
                    toast.info('No flights found for this route/date. Try adjusting your search.');
                }
            } else {
                setFlights([]);
                toast.error(res.data?.data?.error || 'Flight search unavailable');
                setSource(res.data?.data?.source);
            }
        } catch (err) {
            setFlights([]);
            if (err.response?.status === 422) {
                toast.error('Invalid search parameters');
            } else {
                toast.error('Flight search failed. Using estimated prices.');
                setSource('unavailable');
            }
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (minutes) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const parts = timeStr.split(' ');
        return parts.length > 1 ? parts[1] : timeStr;
    };

    const filteredFlights = flights.filter(f => {
        if (maxStops === '0') return f.stops === 0;
        if (maxStops === '1') return f.stops <= 1;
        return true;
    });

    return (
        <div className="flight-selector">
            <div className="selector-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, color: '#f59e0b' }}>
                    <i className="fas fa-plane me-2"></i>Flight Options
                </h4>
                {selectedFlight && (
                    <span style={{ fontSize: '0.8rem', color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '4px 10px', borderRadius: '12px' }}>
                        <i className="fas fa-check me-1"></i>Selected
                    </span>
                )}
            </div>

            {!searched && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <p style={{ color: '#9ca3af', marginBottom: '12px' }}>
                        Search Google Flights for real airline options and prices
                    </p>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <select value={flightClass} onChange={e => setFlightClass(e.target.value)}
                            style={{ background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', padding: '6px 12px' }}>
                            <option value="1">Economy</option>
                            <option value="2">Premium Economy</option>
                            <option value="3">Business</option>
                            <option value="4">First Class</option>
                        </select>
                        <select value={maxStops} onChange={e => setMaxStops(e.target.value)}
                            style={{ background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', padding: '6px 12px' }}>
                            <option value="any">Any Stops</option>
                            <option value="0">Non-stop Only</option>
                            <option value="1">1 Stop or Less</option>
                        </select>
                    </div>
                    <button className="btn-calculate" onClick={searchFlights} disabled={loading}
                        style={{ padding: '10px 24px' }}>
                        {loading ? (
                            <><i className="fas fa-spinner fa-spin me-2"></i>Searching flights...</>
                        ) : (
                            <><i className="fas fa-search me-2"></i>Search Flights ({departureId} → {arrivalId})</>
                        )}
                    </button>
                </div>
            )}

            {searched && (
                <>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <select value={maxStops} onChange={e => { setMaxStops(e.target.value); }}
                            style={{ background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', padding: '6px 12px', fontSize: '0.85rem' }}>
                            <option value="any">Any Stops</option>
                            <option value="0">Non-stop</option>
                            <option value="1">≤1 Stop</option>
                        </select>
                        <button onClick={searchFlights} disabled={loading}
                            style={{ background: 'transparent', color: '#9ca3af', border: '1px solid #374151', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem' }}>
                            <i className="fas fa-sync-alt me-1"></i>Refresh
                        </button>
                        {source === 'unavailable' && (
                            <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>
                                <i className="fas fa-info-circle me-1"></i>Using estimated prices — add SERPAPI_KEY for live data
                            </span>
                        )}
                    </div>

                    {priceInsights && (
                        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px', fontSize: '0.8rem' }}>
                            <span style={{ color: '#10b981' }}>
                                <i className="fas fa-chart-line me-1"></i>
                                Price level: <strong>{priceInsights.price_level}</strong>
                                {' · '}Lowest: <strong>${priceInsights.lowest_price}</strong>
                                {priceInsights.typical_price_range?.length > 0 && (
                                    <> · Typical: ${priceInsights.typical_price_range[0]}</>
                                )}
                            </span>
                        </div>
                    )}

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '30px' }}>
                            <i className="fas fa-spinner fa-spin fa-2x text-warning"></i>
                            <p style={{ color: '#9ca3af', marginTop: '10px' }}>Fetching live flight prices...</p>
                        </div>
                    ) : filteredFlights.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                            <i className="fas fa-plane-slash fa-2x mb-2"></i>
                            <p>No flights found. Try different dates or routes.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                            {filteredFlights.slice(0, 8).map((flight) => (
                                <div
                                    key={flight.id}
                                    onClick={() => onFlightSelected?.(flight)}
                                    style={{
                                        background: selectedFlight?.id === flight.id ? 'rgba(16,185,129,0.15)' : '#1a1f2e',
                                        border: selectedFlight?.id === flight.id ? '2px solid #10b981' : '1px solid #2d3748',
                                        borderRadius: '10px',
                                        padding: '12px 16px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                {flight.airline_logo && (
                                                    <img src={flight.airline_logo} alt="" style={{ width: '20px', height: '20px' }} />
                                                )}
                                                <span style={{ color: '#e5e7eb', fontWeight: '600', fontSize: '0.9rem' }}>
                                                    {flight.segments?.[0]?.airline || 'Unknown'}
                                                </span>
                                                <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                                                    {flight.segments?.[0]?.flight_number}
                                                </span>
                                                {flight.is_best && (
                                                    <span style={{ fontSize: '0.65rem', background: 'rgba(245,158,11,0.2)', color: '#f59e0b', padding: '2px 6px', borderRadius: '4px' }}>
                                                        Best
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem' }}>
                                                <span style={{ color: '#e5e7eb', fontWeight: '600' }}>
                                                    {formatTime(flight.segments?.[0]?.departure_time)}
                                                </span>
                                                <span style={{ color: '#6b7280' }}>{flight.segments?.[0]?.departure_airport}</span>
                                                <span style={{ color: '#4b5563' }}>
                                                    {flight.stops === 0 ? (
                                                        <i className="fas fa-plane" style={{ fontSize: '0.7rem' }}></i>
                                                    ) : (
                                                        `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`
                                                    )}
                                                </span>
                                                <span style={{ color: '#e5e7eb', fontWeight: '600' }}>
                                                    {formatTime(flight.segments?.[flight.segments.length - 1]?.arrival_time)}
                                                </span>
                                                <span style={{ color: '#6b7280' }}>
                                                    {flight.segments?.[flight.segments.length - 1]?.arrival_airport}
                                                </span>
                                                <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                                                    {formatDuration(flight.total_duration_minutes)}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', marginLeft: '16px' }}>
                                            <div style={{ color: '#10b981', fontWeight: '700', fontSize: '1.1rem' }}>
                                                ${flight.price_usd}
                                            </div>
                                            <div style={{ color: '#6b7280', fontSize: '0.7rem' }}>per person</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
