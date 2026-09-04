import React from 'react';

/**
 * MetricTile — small analytics tile shared by the admin dashboards.
 *
 * Structure: label (muted, sm) → primary value (bold, big) → subtext.
 * `value` accepts a scalar or a ReactNode (so callers can render a
 * multi-line breakdown like currency-per-line).
 *
 * `tone` optionally colours the primary value against a threshold:
 *   'success' | 'warning' | 'danger' | 'info' | null (default white).
 *
 * `size` controls the value's font-size: 'sm' | 'md' (default 'md').
 */
export default function MetricTile({
    label,
    value,
    subtext = null,
    tone = null,
    size = 'md',
    className = '',
}) {
    const toneClass = {
        success: 'text-success',
        warning: 'text-warning',
        danger: 'text-danger',
        info: 'text-info',
    }[tone] || 'text-white';

    const valueClass = size === 'sm' ? 'fs-5' : 'fs-3';

    return (
        <div className={`admin-card-dark p-3 ${className}`}>
            <div className="text-white-50 small">{label}</div>
            <div className={`fw-bold ${valueClass} ${toneClass}`}>
                {value}
            </div>
            {subtext && (
                <div className="text-white-50 small">{subtext}</div>
            )}
        </div>
    );
}
