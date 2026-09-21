import React from 'react';
import PillBadge from '@/Components/Common/PillBadge';

/**
 * StatCard — the pastel-washed stat tile used on every dashboard hero
 * row (Sprint 33). Renders a token-driven `.tfe-tile` with a big
 * display number, a subtle label, an optional icon and an optional
 * trend / status pill.
 *
 * Sprint 33 goals it addresses:
 *   - Cross-role consistency: fan/admin/partner all use the same
 *     tile now, differentiated only by the `accent` prop.
 *   - No inline styles for colors or spacing — everything lives in
 *     resources/css/design-tokens.css + primitives.css.
 *
 * Sprint 43 — the CMS-driven `type="visual"` background-image variant was
 * removed: admin CMS customization is limited to public pages, and dashboard
 * cards are always the clean token-driven tile. Legacy visual props
 * (`type`/`image`/`bgType`/`settingsKey`) are accepted but ignored so old
 * call sites keep rendering a normal tile.
 *
 * Props:
 *   label, value, subtext, icon
 *   accent   one of: red rose blue cyan teal amber violet graph
 *   pill     { label, variant } — small status chip in the top-right
 *
 * Legacy prop `variant` still works; it maps to `accent` internally.
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
