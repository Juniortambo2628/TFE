import React, { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
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
 * @param {"landing"|"dashboard"|"tournament"} variant - Visual/behaviour variant.
 *   - landing / dashboard: switch the active tournament in place (query param).
 *   - tournament: navigate to the selected tournament's single-view page
 *     (/tournaments/{slug}) instead of switching context in place.
 */
export default function TournamentSwitcher({ variant = 'landing' }) {
    const { tournament, tournamentList, switchableTournaments, switchTournament, isActive } = useTournament();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    const isLanding = variant === 'landing';
    const isTournamentPage = variant === 'tournament';

    // Which tournaments this switcher may offer (Sprint 53).
    //
    // The landing + dashboard variants CHANGE THE ACTIVE CONTEXT, so they show
    // ongoing and upcoming only — a concluded pick rebuilt the hero, the venue
    // slider, its stadium photography and the whole fan dashboard around an
    // event nobody can travel to. The `tournament` variant only NAVIGATES to
    // `/tournaments/{slug}`, which is exactly where a past tournament belongs,
    // so it keeps the full list.
    const options = isTournamentPage ? tournamentList : switchableTournaments;

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

    // Nothing to choose between — render the current tournament as a static
    // badge (dashboard) or nothing at all (landing) rather than a dropdown
    // that opens onto a single row.
    if (!options || options.length <= 1) {
        if (isLanding) return null;
        return tournament ? (
            <div className="fan-tournament-badge">
                <i className="fas fa-trophy me-1"></i>
                {tournament.short_name || tournament.name}
            </div>
        ) : null;
    }

    const handleSwitch = (item) => {
        setOpen(false);
        if (isTournamentPage) {
            // On a single-view tournament page, switching means going to that
            // tournament's own page rather than changing session context.
            router.visit(`/tournaments/${item.slug}`);
        } else if (isLanding) {
            switchTournament(item.id);
        } else {
            switchTournament(item.id, currentPath);
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
                    {options.map((item) => (
                        <li key={item.id} role="none">
                            <button
                                className={`tournament-switcher-item${isActive?.(item.id) ? ' active' : ''}`}
                                onClick={() => handleSwitch(item)}
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
