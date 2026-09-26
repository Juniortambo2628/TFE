import React from 'react';

/**
 * TournamentPill — the "which tournament does this row belong to" badge.
 *
 * Two variants driven by `tournamentId`:
 *   - non-null: blue trophy pill labelled `shortName || id`
 *   - null    : green globe pill labelled "Open to all" (cross-tournament)
 *
 * Built on `.tfe-pill` like every other badge on the platform. It used to
 * carry its own inline `background`/`color`/`padding` plus the Bootstrap
 * helpers `d-inline-flex align-items-center gap-1` — and Bootstrap is not
 * loaded on the dashboards, so the span had no display of its own and
 * stretched to the full width of any flex-column card it sat in (a colour
 * *bar* across the tribe cards rather than a pill).
 *
 * `size` controls the scale: 'sm' is the compact fan-card version, 'md' the
 * admin-table version. `className` composes so callers can tweak layout.
 */
export default function TournamentPill({
    tournamentId,
    shortName,
    size = 'sm',
    className = '',
    title,
}) {
    const scoped = !!tournamentId;
    const label = scoped ? (shortName || tournamentId) : 'Open to all';

    return (
        <span
            className={[
                'tfe-pill',
                scoped ? 'tfe-pill--info' : 'tfe-pill--approved',
                'tfe-pill--standalone',
                size === 'md' ? 'tfe-pill--md' : '',
                className,
            ].filter(Boolean).join(' ')}
            title={title || (scoped ? tournamentId : 'Visible across every tournament')}
        >
            <i className={`fas ${scoped ? 'fa-trophy' : 'fa-globe'}`} />
            {label}
        </span>
    );
}
