import React from 'react';
import { usePage } from '@inertiajs/react';

/**
 * StatCard - Unified stat card component for the entire platform.
 * Supports:
 * - Basic stats with consistent branding
 * - Visual cards with background images (Admin style)
 * - Flexible accent colors
 *
 * Sprint 10: the inline "edit background" overlay was dropped along
 * with the admin Customize-UI system. Backgrounds still come through
 * settingsKey/bgType — just edit them on the Settings page.
 */
export default function StatCard({
    label,
    value,
    icon,
    subtext,
    image,
    bgType,
    settingsKey,
    variant = 'red', // red, blue, amber, etc.
    type = 'standard', // 'standard' (SummaryCard style) or 'visual' (AdminStatCard style)
    className = '',
}) {
    const { adminSettings = {} } = usePage().props;

    // Visual card logic (background images)
    const displayImage = (settingsKey && adminSettings[settingsKey]) 
        || (bgType && adminSettings[`bg_card_${bgType}`]) 
        || image;

    if (type === 'visual') {
        const cardStyle = displayImage ? {
            backgroundImage: `url(${displayImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        } : {};

        return (
            <div
                className={`visual-card ${displayImage ? '' : 'all-events'} ${className}`}
                style={{ ...cardStyle, position: 'relative', overflow: 'hidden' }}
            >
                {displayImage && <div className="visual-card-overlay"></div>}

                <div className="visual-card-content">
                    <div className="d-flex align-items-center gap-2 mb-1">
                        {icon && <i className={`${icon}`} style={{ opacity: 0.8, fontSize: '0.8rem' }}></i>}
                        <div className="visual-card-subtitle">{label}</div>
                    </div>
                    <div className="visual-card-title">{value}</div>
                </div>
            </div>
        );
    }

    // Standard Stat Card (Fan/Partner style)
    const activeColor = variant === 'red' ? '#dc143c' : (variant === 'amber' ? '#ffbf00' : '#4f46e5');

    return (
        <div className={`stat-card ${className}`} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: `linear-gradient(135deg, ${activeColor}26 0%, rgba(0, 0, 0, 0.4) 100%)`,
            border: `1px solid ${activeColor}4d`,
            borderRadius: '16px',
            padding: '16px 24px',
            minWidth: '140px',
            transition: 'all 0.3s ease',
        }}>
            <div style={{
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `${activeColor}33`,
                borderRadius: '12px',
                color: activeColor,
                fontSize: '1.25rem',
                flexShrink: 0,
                border: `1px solid ${activeColor}4d`,
            }}>
                <i className={`fas ${icon}`}></i>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span className="stat-value" style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    lineHeight: 1,
                    textShadow: `0 2px 10px ${activeColor}4d`,
                }}>{value}</span>
                <span className="stat-label" style={{
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: '#a0a0a0',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                }}>{label}</span>
                {subtext && <span className="stat-subtext" style={{ fontSize: '0.75rem', color: '#666' }}>{subtext}</span>}
            </div>
        </div>
    );
}
