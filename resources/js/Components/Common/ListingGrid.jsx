import React, { useState } from 'react';
import AccentCard from '@/Components/Common/AccentCard';
import { Link } from '@inertiajs/react';

/**
 * ListingGrid — the ONE grid treatment for every dashboard collection.
 *
 * Renders an array of items as AccentCards (the same primitive the landing
 * tournament grid + partner hub use), so a dashboard listing page reads
 * as part of the same visual system. Callers hand in a `render(item)`
 * that maps their row to AccentCard props, or provide a shorthand
 * `to(item)` that returns { title, desc, meta, cta, accent, artwork, href }.
 *
 * Optional table view for tabular data (users, ticket sales) — pass
 * `tableView` to render columns; the ViewToggle appears when both are
 * provided. Grid is the default.
 *
 * Usage (grid only):
 *   <ListingGrid
 *     items={partners}
 *     to={(p) => ({
 *       title: p.display_name,
 *       eyebrow: p.partner_type,
 *       desc: p.tagline,
 *       accent: p.theme_accent,
 *       artwork: p.logo_url ? { src: p.logo_url } : { icon: 'fas fa-handshake' },
 *       href: `/partners/${p.slug}`,
 *       pills: p.verified ? ['Verified'] : [],
 *     })}
 *   />
 *
 * Usage (grid + table toggle):
 *   <ListingGrid items={rows} to={mapper} tableView={tableComponent} />
 */
export default function ListingGrid({
    items = [],
    to,
    render,
    tableView,
    emptyIcon = 'fas fa-inbox',
    emptyTitle = 'Nothing here yet',
    emptyBody,
    LinkComponent = Link,
    columns = 'repeat(auto-fill, minmax(280px, 1fr))',
}) {
    const [mode, setMode] = useState('grid');
    const hasTable = !!tableView;

    if (items.length === 0) {
        return (
            <div className="tfe-empty">
                <div className="tfe-empty__icon"><i className={emptyIcon} /></div>
                <h3 className="tfe-empty__title">{emptyTitle}</h3>
                {emptyBody && <p className="tfe-empty__body">{emptyBody}</p>}
            </div>
        );
    }

    return (
        <div className="tfe-listing-grid">
            {hasTable && (
                <div className="tfe-listing-grid__toolbar">
                    <div className="tfe-listing-grid__viewtoggle" role="tablist" aria-label="View mode">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={mode === 'grid'}
                            className={`tfe-btn tfe-btn--sm${mode === 'grid' ? ' is-active' : ''}`}
                            onClick={() => setMode('grid')}
                        >
                            <i className="fas fa-th-large"></i> Grid
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={mode === 'table'}
                            className={`tfe-btn tfe-btn--sm${mode === 'table' ? ' is-active' : ''}`}
                            onClick={() => setMode('table')}
                        >
                            <i className="fas fa-list"></i> Table
                        </button>
                    </div>
                </div>
            )}

            {mode === 'grid' ? (
                <div className="tfe-listing-grid__cards" style={{ gridTemplateColumns: columns }}>
                    {items.map((item, i) => {
                        if (render) return <React.Fragment key={item.id ?? i}>{render(item)}</React.Fragment>;
                        const props = to(item) || {};
                        return (
                            <AccentCard
                                key={item.id ?? i}
                                LinkComponent={props.href ? LinkComponent : 'div'}
                                accent={props.accent || '#dc143c'}
                                {...props}
                            />
                        );
                    })}
                </div>
            ) : (
                <div className="tfe-listing-grid__table">{tableView}</div>
            )}
        </div>
    );
}
