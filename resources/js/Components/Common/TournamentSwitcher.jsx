import React, { useState, useRef, useEffect } from 'react';
import { useTournament } from '@/Context/TournamentContext';

const STATUS_COLORS = {
    ongoing: { bg: 'rgba(34,197,94,0.3)', color: '#4ade80', label: 'LIVE' },
    upcoming: { bg: 'rgba(251,191,36,0.3)', color: '#fbbf24', label: 'UPCOMING' },
    concluded: { bg: 'rgba(107,114,128,0.4)', color: '#9ca3af', label: 'PAST' },
};

/**
 * Unified tournament switcher dropdown.
 *
 * @param {"landing"|"dashboard"} variant - Visual variant
 */
export default function TournamentSwitcher({ variant = 'landing' }) {
    const { tournament, tournamentList, switchTournament, isActive } = useTournament();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    const isLanding = variant === 'landing';

    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    if (!tournamentList || tournamentList.length === 0) {
        if (isLanding) return null;
        return tournament ? (
            <div className="fan-tournament-badge">
                <i className="fas fa-trophy me-1"></i>
                {tournament.short_name || tournament.name}
            </div>
        ) : null;
    }

    const handleSwitch = (id) => {
        setOpen(false);
        if (isLanding) {
            switchTournament(id);
        } else {
            switchTournament(id, currentPath);
        }
    };

    const status = tournament?.status || 'upcoming';
    const statusStyle = STATUS_COLORS[status] || STATUS_COLORS.upcoming;

    if (isLanding) {
        return (
            <div className="tournament-switcher" ref={ref}>
                <button
                    className="tournament-switcher-trigger"
                    onClick={() => setOpen(!open)}
                    aria-expanded={open}
                    aria-haspopup="true"
                    type="button"
                >
                    <span className="tournament-switcher-icon">
                        <iconify-icon icon="lucide:trophy"></iconify-icon>
                    </span>
                    <span className="tournament-switcher-label">{tournament?.short_name || 'Tournament'}</span>
                    <span className={`tournament-switcher-status status-${status}`}>
                        {tournament?.status || ''}
                    </span>
                    <iconify-icon icon="lucide:chevron-down" className="tournament-switcher-chevron"></iconify-icon>
                </button>

                {open && (
                    <ul className="tournament-switcher-menu" role="menu">
                        {tournamentList.map((item) => (
                            <li key={item.id} role="none">
                                <button
                                    className={`tournament-switcher-item${isActive?.(item.id) ? ' active' : ''}`}
                                    onClick={() => handleSwitch(item.id)}
                                    role="menuitem"
                                    type="button"
                                >
                                    <div className="tournament-switcher-item-name">
                                        <strong>{item.name}</strong>
                                        <small>
                                            {item.hosts?.length > 0 ? `Hosted by ${item.hosts.join(', ')}` : ''}
                                        </small>
                                    </div>
                                    <span className={`tournament-switcher-item-status status-${item.status}`}>
                                        {item.status}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        );
    }

    // Dashboard variant
    return (
        <div className="fan-tournament-switcher" ref={ref} style={{ position: 'relative' }}>
            <button
                className="fan-tournament-trigger"
                onClick={() => setOpen(!open)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px', padding: '6px 14px', color: '#fff',
                    fontSize: '0.85rem', cursor: 'pointer', backdropFilter: 'blur(10px)',
                }}
            >
                <i className="fas fa-trophy" style={{ color: '#dc2626', fontSize: '0.8rem' }}></i>
                <span style={{ fontWeight: 600 }}>{tournament?.short_name || tournament?.name}</span>
                <span style={{
                    fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px',
                    background: statusStyle.bg, color: statusStyle.color,
                    textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px',
                }}>
                    {statusStyle.label}
                </span>
                <i className="fas fa-chevron-down" style={{
                    fontSize: '0.65rem', transition: 'transform 0.2s',
                    transform: open ? 'rotate(180deg)' : 'rotate(0)',
                }}></i>
            </button>

            {open && (
                <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: '6px',
                    background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px', padding: '6px', minWidth: '260px',
                    zIndex: 1000, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}>
                    {tournamentList.map((t) => {
                        const tStatus = STATUS_COLORS[t.status] || STATUS_COLORS.upcoming;
                        const active = t.id === tournament?.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => handleSwitch(t.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    width: '100%', padding: '10px 12px', border: 'none',
                                    borderRadius: '8px',
                                    background: active ? 'rgba(220,38,38,0.15)' : 'transparent',
                                    color: active ? '#ef4444' : '#e5e7eb',
                                    fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                    if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                }}
                                onMouseLeave={(e) => {
                                    if (!active) e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                <i className={`fas ${active ? 'fa-check-circle' : 'fa-circle'}`}
                                   style={{ fontSize: '0.7rem', flexShrink: 0 }}></i>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600 }}>{t.short_name || t.name}</div>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '2px' }}>
                                        {t.hosts?.join(', ')}
                                    </div>
                                </div>
                                <span style={{
                                    fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px',
                                    background: tStatus.bg, color: tStatus.color,
                                    fontWeight: 700, textTransform: 'uppercase', flexShrink: 0,
                                }}>
                                    {tStatus.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
