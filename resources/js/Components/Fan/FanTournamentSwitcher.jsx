import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { useTournament } from '@/Context/TournamentContext';

/**
 * Compact tournament switcher for the fan dashboard.
 * Renders a dropdown showing the active tournament with ability to switch.
 */
export default function FanTournamentSwitcher() {
    const { tournament, tournamentList, switchTournament } = useTournament();
    const [open, setOpen] = useState(false);

    if (!tournamentList || tournamentList.length <= 1) {
        // Single tournament — just show the label, no switcher
        return tournament ? (
            <div className="fan-tournament-badge">
                <i className="fas fa-trophy me-1"></i>
                {tournament.short_name || tournament.name}
            </div>
        ) : null;
    }

    const handleSwitch = (slug) => {
        setOpen(false);
        switchTournament(slug);
    };

    return (
        <div className="fan-tournament-switcher" style={{ position: 'relative' }}>
            <button
                className="fan-tournament-trigger"
                onClick={() => setOpen(!open)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    backdropFilter: 'blur(10px)',
                }}
            >
                <i className="fas fa-trophy" style={{ color: '#dc2626', fontSize: '0.8rem' }}></i>
                <span style={{ fontWeight: 600 }}>{tournament?.short_name || tournament?.name}</span>
                <span style={{
                    fontSize: '0.65rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: tournament?.status === 'concluded' ? 'rgba(107,114,128,0.4)' :
                                tournament?.status === 'ongoing' ? 'rgba(34,197,94,0.3)' :
                                'rgba(251,191,36,0.3)',
                    color: tournament?.status === 'concluded' ? '#9ca3af' :
                           tournament?.status === 'ongoing' ? '#4ade80' :
                           '#fbbf24',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                }}>
                    {tournament?.status}
                </span>
                <i className={`fas fa-chevron-down`} style={{
                    fontSize: '0.65rem',
                    transition: 'transform 0.2s',
                    transform: open ? 'rotate(180deg)' : 'rotate(0)',
                }}></i>
            </button>

            {open && (
                <>
                    <div
                        onClick={() => setOpen(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 999,
                        }}
                    />
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '6px',
                        background: '#1a1a2e',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '10px',
                        padding: '6px',
                        minWidth: '220px',
                        zIndex: 1000,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}>
                        {tournamentList.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => handleSwitch(t.slug)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    background: t.id === tournament?.id ? 'rgba(220,38,38,0.15)' : 'transparent',
                                    color: t.id === tournament?.id ? '#ef4444' : '#e5e7eb',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                    if (t.id !== tournament?.id) e.target.style.background = 'rgba(255,255,255,0.05)';
                                }}
                                onMouseLeave={(e) => {
                                    if (t.id !== tournament?.id) e.target.style.background = 'transparent';
                                }}
                            >
                                <i className={`fas ${t.id === tournament?.id ? 'fa-check-circle' : 'fa-circle'}`}
                                   style={{ fontSize: '0.7rem' }}></i>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{t.short_name || t.name}</div>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '2px' }}>
                                        {t.hosts?.join(', ')} · {t.status}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
