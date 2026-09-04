import React from 'react';
import { usePage } from '@inertiajs/react';

/**
 * AdminCategoryCard — visual chip used in admin picker rows.
 *
 * Sprint 10 pared this back: the old "edit mode" that let admins swap
 * the background image inline was part of a Customize-UI system that
 * added complexity without pulling weight. Backgrounds now come from
 * settings only (uploaded via the Settings page).
 */
export default function AdminCategoryCard({
    label,
    subtitle,
    image,
    settingsKey,
    active,
    onClick,
    className = '',
}) {
    const { adminSettings = {} } = usePage().props;
    const displayImage = (settingsKey && adminSettings[settingsKey]) || image;

    const cardStyle = displayImage
        ? { backgroundImage: `url(${displayImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : {};

    return (
        <div
            onClick={onClick}
            className={`visual-card ${active ? 'active' : ''} ${className}`}
            style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', minWidth: '180px' }}
        >
            <div className="visual-card-bg" style={cardStyle}></div>
            <div className="visual-card-overlay"></div>
            <div className="visual-card-check"><i className="fas fa-check"></i></div>

            <div className="visual-card-content">
                <div className="visual-card-title">{label}</div>
                {subtitle && <div className="visual-card-subtitle">{subtitle}</div>}
            </div>
        </div>
    );
}
