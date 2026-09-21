import React from 'react';
import PillBadge from '@/Components/Common/PillBadge';

/**
 * StatCard — the pastel-washed stat tile used on every dashboard hero
 * row. Token-driven `.tfe-tile` with a big display number, a subtle
 * label, an optional icon and an optional trend / status pill.
 *
 * Sprint 43 pruned the CMS-driven `type="visual"` variant: dashboard
 * cards no longer read `adminSettings[bg_card_*]` — CMS customization
 * is now scoped to public pages only. Callers may still pass legacy
 * `bgType`/`settingsKey`/`type="visual"` props; they're ignored so the
 * transition is silent.
 */
const VARIANT_TO_ACCENT = {
    red: 'red',
    blue: 'blue',
    cyan: 'cyan',
    amber: 'amber',
    green: 'teal',
    purple: 'violet',
    rose: 'rose',
    teal: 'teal',
    graph: 'graph',
};

export default function StatCard({
    label,
    value,
    icon,
    subtext,
    variant,
    accent,
    pill,
    className = '',
    // Legacy props — accepted and ignored (see file header).
    // eslint-disable-next-line no-unused-vars
    image, bgType, settingsKey, type,
}) {
    const resolvedAccent = accent || VARIANT_TO_ACCENT[variant] || 'red';
    const iconClass = icon?.startsWith('fa') ? icon : (icon ? `fa-${icon}` : '');

    return (
        <div className={`tfe-tile tfe-tile--${resolvedAccent} ${className}`}>
            <div className="tfe-tile__head">
                {icon && (
                    <div className="tfe-tile__icon">
                        <i className={`fas ${iconClass}`}></i>
                    </div>
                )}
                {pill && <PillBadge {...pill} />}
            </div>
            <div>
                <div className="tfe-tile__value">{value}</div>
                <div className="tfe-tile__label">{label}</div>
                {subtext && <div className="tfe-tile__subtext">{subtext}</div>}
            </div>
        </div>
    );
}
