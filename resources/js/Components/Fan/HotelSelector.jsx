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
        const stars = Math.round(rating / 2);
        return Array.from({ length: 5 }, (_, i) => (
            <i key={i} className={`fas fa-star`} style={{ color: i < stars ? '#f59e0b' : '#374151', fontSize: '0.7rem' }}></i>
        ));
    };

    return (
        <div className="hotel-selector">
            <div className="selector-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, color: '#f59e0b' }}>
                    <i className="fas fa-hotel me-2"></i>Hotel Options
                </h4>
                {selectedHotel && (
                    <span style={{ fontSize: '0.8rem', color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '4px 10px', borderRadius: '12px' }}>
                        <i className="fas fa-check me-1"></i>Selected
                    </span>
                )}
            </div>

            {!searched && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <p style={{ color: '#9ca3af', marginBottom: '12px' }}>
                        Search Google Hotels for real accommodation options and prices
                    </p>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                            style={{ background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', padding: '6px 12px' }}>
                            <option value="3">Lowest Price</option>
                            <option value="8">Highest Rating</option>
                            <option value="13">Most Reviewed</option>
                        </select>
                        <select value={hotelClass} onChange={e => setHotelClass(e.target.value)}
                            style={{ background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', padding: '6px 12px' }}>
                            <option value="">Any Class</option>
                            <option value="2">2-Star</option>
                            <option value="3">3-Star</option>
                            <option value="4">4-Star</option>
                            <option value="5">5-Star</option>
                        </select>
                    </div>
                    <button className="btn-calculate" onClick={searchHotels} disabled={loading}
                        style={{ padding: '10px 24px' }}>
                        {loading ? (
                            <><i className="fas fa-spinner fa-spin me-2"></i>Searching hotels...</>
                        ) : (
                            <><i className="fas fa-search me-2"></i>Search Hotels in {city}</>
                        )}
                    </button>
                </div>
            )}

            {searched && (
                <>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                            style={{ background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', padding: '6px 12px', fontSize: '0.85rem' }}>
                            <option value="3">Lowest Price</option>
                            <option value="8">Highest Rating</option>
                            <option value="13">Most Reviewed</option>
                        </select>
                        <select value={hotelClass} onChange={e => setHotelClass(e.target.value)}
                            style={{ background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', padding: '6px 12px', fontSize: '0.85rem' }}>
                            <option value="">Any Class</option>
                            <option value="2">2-Star</option>
                            <option value="3">3-Star</option>
                            <option value="4">4-Star</option>
                            <option value="5">5-Star</option>
                        </select>
                        <button onClick={searchHotels} disabled={loading}
                            style={{ background: 'transparent', color: '#9ca3af', border: '1px solid #374151', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem' }}>
                            <i className="fas fa-sync-alt me-1"></i>Refresh
                        </button>
                        {totalResults > 0 && (
                            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                {totalResults.toLocaleString()} properties found
                            </span>
                        )}
                        {source === 'unavailable' && (
                            <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>
                                <i className="fas fa-info-circle me-1"></i>Using estimated prices — add SERPAPI_KEY for live data
                            </span>
                        )}
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '30px' }}>
                            <i className="fas fa-spinner fa-spin fa-2x text-warning"></i>
                            <p style={{ color: '#9ca3af', marginTop: '10px' }}>Fetching live hotel prices...</p>
                        </div>
                    ) : hotels.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                            <i className="fas fa-bed fa-2x mb-2"></i>
                            <p>No hotels found. Try different dates or filters.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                            {hotels.slice(0, 10).map((hotel) => (
                                <div
                                    key={hotel.id}
                                    onClick={() => onHotelSelected?.(hotel)}
                                    style={{
                                        background: selectedHotel?.id === hotel.id ? 'rgba(16,185,129,0.15)' : '#1a1f2e',
                                        border: selectedHotel?.id === hotel.id ? '2px solid #10b981' : '1px solid #2d3748',
                                        borderRadius: '10px',
                                        padding: '12px 16px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        {hotel.images?.[0] && (
                                            <img
                                                src={hotel.images[0]}
                                                alt={hotel.name}
                                                style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '6px' }}
                                                onError={e => e.target.style.display = 'none'}
                                            />
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <div style={{ color: '#e5e7eb', fontWeight: '600', fontSize: '0.95rem' }}>
                                                        {hotel.name}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                                        {renderStars(hotel.rating)}
                                                        <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                                                            {hotel.rating?.toFixed(1)}
                                                        </span>
                                                        <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                                                            ({hotel.reviews?.toLocaleString()} reviews)
                                                        </span>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ color: '#10b981', fontWeight: '700', fontSize: '1.1rem' }}>
                                                        ${hotel.price_per_night_usd}
                                                    </div>
                                                    <div style={{ color: '#6b7280', fontSize: '0.7rem' }}>per night</div>
                                                </div>
                                            </div>
                                            {hotel.amenities?.length > 0 && (
                                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                                                    {hotel.amenities.slice(0, 4).map((amenity, i) => (
                                                        <span key={i} style={{
                                                            fontSize: '0.65rem',
                                                            color: '#9ca3af',
                                                            background: 'rgba(255,255,255,0.05)',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                        }}>
                                                            {amenity}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '0.75rem', color: '#6b7280' }}>
                                                {hotel.free_cancellation && (
                                                    <span style={{ color: '#10b981' }}>
                                                        <i className="fas fa-check-circle me-1"></i>Free cancellation
                                                    </span>
                                                )}
                                                {hotel.check_in_time && (
                                                    <span>Check-in: {hotel.check_in_time}</span>
                                                )}
                                                {hotel.nearby_places?.[0] && (
                                                    <span>
                                                        <i className="fas fa-map-marker-alt me-1"></i>
                                                        {hotel.nearby_places[0].transport} to {hotel.nearby_places[0].name}
                                                    </span>
                                                )}
                                            </div>
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
