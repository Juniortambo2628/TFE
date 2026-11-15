import React from 'react';
import { router } from '@inertiajs/react';
import { navStack, normalizeUrl } from '@/lib/navHistory';
import '../../../css/back-nav.css';

/**
 * Back, the one rule for both headers (public and dashboard).
 *
 * Retraces this visit (history.back()) when the previous page was one of
 * ours, and goes up to `parentHref` otherwise, so someone who arrived from a
 * shared link is never taken off the site (lib/navHistory). Going up
 * REPLACES the current entry, so pressing Back again keeps climbing
 * (booking -> Journey -> Dashboard) instead of bouncing between two pages.
 */
export function goBack(parentHref = '/') {
    if (navStack.canGoBack()) {
        window.history.back();
        return;
    }
    const href = parentHref || '/';
    navStack.replaceTop(normalizeUrl(href));
    router.visit(href, { replace: true });
}

/**
 * The Back button as it sits at the left end of the header: rendered there
 * directly on dashboard pages, portalled there by BackNav on public pages
 * once the breadcrumb has scrolled away. On narrow phones it is the arrow
 * alone (its name stays in aria-label), so the header's other controls fit.
 */
export default function HeaderBack({ parentHref = '/', parentLabel = 'previous page', className = 'tfe-backnav-header' }) {
    return (
        <button
            type="button"
            className={className}
            onClick={() => goBack(parentHref)}
            aria-label={`Back to ${parentLabel}`}
        >
            <i className="fas fa-arrow-left" aria-hidden="true"></i>
            <span className="tfe-backnav-header__label">Back</span>
        </button>
    );
}
