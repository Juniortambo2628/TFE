import React from 'react';
import { Link, router } from '@inertiajs/react';
import { navStack, normalizeUrl } from '@/lib/navHistory';
import '../../../css/back-nav.css';

/**
 * BackNav — a Back button and a breadcrumb trail for public pages (UX
 * review, 2 Nov 2026, plan item B5: "when somebody goes two, three steps
 * deep, it's easy for them to go back home or back one step").
 *
 *   <BackNav crumbs={[{ label: 'Partners', href: route('partners.index') },
 *                     { label: profile.display_name }]} />
 *
 * `crumbs` is the trail AFTER Home (Home is always first and always a
 * link); the last crumb is the current page and takes no href. The crumb
 * before it is the page's parent.
 *
 * Back goes one step back through this visit (history.back()) when the
 * previous page was one of ours, and to the parent otherwise — so it never
 * takes someone who arrived from a shared link off the site (lib/navHistory).
 * Going to the parent REPLACES the current entry, so pressing Back again
 * keeps climbing (partner → Partners → Home) instead of bouncing back.
 *
 * Rendered by PageHero (`breadcrumbs` prop, which SectionPageShell passes
 * through) and directly by the partners directory and partner hub, whose
 * heroes are their own.
 */
export default function BackNav({ crumbs = [], className = '' }) {
    const home = { label: 'Home', href: '/' };
    const trail = [home, ...crumbs];
    const parent = trail.length > 1 ? trail[trail.length - 2] : home;

    const goBack = () => {
        if (navStack.canGoBack()) {
            window.history.back();
        } else {
            // Replace, not push: going up to the parent is a step BACK, so the
            // page being left must not be what the next Back returns to.
            const href = parent.href || '/';
            navStack.replaceTop(normalizeUrl(href));
            router.visit(href, { replace: true });
        }
    };

    return (
        <nav className={('tfe-backnav ' + className).trim()} aria-label="Breadcrumb">
            <button type="button" className="tfe-backnav__back" onClick={goBack}>
                <i className="fas fa-arrow-left" aria-hidden="true"></i>
                <span>Back</span>
            </button>
            <ol className="tfe-backnav__trail">
                {trail.map((crumb, i) => {
                    const isCurrent = i === trail.length - 1;
                    const isParent = i === trail.length - 2;
                    const cls = 'tfe-backnav__crumb'
                        + (i === 0 ? ' tfe-backnav__crumb--home' : '')
                        + (isParent ? ' tfe-backnav__crumb--parent' : '')
                        + (isCurrent ? ' tfe-backnav__crumb--current' : '');
                    return (
                        <li key={`${i}-${crumb.label}`} className={cls}>
                            {isCurrent || !crumb.href ? (
                                <span aria-current={isCurrent ? 'page' : undefined}>{crumb.label}</span>
                            ) : (
                                <Link href={crumb.href}>
                                    {i === 0 && <i className="fas fa-house" aria-hidden="true"></i>}
                                    <span>{crumb.label}</span>
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
