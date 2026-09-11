import React from 'react';
import { Link } from '@inertiajs/react';

/**
 * PoweredByBadge — small "Powered by {partner}" credit strip shown on
 * fan-facing listings so the discovery loop closes both ways: fans who
 * find a package can bounce to the partner's hub, and partners who
 * publish get earned exposure on every listing they push.
 *
 * Renders nothing when publisher is null (admin-curated listings).
 * variant='chip' is the compact form (tiny row on package cards);
 * variant='strip' is the wider version for the PackageDetail hero.
 */
export default function PoweredByBadge({ publisher, variant = 'chip', className = '' }) {
    if (!publisher) return null;

    return (
        <Link
            href={route('partners.hub', publisher.slug)}
            onClick={(e) => e.stopPropagation()}
            className={`powered-by powered-by--${variant} ${className}`}
            style={{ '--partner-accent': publisher.theme_accent || '#dc143c' }}
        >
            {publisher.logo_url ? (
                <img src={publisher.logo_url} alt={publisher.display_name} className="powered-by__logo" />
            ) : (
                <span className="powered-by__logo powered-by__logo--fallback">
                    {publisher.display_name?.charAt(0) || '?'}
                </span>
            )}
            <span className="powered-by__label">
                <span className="powered-by__prefix">Powered by</span>
                <span className="powered-by__name">
                    {publisher.display_name}
                    {publisher.verified && (
                        <i className="fas fa-check-circle powered-by__verified" title="Verified partner"></i>
                    )}
                </span>
            </span>
        </Link>
    );
}
