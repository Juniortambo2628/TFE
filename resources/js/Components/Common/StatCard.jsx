import React from 'react';
import { usePage } from '@inertiajs/react';
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
 *   - Backward-compatible with prior call sites that passed
 *     `variant` (red/blue/amber/green/purple/cyan). The
 *     backend-controlled `type="visual"` background-image variant is
 *     still supported for admin content that carries a hero image.
 *
 * Props (new):
 *   label, value, subtext, icon
 *   accent   one of: red rose blue cyan teal amber violet graph
 *   pill     { label, variant } — small status chip in the top-right
 *
 * Legacy prop `variant` still works; it maps to `accent` internally
 * so admin/partner pages keep rendering while we roll the visual
 * refresh out.
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
    image,
    bgType,
    settingsKey,
    variant,
    accent,
    pill,
    type = 'standard',
    className = '',
}) {
    const { adminSettings = {} } = usePage().props;

    // Visual card variant is unchanged: an admin-configured hero image
    // wrapped in the same tile chrome. Kept for compatibility with the
    // /admin/users page and any other visual-card call site.
    const displayImage = (settingsKey && adminSettings[settingsKey])
        || (bgType && adminSettings[`bg_card_${bgType}`])
        || image;

    if (type === 'visual') {
        const cardStyle = displayImage ? {
            backgroundImage: `url(${displayImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        } : undefined;

        return (
            <div className={`tfe-tile ${className}`} style={cardStyle}>
                <div className="tfe-tile__head">
                    {icon && (
                        <div className="tfe-tile__icon">
                            <i className={`fas ${icon}`}></i>
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
