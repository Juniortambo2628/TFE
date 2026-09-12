import React from 'react';

/**
 * PillBadge — status chips used across the platform (Sprint 33).
 *
 * One primitive for every LIVE / UPCOMING / CONCLUDED / PENDING /
 * APPROVED / REJECTED / INFO badge. Consumers pass a `variant` and
 * the label to render; colour comes from tokens (`--pill-*-*`), not
 * from inline styles.
 */
const KNOWN_VARIANTS = new Set([
    'live', 'upcoming', 'concluded', 'pending', 'approved', 'rejected', 'info',
]);

export default function PillBadge({ label, variant = 'info', dot = false, className = '' }) {
    if (label == null) return null;
    const safeVariant = KNOWN_VARIANTS.has(variant) ? variant : 'info';
    return (
        <span className={`tfe-pill tfe-pill--${safeVariant} ${className}`}>
            {dot && <span className="tfe-pill__dot" aria-hidden="true"></span>}
            {label}
        </span>
    );
}
