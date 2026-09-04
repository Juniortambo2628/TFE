import React, { useMemo, useState } from 'react';

/**
 * ItineraryMap — SVG-projected venue map with route lines and distances.
 *
 * Given the tournament's venues (each with lat/lng from Wikipedia) and
 * a list of selected matches, projects the venues onto a rectangular
 * SVG canvas (Web Mercator, clamped to the bounding box of the visible
 * venues) and connects consecutive selected match venues with a
 * dashed line. Each hop shows a haversine distance chip.
 *
 * No new deps — pure SVG. Zero external routing calls.
 *
 * Props:
 *   venues          [{name, lat, lng, thumbnail?, capacity?}]
 *   selectedMatches [{id, homeTeam, awayTeam, venue, date}]  optional; order = travel order
 *   height          number px (default 320)
 */
export default function ItineraryMap({ venues = [], selectedMatches = [], height = 320 }) {
    // Only venues with coords participate. Nothing to do if we have zero.
    const geoVenues = useMemo(
        () => (venues || []).filter((v) => typeof v?.lat === 'number' && typeof v?.lng === 'number'),
        [venues],
    );

    // Route: selected matches → venue rows in their listed order.
    const routeVenues = useMemo(() => {
        if (!selectedMatches || selectedMatches.length === 0) return [];
        const byName = new Map(geoVenues.map((v) => [normalize(v.name), v]));
        const stops = [];
        for (const m of selectedMatches) {
            const v = byName.get(normalize(m.venue));
            if (v && (!stops.length || stops[stops.length - 1].name !== v.name)) {
                stops.push({ ...v, matchLabel: matchLabel(m) });
            }
        }
        return stops;
    }, [selectedMatches, geoVenues]);

    // Bounding box + projection. Falls back to a "world" view if nothing.
    const projection = useMemo(() => buildProjection(geoVenues, height), [geoVenues, height]);

    const [hovered, setHovered] = useState(null);

    if (geoVenues.length === 0) {
        return (
            <div
                className="p-4 rounded"
                style={{
                    background: 'rgba(20,20,20,0.5)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.55)',
                    textAlign: 'center',
                }}
            >
                <i className="fas fa-map-marker-alt me-2"></i>
                Venue coordinates not available yet — we'll pin the map once Wikipedia data lands.
            </div>
        );
    }

    const width = 720;
    const totalKm = routeVenues.length >= 2
        ? routeVenues.reduce((sum, v, i) => i === 0 ? 0 : sum + haversineKm(routeVenues[i - 1], v), 0)
        : 0;

    return (
        <div className="itinerary-map">
            <div className="d-flex align-items-baseline justify-content-between mb-2">
                <div>
                    <h5 className="text-white mb-1">
                        <i className="fas fa-map-location-dot me-2 text-info"></i>
                        Where you're going
                    </h5>
                    <p className="text-white-50 small mb-0">
                        {geoVenues.length} tournament venue{geoVenues.length === 1 ? '' : 's'}
                        {routeVenues.length >= 2 && ` · your route: ${Math.round(totalKm).toLocaleString()} km across ${routeVenues.length} stops`}
                    </p>
                </div>
            </div>

            <div
                style={{
                    position: 'relative',
                    background: 'linear-gradient(180deg, #0a0f1a 0%, #050810 100%)',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.06)',
                    overflow: 'hidden',
                }}
            >
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                    role="img"
                    aria-label="Tournament venue map"
                >
                    <defs>
                        <radialGradient id="mapGlow" cx="50%" cy="50%" r="60%">
                            <stop offset="0%" stopColor="rgba(59,130,246,0.15)" />
                            <stop offset="100%" stopColor="transparent" />
                        </radialGradient>
                    </defs>

                    {/* Faint grid — anchors the eye without drawing a full map */}
                    <rect x="0" y="0" width={width} height={height} fill="url(#mapGlow)" />
                    {gridLines(width, height).map((line, i) => (
                        <line
                            key={i}
                            x1={line.x1}
                            y1={line.y1}
                            x2={line.x2}
                            y2={line.y2}
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="1"
                        />
                    ))}

                    {/* Route lines between consecutive stops */}
                    {routeVenues.slice(0, -1).map((v, i) => {
                        const a = projection.project(v.lat, v.lng, width);
                        const b = projection.project(routeVenues[i + 1].lat, routeVenues[i + 1].lng, width);
                        const km = haversineKm(v, routeVenues[i + 1]);
                        const mx = (a.x + b.x) / 2;
                        const my = (a.y + b.y) / 2;
                        return (
                            <g key={`route-${i}`}>
                                <line
                                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                                    stroke="#dc143c"
                                    strokeWidth="2"
                                    strokeDasharray="6 4"
                                    opacity="0.75"
                                />
                                <rect
                                    x={mx - 26} y={my - 10}
                                    width="52" height="18" rx="9"
                                    fill="rgba(220,20,60,0.85)"
                                />
                                <text
                                    x={mx} y={my + 3}
                                    textAnchor="middle"
                                    fill="#fff"
                                    fontSize="10"
                                    fontWeight="700"
                                >
                                    {Math.round(km)} km
                                </text>
                            </g>
                        );
                    })}

                    {/* Venue pins */}
                    {geoVenues.map((v, i) => {
                        const p = projection.project(v.lat, v.lng, width);
                        const inRoute = routeVenues.some((r) => r.name === v.name);
                        const orderIdx = routeVenues.findIndex((r) => r.name === v.name);
                        const isHovered = hovered?.name === v.name;
                        return (
                            <g
                                key={v.name + i}
                                transform={`translate(${p.x}, ${p.y})`}
                                onMouseEnter={() => setHovered(v)}
                                onMouseLeave={() => setHovered(null)}
                                style={{ cursor: 'pointer' }}
                            >
                                <circle
                                    r={isHovered ? 12 : (inRoute ? 10 : 6)}
                                    fill={inRoute ? '#dc143c' : 'rgba(59,130,246,0.85)'}
                                    stroke="#fff"
                                    strokeWidth={inRoute ? 2 : 1}
                                    opacity={inRoute ? 1 : 0.75}
                                />
                                {inRoute && (
                                    <text
                                        y="3"
                                        textAnchor="middle"
                                        fill="#fff"
                                        fontSize="10"
                                        fontWeight="700"
                                    >
                                        {orderIdx + 1}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>

                {/* Hover tooltip */}
                {hovered && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 10,
                            left: 10,
                            background: 'rgba(0,0,0,0.85)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            padding: '10px 14px',
                            color: '#fff',
                            pointerEvents: 'none',
                            maxWidth: 280,
                        }}
                    >
                        <div className="fw-semibold mb-1">{hovered.name}</div>
                        {hovered.location && (
                            <div className="text-white-50 small">{hovered.location}</div>
                        )}
                        {hovered.capacity && (
                            <div className="text-info small mt-1">
                                {typeof hovered.capacity === 'number'
                                    ? hovered.capacity.toLocaleString() + ' seats'
                                    : hovered.capacity}
                            </div>
                        )}
                    </div>
                )}

                {/* Legend */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 8, right: 12,
                        display: 'flex', gap: 12,
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.65)',
                    }}
                >
                    <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#dc143c', marginRight: 6 }} />Your stops</span>
                    <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: 'rgba(59,130,246,0.85)', marginRight: 6 }} />Tournament venue</span>
                </div>
            </div>
        </div>
    );
}

// ── Projection ────────────────────────────────────────────────────────
// Web Mercator (simplified) with bounding box + 10% padding around the
// visible venue set. Falls back to a global view when only one venue.
function buildProjection(venues, height) {
    if (venues.length === 0) {
        return { project: () => ({ x: 0, y: 0 }) };
    }
    // Convert lat/lng to Mercator y/x in radians.
    const project0 = (lat, lng) => ({
        x: (lng + 180) * (Math.PI / 180),
        y: Math.log(Math.tan((90 + lat) * Math.PI / 360)),
    });
    const points = venues.map((v) => project0(v.lat, v.lng));
    let minX = Math.min(...points.map((p) => p.x));
    let maxX = Math.max(...points.map((p) => p.x));
    let minY = Math.min(...points.map((p) => p.y));
    let maxY = Math.max(...points.map((p) => p.y));

    // Add padding — 10% either side of the tightest bounding box, with a
    // minimum span so a single venue doesn't zoom infinitely.
    const padX = Math.max((maxX - minX) * 0.1, 0.05);
    const padY = Math.max((maxY - minY) * 0.1, 0.05);
    minX -= padX; maxX += padX;
    minY -= padY; maxY += padY;

    return {
        project(lat, lng, width) {
            const p = project0(lat, lng);
            const x = ((p.x - minX) / (maxX - minX)) * width;
            // SVG y grows down; Mercator y grows up.
            const y = height - ((p.y - minY) / (maxY - minY)) * height;
            return { x, y };
        },
    };
}

function gridLines(width, height) {
    const lines = [];
    for (let i = 1; i < 6; i++) {
        lines.push({ x1: (i * width) / 6, y1: 0, x2: (i * width) / 6, y2: height });
        lines.push({ x1: 0, y1: (i * height) / 6, x2: width, y2: (i * height) / 6 });
    }
    return lines;
}

// ── Distance ──────────────────────────────────────────────────────────
function haversineKm(a, b) {
    const R = 6371;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const s1 = Math.sin(dLat / 2);
    const s2 = Math.sin(dLng / 2);
    const c = 2 * Math.asin(Math.sqrt(s1 * s1 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * s2 * s2));
    return R * c;
}

function normalize(s) {
    return (s || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

function matchLabel(m) {
    if (!m) return '';
    return [m.homeTeam, 'vs', m.awayTeam].filter(Boolean).join(' ');
}
