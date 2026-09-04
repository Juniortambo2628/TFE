import React from 'react';

/**
 * WeatherCard — Journey-page weather forecast + packing checklist.
 *
 * Consumes the `weather` prop shape produced by WeatherService::forecast:
 *   { available, city, country, days: [{ date, temp_max, temp_min,
 *     precip_pct, uv_max, wind_max, summary }], packing: [{ icon, label,
 *     reason }] }
 *
 * When `available` is false we render a compact fallback rather than
 * nothing — surfacing the intent even without live data.
 */
export default function WeatherCard({ weather, tournamentName }) {
    // Deferred prop — initial render sees undefined; skip until it lands.
    if (weather === undefined) {
        return (
            <div className="content-card weather-card mt-4">
                <div className="card-header border-bottom pb-2 mb-3">
                    <i className="fas fa-cloud-sun text-info me-2"></i>
                    <h3 className="m-0">Weather & Packing</h3>
                </div>
                <div className="text-white-50 small">Loading forecast…</div>
            </div>
        );
    }
    if (!weather || !weather.available) {
        return (
            <div className="content-card weather-card mt-4">
                <div className="card-header border-bottom pb-2 mb-3">
                    <i className="fas fa-cloud-sun text-info me-2"></i>
                    <h3 className="m-0">Weather & Packing</h3>
                </div>
                <p className="text-white-50 small mb-0">
                    Forecast will appear here once your destination city is set.
                </p>
            </div>
        );
    }

    const days = (weather.days || []).slice(0, 7);
    const packing = weather.packing || [];

    return (
        <div className="content-card weather-card mt-4">
            <div className="card-header border-bottom pb-2 mb-3 d-flex align-items-center">
                <i className="fas fa-cloud-sun text-info me-2"></i>
                <h3 className="m-0">Weather & Packing</h3>
                <span className="ms-auto text-white-50 small">
                    {weather.city}{weather.country ? `, ${weather.country}` : ''}
                </span>
            </div>

            {/* Forecast strip */}
            {days.length > 0 && (
                <div
                    className="d-flex gap-2 overflow-x-auto pb-2 mb-3"
                    style={{ scrollbarWidth: 'thin' }}
                >
                    {days.map((d) => (
                        <div
                            key={d.date}
                            className="text-center flex-shrink-0 p-2 rounded"
                            style={{
                                minWidth: 80,
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.06)',
                            }}
                        >
                            <div className="text-white-50" style={{ fontSize: '0.7rem' }}>
                                {formatShortDate(d.date)}
                            </div>
                            <div className="my-1" style={{ fontSize: '1.5rem' }}>
                                {summaryIcon(d.summary)}
                            </div>
                            <div className="text-white fw-bold" style={{ fontSize: '0.85rem' }}>
                                {Math.round(d.temp_max)}° / {Math.round(d.temp_min)}°
                            </div>
                            <div className="text-info" style={{ fontSize: '0.65rem' }}>
                                {d.precip_pct != null ? `${d.precip_pct}% rain` : d.summary}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Packing checklist */}
            {packing.length > 0 && (
                <>
                    <div className="text-white-50 small mb-2">
                        <i className="fas fa-suitcase me-1"></i>
                        What to pack for {tournamentName || 'this trip'}
                    </div>
                    <div className="row g-2">
                        {packing.map((item, idx) => (
                            <div key={idx} className="col-md-6">
                                <div
                                    className="p-2 rounded d-flex align-items-center gap-3"
                                    style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                    }}
                                >
                                    <span
                                        style={{
                                            width: 32, height: 32,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: 'rgba(59,130,246,0.15)',
                                            borderRadius: 6,
                                            color: 'var(--fan-cyan, #00d2ff)',
                                        }}
                                    >
                                        <i className={packingIcon(item.icon)}></i>
                                    </span>
                                    <div className="flex-grow-1">
                                        <div className="text-white small fw-semibold">{item.label}</div>
                                        <div className="text-white-50" style={{ fontSize: '0.7rem' }}>{item.reason}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <div className="text-white-50 mt-2" style={{ fontSize: '0.7rem' }}>
                <i className="fas fa-info-circle me-1"></i>
                Forecast via Open-Meteo · refreshes every 3 hours.
            </div>
        </div>
    );
}

function formatShortDate(iso) {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
    } catch (e) {
        return iso;
    }
}

function summaryIcon(summary) {
    switch (summary) {
        case 'Clear': return '☀️';
        case 'Partly cloudy': return '⛅';
        case 'Fog': return '🌫️';
        case 'Drizzle':
        case 'Rain': return '🌧️';
        case 'Snow': return '❄️';
        case 'Thunderstorm': return '⛈️';
        default: return '🌤️';
    }
}

function packingIcon(icon) {
    switch (icon) {
        case 'sun': return 'fas fa-sun';
        case 'jacket': return 'fas fa-mitten';
        case 'layers': return 'fas fa-layer-group';
        case 'umbrella': return 'fas fa-umbrella';
        case 'sunscreen': return 'fas fa-shield-heart';
        case 'wind': return 'fas fa-wind';
        case 'shoes': return 'fas fa-shoe-prints';
        case 'passport': return 'fas fa-passport';
        default: return 'fas fa-check';
    }
}
