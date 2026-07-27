import React from 'react';

/**
 * DashboardHeader - Black/Red themed hero header matching legacy design
 * Uses: --primary-red: #dc143c, background: #1a1d21
 */
export default function DashboardHeader({ title, subtitle, children, className = '' }) {
    return (
        <div className={`dashboard-header-card mb-8 ${className}`} style={{
            background: '#1a1d21',
            borderRadius: '1rem',
            padding: '2rem',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            backgroundImage: 'linear-gradient(45deg, rgba(220, 20, 60, 0.1) 0%, transparent 100%)',
            position: 'relative',
            overflow: 'hidden',
        }}>
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
            }}>
                <div>
                    <h1 style={{
                        fontSize: '1.75rem',
                        fontWeight: 700,
                        color: '#fff',
                        marginBottom: '0.5rem',
                    }}>{title}</h1>
                    <p style={{ color: '#a0a0a0', margin: 0 }}>{subtitle}</p>
                </div>
                {children && (
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}
