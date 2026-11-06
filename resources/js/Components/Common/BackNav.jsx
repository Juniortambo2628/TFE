import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
 *
 * Always within reach (Nov 2026): once the trail scrolls up out of view, a
 * floating Back button takes its place under the header, and goes again
 * when the trail is back on screen. Portalled to <body> (the page-enter
 * transform trap, as TabBar).
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

    const ref = useRef(null);
    const scrolledPast = useScrolledPast(ref);
    const headerBottom = useHeaderBottom(scrolledPast);

    return (
        <>
        <nav ref={ref} className={('tfe-backnav ' + className).trim()} aria-label="Breadcrumb">
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
        {scrolledPast && typeof document !== 'undefined' && createPortal(
            <button type="button" className="tfe-backnav-float" onClick={goBack} aria-label={`Back to ${parent.label}`} style={{ top: headerBottom + 10 }}>
                <i className="fas fa-arrow-left" aria-hidden="true"></i>
                <span>Back</span>
            </button>,
            document.body,
        )}
        </>
    );
}

/** True once `ref` has scrolled up out of view (not while it is below it). */
function useScrolledPast(ref) {
    const [past, setPast] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el || typeof IntersectionObserver === 'undefined') return undefined;
        // Hidden under the fixed header counts as out of view. The callback
        // fires as the trail crosses that line — its top is still positive
        // then — so "above" is measured against the line, not against 0.
        const HEADER = 80;
        const observer = new IntersectionObserver(
            ([entry]) => setPast(!entry.isIntersecting && entry.boundingClientRect.top < HEADER),
            { rootMargin: `-${HEADER}px 0px 0px 0px` },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [ref]);

    return past;
}

/**
 * Where the fixed header ends, while `active`. Its height differs by page and
 * changes as it switches to its scrolled state, so it is measured rather
 * than assumed — a guess put the button under the header on some pages.
 */
function useHeaderBottom(active) {
    const [bottom, setBottom] = useState(88);

    useEffect(() => {
        if (!active) return undefined;
        let frame = 0;
        const measure = () => {
            frame = 0;
            const header = document.querySelector('.tfe-header');
            const next = header ? Math.round(header.getBoundingClientRect().bottom) : 0;
            setBottom((b) => (b === next ? b : Math.max(0, next)));
        };
        const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
        measure();
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);
        return () => {
            window.removeEventListener('scroll', schedule);
            window.removeEventListener('resize', schedule);
            if (frame) cancelAnimationFrame(frame);
        };
    }, [active]);

    return bottom;
}
