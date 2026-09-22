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
        <div className="travel-picker">
            <div className="travel-picker__header">
                <h4 className="travel-picker__title">
                    <i className="fas fa-plane"></i> Flight Options
                </h4>
                {selectedFlight && (
                    <span className="tfe-pill tfe-pill--approved">
                        <i className="fas fa-check"></i> Selected
                    </span>
                )}
            </div>

            {!searched && (
                <div className="travel-picker__intro">
                    <p className="travel-picker__lede">
                        Search Google Flights for real airline options and prices.
                    </p>
                    <div className="travel-picker__controls">
                        <select className="tfe-select tfe-select--sm" value={flightClass} onChange={e => setFlightClass(e.target.value)}>
                            <option value="1">Economy</option>
                            <option value="2">Premium Economy</option>
                            <option value="3">Business</option>
                            <option value="4">First Class</option>
                        </select>
                        <select className="tfe-select tfe-select--sm" value={maxStops} onChange={e => setMaxStops(e.target.value)}>
                            <option value="any">Any Stops</option>
                            <option value="0">Non-stop Only</option>
                            <option value="1">1 Stop or Less</option>
                        </select>
                    </div>
                    <button className="tfe-btn tfe-btn--filled" onClick={searchFlights} disabled={loading}>
                        {loading ? (
                            <><i className="fas fa-spinner fa-spin"></i> Searching flights…</>
                        ) : (
                            <><i className="fas fa-search"></i> Search Flights ({departureId} → {arrivalId})</>
                        )}
                    </button>
                </div>
            )}

            {searched && (
                <>
                    <div className="travel-picker__controls travel-picker__controls--filter">
                        <select className="tfe-select tfe-select--sm" value={maxStops} onChange={e => setMaxStops(e.target.value)}>
                            <option value="any">Any Stops</option>
                            <option value="0">Non-stop</option>
                            <option value="1">≤1 Stop</option>
                        </select>
                        <button type="button" className="tfe-btn tfe-btn--sm" onClick={searchFlights} disabled={loading}>
                            <i className="fas fa-sync-alt"></i> Refresh
                        </button>
                        {source === 'unavailable' && (
                            <span className="travel-picker__hint">
                                <i className="fas fa-info-circle"></i> Using estimated prices — add SERPAPI_KEY for live data
                            </span>
                        )}
                    </div>

                    {priceInsights && (
                        <div className="travel-picker__insights">
                            <i className="fas fa-chart-line"></i>
                            Price level: <strong>{priceInsights.price_level}</strong>
                            {' · '}Lowest: <strong>${priceInsights.lowest_price}</strong>
                            {priceInsights.typical_price_range?.length > 0 && (
                                <> · Typical: ${priceInsights.typical_price_range[0]}</>
                            )}
                        </div>
                    )}

                    {loading ? (
                        <div className="travel-picker__state">
                            <i className="fas fa-spinner fa-spin fa-2x"></i>
                            <p>Fetching live flight prices…</p>
                        </div>
                    ) : filteredFlights.length === 0 ? (
                        <div className="travel-picker__state">
                            <i className="fas fa-plane-slash fa-2x"></i>
                            <p>No flights found. Try different dates or routes.</p>
                        </div>
                    ) : (
                        <div className="travel-picker__list">
                            {filteredFlights.slice(0, 8).map((flight) => {
                                const active = selectedFlight?.id === flight.id;
                                return (
                                    <button
                                        key={flight.id}
                                        type="button"
                                        onClick={() => onFlightSelected?.(flight)}
                                        className={`travel-option ${active ? 'is-selected' : ''}`}
                                    >
                                        <div className="travel-option__body">
                                            <div className="travel-option__row">
                                                {flight.airline_logo && (
                                                    <img src={flight.airline_logo} alt="" className="travel-option__logo" />
                                                )}
                                                <span className="travel-option__title">
                                                    {flight.segments?.[0]?.airline || 'Unknown'}
                                                </span>
                                                <span className="travel-option__meta">
                                                    {flight.segments?.[0]?.flight_number}
                                                </span>
                                                {flight.is_best && (
                                                    <span className="tfe-pill tfe-pill--pending travel-option__flag">Best</span>
                                                )}
                                            </div>
                                            <div className="travel-option__row travel-option__row--details">
                                                <span className="travel-option__strong">
                                                    {formatTime(flight.segments?.[0]?.departure_time)}
                                                </span>
                                                <span className="travel-option__meta">{flight.segments?.[0]?.departure_airport}</span>
                                                <span className="travel-option__meta">
                                                    {flight.stops === 0 ? (
                                                        <><i className="fas fa-plane"></i> Non-stop</>
                                                    ) : (
                                                        `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`
                                                    )}
                                                </span>
                                                <span className="travel-option__strong">
                                                    {formatTime(flight.segments?.[flight.segments.length - 1]?.arrival_time)}
                                                </span>
                                                <span className="travel-option__meta">
                                                    {flight.segments?.[flight.segments.length - 1]?.arrival_airport}
                                                </span>
                                                <span className="travel-option__meta">
                                                    {formatDuration(flight.total_duration_minutes)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="travel-option__price">
                                            <div className="travel-option__price-value">${flight.price_usd}</div>
                                            <div className="travel-option__price-label">per person</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
