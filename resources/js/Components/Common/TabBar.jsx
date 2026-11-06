import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from '@inertiajs/react';
import ActivityBadge from '@/Components/Common/ActivityBadge';
import '../../../css/public-tabbar.css';

/**
 * The ONE bottom tab bar (phones): the public site's (PublicTabBar) and the
 * dashboard's (AppSidebar, dashboard v2) render through it, so the platform
 * has one app-style navigation pattern to carry into a mobile app.
 *
 * Drawn as a floating "liquid glass" pill (Nov 2026, after the iOS 26 /
 * Instagram tab bar): inset from the screen edges, the page showing through
 * it blurred, and a lighter lens behind the current tab that slides when the
 * tab changes. It condenses to icons while the page scrolls down and comes
 * back as soon as it scrolls up, so it takes less of the screen while
 * reading. CSS: public-tabbar.css.
 *
 * `items`: { key, label, icon, href | onClick, current, primary, badge,
 * expanded, controls }. A link when it has an href, a button otherwise.
 * Portalled to <body> — `position: fixed` inside the page tree is measured
 * against `.tfe-page`'s transformed ancestor during the page-enter
 * animation and visibly jumps (StepFlow docked / MobileActionBar).
 */
export default function TabBar({ items = [], label = 'Quick links', className = '' }) {
    const compact = useCompactOnScroll();
    if (typeof document === 'undefined') return null;

    const currentIndex = items.findIndex((it) => it.current);

    const bar = (
        <nav
            className={`tfe-tabbar ${compact ? 'is-compact' : ''} ${className}`.trim()}
            aria-label={label}
            style={{ '--tabbar-n': items.length, '--tabbar-i': Math.max(currentIndex, 0) }}
        >
            <ul className="tfe-tabbar__list">
                {/* The lens behind the current tab; slides, never jumps. */}
                {currentIndex >= 0 && <li className="tfe-tabbar__lens" aria-hidden="true" />}
                {items.map((it) => {
                    const cls = 'tfe-tabbar__item' + (it.primary ? ' tfe-tabbar__item--primary' : '');
                    const body = (
                        <>
                            <i className={it.icon} aria-hidden="true"></i>
                            <span>{it.label}</span>
                            {it.badge > 0 && <ActivityBadge count={it.badge} label={it.label} />}
                        </>
                    );
                    return (
                        <li key={it.key || it.label}>
                            {it.href ? (
                                <Link href={it.href} className={cls} aria-current={it.current ? 'page' : undefined} onClick={it.onClick}>
                                    {body}
                                </Link>
                            ) : (
                                <button type="button" className={cls} onClick={it.onClick} aria-expanded={it.expanded} aria-controls={it.controls}>
                                    {body}
                                </button>
                            )}
                        </li>
                    );
                })}
            </ul>
        </nav>
    );

    return createPortal(bar, document.body);
}

/**
 * True while the page is scrolling down (past the first screenful), false
 * as soon as it scrolls up or nears the top — the iOS tab bar's behaviour.
 * A small dead zone stops it flickering on a slow drag.
 */
function useCompactOnScroll() {
    const [compact, setCompact] = useState(false);

    useEffect(() => {
        let last = window.scrollY;
        let frame = 0;
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (reduce) return undefined;

        const update = () => {
            frame = 0;
            const y = window.scrollY;
            const delta = y - last;
            if (y < 120) setCompact(false);
            else if (delta > 12) setCompact(true);
            else if (delta < -12) setCompact(false);
            if (Math.abs(delta) > 12 || y < 120) last = y;
        };
        const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', onScroll);
            if (frame) cancelAnimationFrame(frame);
        };
    }, []);

    return compact;
}
