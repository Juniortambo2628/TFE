import React from 'react';

/**
 * CapacityBar — the "N of M booked · pct%" progress bar used across
 * packages surfaces (Admin/Packages, PackagePicker, PackageDetail).
 *
 * Colour thresholds are defined once here — green under 50%, warning
 * 50–79%, danger 80%+, all sitting on top of the same 6px track.
 *
 * Props:
 *   sold         number   — units booked so far
 *   capacity     number   — total capacity (renders nothing if falsy)
 *   pct          number?  — pre-computed percentage; derived if omitted
 *   seatsLeftLabel bool?  — render a "N seats left" hint below the bar
 *   size         'sm'|'md'
 *   thresholds   { warn, danger } — override defaults (50, 80)
 *   className    string?
 */
export default function CapacityBar({
    sold = 0,
    capacity,
    pct,
    seatsLeftLabel = false,
    size = 'sm',
    thresholds = { warn: 50, danger: 80 },
    className = '',
}) {
    if (!capacity || capacity <= 0) return null;

    const value = pct != null
        ? pct
        : Math.max(0, Math.min(100, Math.round((sold / capacity) * 100)));
    const isSoldOut = sold >= capacity;
    const tone = value >= thresholds.danger ? 'danger' : value >= thresholds.warn ? 'warning' : 'success';
    const trackHeight = size === 'md' ? 6 : 4;

    // Bootstrap classes map cleanly to the three tones.
    const barClass = { danger: 'bg-danger', warning: 'bg-warning', success: 'bg-success' }[tone];
    const textClass = { danger: 'text-danger', warning: 'text-warning', success: 'text-success' }[tone];

    return (
        <div className={className}>
            <div className="d-flex justify-content-between text-white-50 small mb-1">
                <span>{sold.toLocaleString()} of {capacity.toLocaleString()} booked</span>
                <span className={textClass}>{value}%</span>
            </div>
            <div className="progress" style={{ height: trackHeight, background: 'rgba(255,255,255,0.08)' }}>
                <div className={`progress-bar ${barClass}`} style={{ width: `${value}%` }} />
            </div>
            {seatsLeftLabel && (
                isSoldOut ? (
                    <div className="text-danger small mt-1">Sold out</div>
                ) : (
                    <div className={`small mt-1 ${value >= thresholds.danger ? 'text-danger' : 'text-white-50'}`}>
                        {(capacity - sold).toLocaleString()} {capacity - sold === 1 ? 'seat' : 'seats'} left
                    </div>
                )
            )}
        </div>
    );
}
