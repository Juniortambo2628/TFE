import React from 'react';

/**
 * TournamentPill — the "which tournament does this row belong to" badge.
 *
 * Two variants driven by `tournamentId`:
 *   - non-null: blue trophy pill labelled `shortName || id`
 *   - null    : green globe pill labelled "Open to all" (cross-tournament)
 *
 * `size` controls dot vs badge: 'sm' is the compact fan-card version,
 * 'md' is the admin-table version. `className` composes with the
 * built-in tone classes so callers can tweak layout (margin, wrap).
 */
export default function TournamentPill({
    tournamentId,
    shortName,
    size = 'sm',
    className = '',
    title,
}) {
    const scoped = !!tournamentId;
    const label = shortName || tournamentId || 'Open to all';
    const icon = scoped ? 'fa-trophy' : 'fa-globe';

    const style = size === 'md'
        ? { fontSize: '0.75rem', padding: '4px 10px', borderRadius: 999, fontWeight: 600 }
        : { fontSize: '0.65rem', padding: '2px 8px',  borderRadius: 999, fontWeight: 600, letterSpacing: 0.3 };

    const tone = scoped
        ? { background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }
        : { background: 'rgba(16,185,129,0.15)', color: '#10b981' };

    return (
        <span
            className={`d-inline-flex align-items-center gap-1 ${className}`}
            style={{ ...style, ...tone }}
            title={title || (scoped ? tournamentId : 'Visible across every tournament')}
        >
            <i className={`fas ${icon}`} style={{ fontSize: size === 'md' ? '0.65rem' : '0.55rem' }}></i>
            {scoped ? label : 'Open to all'}
        </span>
    );
}
