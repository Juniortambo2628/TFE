import React from 'react';

/**
 * SummaryCard - Black/Red themed stat card matching legacy design
 * Uses: --primary-red: #dc143c, --card-bg: #0a0a0a
 */
export default function SummaryCard({ icon, value, label, subtext, className = '' }) {
    return (
        <div className={`stat-card ${className}`} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: 'linear-gradient(135deg, rgba(220, 20, 60, 0.15) 0%, rgba(0, 0, 0, 0.4) 100%)',
            border: '1px solid rgba(220, 20, 60, 0.3)',
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
                background: 'rgba(220, 20, 60, 0.2)',
                borderRadius: '12px',
                color: '#dc143c',
                fontSize: '1.25rem',
                flexShrink: 0,
                border: '1px solid rgba(220, 20, 60, 0.3)',
            }}>
                <i className={`fas ${icon}`}></i>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    lineHeight: 1,
                    textShadow: '0 2px 10px rgba(220, 20, 60, 0.3)',
                }}>{value}</span>
                <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: '#a0a0a0',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                }}>{label}</span>
                {subtext && <span style={{ fontSize: '0.75rem', color: '#666' }}>{subtext}</span>}
            </div>
        </div>
    );
}
