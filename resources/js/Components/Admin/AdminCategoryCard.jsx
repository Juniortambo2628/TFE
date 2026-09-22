import React from 'react';

/**
 * AdminCategoryCard — visual chip used in admin picker rows.
 *
 * Sprint 43 — dropped the `settingsKey` CMS-override read: admin CMS
 * customization is limited to public pages, and the category image now comes
 * straight from the `image` prop. All static styling lives in
 * admin-theme.css (`.visual-card*`); only the dynamic image rides a CSS
 * variable, so there are no inline style properties.
 */
export default function AdminCategoryCard({
    label,
    subtitle,
    image,
    active,
    onClick,
    className = '',
}) {
    return (
        <div
            onClick={onClick}
            className={`visual-card ${active ? 'active' : ''} ${className}`}
        >
            <div
                className="visual-card-bg"
                style={{ '--visual-card-bg': image ? `url(${image})` : 'none' }}
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
