import React from 'react';
import Breadcrumbs from './Breadcrumbs';

const ROLE_STYLES = {
    fan: {
        accentColor: '#dc143c',
        homeRoute: 'fan.dashboard',
        gradient: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
        boxShadow: '0 8px 32px rgba(220, 20, 60, 0.2)',
        border: '1px solid #333',
    },
    admin: {
        accentColor: '#3b82f6',
        homeRoute: 'admin.dashboard',
        gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15)',
        border: '1px solid #1e3a5f',
    },
    partner: {
        accentColor: '#d97706',
        homeRoute: 'partner.dashboard',
        gradient: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
        boxShadow: '0 4px 24px rgba(217, 119, 6, 0.15)',
        border: '1px solid #d97706',
    },
};

export default function DashboardHero({
    title,
    subtitle = '',
    breadcrumbs = [],
    actions = null,
    showBack = false,
    bgImage = null,
    children,
    id = null,
    role = 'fan',
    accentColor: overrideColor,
    action = null,
}) {
    const style = ROLE_STYLES[role] || ROLE_STYLES.fan;
    const accentColor = overrideColor || style.accentColor;

    const cardBackground = bgImage
        ? `linear-gradient(to right, rgba(20, 0, 0, 0.9) 0%, ${accentColor}66 100%), url(${bgImage})`
        : style.gradient;

    return (
        <div id={id} className="mb-4">
            <Breadcrumbs
                title={title}
                breadcrumbs={breadcrumbs}
                actions={actions}
                showBack={showBack}
                accentColor={accentColor}
                homeRoute={style.homeRoute}
            />

            <div style={{
                background: cardBackground,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                padding: '2rem 2.5rem',
                borderRadius: '16px',
                boxShadow: style.boxShadow,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '2rem',
                border: bgImage ? `1px solid ${accentColor}4d` : style.border,
                overflow: 'hidden',
                minHeight: '180px',
            }}>
                <div style={{ flex: '1', minWidth: '300px', position: 'relative', zIndex: 1 }}>
                    <h1 style={{
                        color: '#fff', fontSize: '2.5rem', fontWeight: '800',
                        marginBottom: '0.5rem', textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                    }}>
                        {title}
                    </h1>
                    {subtitle && (
                        <p style={{
                            color: '#eee', fontSize: '1.1rem', marginBottom: '0',
                            textShadow: '0 1px 4px rgba(0,0,0,0.5)'
                        }}>
                            {subtitle}
                        </p>
                    )}
                </div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    {children}
                    {action && (
                        <button
                            onClick={action.onClick}
                            className={action.variant === 'outline' ? 'btn-admin-outline' : 'btn-admin'}
                        >
                            {action.icon && <i className={action.icon}></i>}
                            {action.label}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
