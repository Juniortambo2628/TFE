import React from 'react';

/**
 * AdminCategoryCard — visual chip used in admin picker rows.
 *
 * Sprint 43 pruned the CMS-driven background swap: dashboard cards
 * no longer read `adminSettings[bg_card_*]`. `settingsKey` is still
 * accepted for backward-compat but ignored — the `image` prop wins.
 */
export default function AdminCategoryCard({
    label,
    subtitle,
    image,
    active,
    onClick,
    className = '',
    // eslint-disable-next-line no-unused-vars
    settingsKey,
}) {
    return (
        <div
            onClick={onClick}
            className={`visual-card ${active ? 'active' : ''} ${className}`.trim()}
        >
            <div
                className="visual-card-bg"
                style={image ? { '--card-bg-image': `url(${image})` } : undefined}
            ></div>
            <div className="visual-card-overlay"></div>
            <div className="visual-card-check"><i className="fas fa-check"></i></div>

            <div className="visual-card-content">
                <div className="visual-card-title">{label}</div>
                {subtitle && <div className="visual-card-subtitle">{subtitle}</div>}
            </div>
        </div>
    );
}
