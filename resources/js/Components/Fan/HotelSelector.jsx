import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

/**
 * HotelSelector — Search and select real hotels via SerpAPI (Google Hotels).
 *
 * Props:
 *  - city: destination city name (e.g., 'Nairobi')
 *  - checkIn: YYYY-MM-DD
 *  - checkOut: YYYY-MM-DD
 *  - adults: number of guests
 *  - onHotelSelected: callback with selected hotel data
 *  - selectedHotel: currently selected hotel (if any)
 */
export default function HotelSelector({
    city,
    checkIn,
    checkOut,
    adults = 2,
    onHotelSelected,
    selectedHotel = null,
}) {
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [sortBy, setSortBy] = useState('3');
    const [hotelClass, setHotelClass] = useState('');
    const [totalResults, setTotalResults] = useState(0);
    const [source, setSource] = useState(null);

    const searchHotels = async () => {
        if (!city || !checkIn || !checkOut) {
            toast.warning('Missing search parameters');
            return;
        }

        setLoading(true);
        setSearched(true);

        try {
            const params = {
                q: `${city} hotels`,
                check_in_date: checkIn,
                check_out_date: checkOut,
                adults,
                sort_by: sortBy,
            };

            if (hotelClass) {
                params.hotel_class = hotelClass;
            }

            const res = await axios.post('/api/search/hotels', params, { timeout: 20000 });

            if (res.data?.success && res.data.data) {
                setHotels(res.data.data.hotels || []);
                setTotalResults(res.data.data.total_results || 0);
                setSource(res.data.data.source);

                if ((res.data.data.hotels || []).length === 0) {
                    toast.info('No hotels found. Try different dates or filters.');
                }
            } else {
                setHotels([]);
                toast.error(res.data?.data?.error || 'Hotel search unavailable');
                setSource(res.data?.data?.source);
            }
        } catch (err) {
            setHotels([]);
            if (err.response?.status === 422) {
                toast.error('Invalid search parameters');
            } else {
                toast.error('Hotel search failed. Using estimated prices.');
                setSource('unavailable');
            }
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating) => {
        const stars = Math.round((rating || 0) / 2);
        return (
            <span className="travel-option__stars" aria-label={`${stars} out of 5 stars`}>
                {Array.from({ length: 5 }, (_, i) => (
                    <i key={i} className="fas fa-star" data-on={i < stars ? 'true' : 'false'}></i>
                ))}
            </span>
        );
    };

    return (
        <div className="travel-picker">
            <div className="travel-picker__header">
                <h4 className="travel-picker__title">
                    <i className="fas fa-hotel"></i> Hotel Options
                </h4>
                {selectedHotel && (
                    <span className="tfe-pill tfe-pill--approved">
                        <i className="fas fa-check"></i> Selected
                    </span>
                )}
            </div>

            {!searched && (
                <div className="travel-picker__intro">
                    <p className="travel-picker__lede">
                        Search Google Hotels for real accommodation options and prices.
                    </p>
                    <div className="travel-picker__controls">
                        <select className="tfe-select tfe-select--sm" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                            <option value="3">Lowest Price</option>
                            <option value="8">Highest Rating</option>
                            <option value="13">Most Reviewed</option>
                        </select>
                        <select className="tfe-select tfe-select--sm" value={hotelClass} onChange={e => setHotelClass(e.target.value)}>
                            <option value="">Any Class</option>
                            <option value="2">2-Star</option>
                            <option value="3">3-Star</option>
                            <option value="4">4-Star</option>
                            <option value="5">5-Star</option>
                        </select>
                    </div>
                    <button className="tfe-btn tfe-btn--filled" onClick={searchHotels} disabled={loading}>
                        {loading ? (
                            <><i className="fas fa-spinner fa-spin"></i> Searching hotels…</>
                        ) : (
                            <><i className="fas fa-search"></i> Search Hotels in {city}</>
                        )}
                    </button>
                </div>
            )}

            {searched && (
                <>
                    <div className="travel-picker__controls travel-picker__controls--filter">
                        <select className="tfe-select tfe-select--sm" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                            <option value="3">Lowest Price</option>
                            <option value="8">Highest Rating</option>
                            <option value="13">Most Reviewed</option>
                        </select>
                        <select className="tfe-select tfe-select--sm" value={hotelClass} onChange={e => setHotelClass(e.target.value)}>
                            <option value="">Any Class</option>
                            <option value="2">2-Star</option>
                            <option value="3">3-Star</option>
                            <option value="4">4-Star</option>
                            <option value="5">5-Star</option>
                        </select>
                        <button type="button" className="tfe-btn tfe-btn--sm" onClick={searchHotels} disabled={loading}>
                            <i className="fas fa-sync-alt"></i> Refresh
                        </button>
                        {totalResults > 0 && (
                            <span className="travel-picker__hint travel-picker__hint--muted">
                                {totalResults.toLocaleString()} properties found
                            </span>
                        )}
                        {source === 'unavailable' && (
                            <span className="travel-picker__hint">
                                <i className="fas fa-info-circle"></i> Using estimated prices — add SERPAPI_KEY for live data
                            </span>
                        )}
                    </div>

                    {loading ? (
                        <div className="travel-picker__state">
                            <i className="fas fa-spinner fa-spin fa-2x"></i>
                            <p>Fetching live hotel prices…</p>
                        </div>
                    ) : hotels.length === 0 ? (
                        <div className="travel-picker__state">
                            <i className="fas fa-bed fa-2x"></i>
                            <p>No hotels found. Try different dates or filters.</p>
                        </div>
                    ) : (
                        <div className="travel-picker__list">
                            {hotels.slice(0, 10).map((hotel) => {
                                const active = selectedHotel?.id === hotel.id;
                                return (
                                    <button
                                        key={hotel.id}
                                        type="button"
                                        onClick={() => onHotelSelected?.(hotel)}
                                        className={`travel-option ${active ? 'is-selected' : ''}`}
                                    >
                                        {hotel.images?.[0] && (
                                            <img
                                                src={hotel.images[0]}
                                                alt={hotel.name}
                                                className="travel-option__thumb"
                                                onError={e => (e.target.style.display = 'none')}
                                            />
                                        )}
                                        <div className="travel-option__body">
                                            <div className="travel-option__title">{hotel.name}</div>
                                            <div className="travel-option__row travel-option__row--rating">
                                                {renderStars(hotel.rating)}
                                                <span className="travel-option__meta">{hotel.rating?.toFixed(1)}</span>
                                                <span className="travel-option__meta">
                                                    ({hotel.reviews?.toLocaleString()} reviews)
                                                </span>
                                            </div>
                                            {hotel.amenities?.length > 0 && (
                                                <div className="travel-option__amenities">
                                                    {hotel.amenities.slice(0, 4).map((amenity, i) => (
                                                        <span key={i} className="travel-option__amenity">{amenity}</span>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="travel-option__row travel-option__row--footer">
                                                {hotel.free_cancellation && (
                                                    <span className="travel-option__meta travel-option__meta--positive">
                                                        <i className="fas fa-check-circle"></i> Free cancellation
                                                    </span>
                                                )}
                                                {hotel.check_in_time && (
                                                    <span className="travel-option__meta">Check-in: {hotel.check_in_time}</span>
                                                )}
                                                {hotel.nearby_places?.[0] && (
                                                    <span className="travel-option__meta">
                                                        <i className="fas fa-map-marker-alt"></i>
                                                        {' '}{hotel.nearby_places[0].transport} to {hotel.nearby_places[0].name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="travel-option__price">
                                            <div className="travel-option__price-value">${hotel.price_per_night_usd}</div>
                                            <div className="travel-option__price-label">per night</div>
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
