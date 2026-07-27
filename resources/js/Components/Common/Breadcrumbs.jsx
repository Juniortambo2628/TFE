import React from 'react';
import { Link } from '@inertiajs/react';

export default function Breadcrumbs({ title, breadcrumbs = [], showBack = false, actions = null,
    accentColor = '#dc143c', homeRoute = 'fan.dashboard' }) {
    return (
        <div className="mb-4" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '1rem'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                {showBack && (
                    <button
                        onClick={() => window.history.back()}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '36px', height: '36px',
                            background: `${accentColor}1a`, border: `1px solid ${accentColor}4d`,
                            borderRadius: '8px', color: accentColor, cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = `${accentColor}33`;
                            e.currentTarget.style.borderColor = accentColor;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = `${accentColor}1a`;
                            e.currentTarget.style.borderColor = `${accentColor}4d`;
                        }}
                        title="Go back"
                    >
                        <i className="fas fa-arrow-left"></i>
                    </button>
                )}

                <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Link
                        href={route(homeRoute)}
                        style={{ color: '#888', textDecoration: 'none', fontSize: '0.875rem', transition: 'color 0.2s ease' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = accentColor}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
                    >
                        <i className="fas fa-home"></i>
                    </Link>

                    {breadcrumbs.map((crumb, index) => (
                        <React.Fragment key={index}>
                            <span style={{ color: '#555', fontSize: '0.875rem' }}>/</span>
                            {crumb.href ? (
                                <Link
                                    href={crumb.href}
                                    style={{ color: '#888', textDecoration: 'none', fontSize: '0.875rem', transition: 'color 0.2s ease' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = accentColor}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
                                >
                                    {crumb.icon && <i className={`${crumb.icon} me-1`}></i>}
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span style={{ color: accentColor, fontSize: '0.875rem', fontWeight: '500' }}>
                                    {crumb.icon && <i className={`${crumb.icon} me-1`}></i>}
                                    {crumb.label}
                                </span>
                            )}
                        </React.Fragment>
                    ))}

                    {title && breadcrumbs.length === 0 && (
                        <>
                            <span style={{ color: '#555', fontSize: '0.875rem' }}>/</span>
                            <span style={{ color: accentColor, fontSize: '0.875rem', fontWeight: '500' }}>
                                {title}
                            </span>
                        </>
                    )}
                </nav>
            </div>

            {actions && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {actions}
                </div>
            )}
        </div>
    );
}
