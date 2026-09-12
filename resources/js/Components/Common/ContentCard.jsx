import React from 'react';

/**
 * ContentCard — the glass slab that wraps most non-tile content on
 * dashboards (Sprint 33).
 *
 * Header: optional title + subtitle + trailing action node
 * Body: children, padded by default; pass flush to remove padding
 * (for tables or grids that manage their own padding).
 *
 * Consumers pass `title` and optionally `subtitle` + `action` (a
 * trailing node — a link, a filter, whatever). Header divider and
 * leading icons are intentionally omitted; the slab reads as one
 * continuous surface.
 */
export default function ContentCard({
    title,
    subtitle,
    action,
    flush = false,
    className = '',
    children,
}) {
    const bodyClass = `tfe-slab__body${flush ? ' tfe-slab__body--flush' : ''}`;

    return (
        <section className={`tfe-slab ${className}`}>
            {(title || action) && (
                <header className="tfe-slab__header">
                    <div>
                        {title && <h3 className="tfe-slab__title">{title}</h3>}
                        {subtitle && <div className="tfe-slab__title-sub">{subtitle}</div>}
                    </div>
                    {action && <div>{action}</div>}
                </header>
            )}
            <div className={bodyClass}>{children}</div>
        </section>
    );
}
