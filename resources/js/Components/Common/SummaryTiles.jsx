import React from 'react';
import StatCard from '@/Components/Common/StatCard';

/**
 * Shared "summary row" for every dashboard-shaped page — the row of
 * headline metric tiles that sits under the DashboardHero on
 * /fan/*, /admin/*, /partner/*. One call site, one grid, one tile
 * primitive, so a design change to the summary row lands in one
 * place instead of on every page.
 *
 * Usage:
 *   <SummaryTiles items={[
 *     { label: 'Matches', value: 64, icon: 'fa-futbol',       accent: 'red' },
 *     { label: 'Teams',   value: 48, icon: 'fa-users',        accent: 'blue' },
 *     { label: 'Venues',  value: 16, icon: 'fa-map-marker-alt', accent: 'teal' },
 *   ]} />
 *
 * Each item is passed straight through to <StatCard/>, so every
 * StatCard prop is accepted (label, value, subtext, icon, accent,
 * variant, pill, image, className).
 *
 * Falsy entries are dropped so callers can inline conditionals like
 * `showX && { label: 'X', … }` without adding gaps.
 */
export default function SummaryTiles({ items = [], className = '' }) {
    const tiles = items.filter(Boolean);
    if (tiles.length === 0) return null;

    return (
        <div className={`summary-cards-grid ${className}`.trim()}>
            {tiles.map((tile, i) => (
                <StatCard key={tile.key ?? tile.label ?? i} {...tile} />
            ))}
        </div>
    );
}
