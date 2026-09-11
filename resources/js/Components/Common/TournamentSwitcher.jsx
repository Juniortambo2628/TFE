import React, { useState, useRef, useEffect } from 'react';
import { useTournament } from '@/Context/TournamentContext';
// Sprint 32 — the landing switcher CSS was only bundled with the
// public Header. Import it here so the dashboard variant can reuse the
// same design instead of the earlier inline-styled variant.
import '../../../css/tournament-switcher.css';

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

    // Sprint 32 — dashboard variant used to be its own inline-styled pill
    // that felt off next to the polished landing one. Both variants now
    // render the same landing markup + styles for cross-role consistency.
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
