import React from 'react';
import { createPortal } from 'react-dom';
import { Link } from '@inertiajs/react';
import ActivityBadge from '@/Components/Common/ActivityBadge';
import '../../../css/public-tabbar.css';

/**
 * The ONE bottom tab bar (phones): the public site's (PublicTabBar) and the
 * dashboard's (AppSidebar, dashboard v2) render through it, so the platform
 * has one app-style navigation pattern to carry into a mobile app.
 *
 * `items`: { key, label, icon, href | onClick, current, primary, badge,
 * expanded, controls }. A link when it has an href, a button otherwise.
 * Portalled to <body> — `position: fixed` inside the page tree is measured
 * against `.tfe-page`'s transformed ancestor during the page-enter
 * animation and visibly jumps (StepFlow docked / MobileActionBar).
 */
export default function TabBar({ items = [], label = 'Quick links', className = '' }) {
    if (typeof document === 'undefined') return null;

    const bar = (
        <nav className={`tfe-tabbar ${className}`.trim()} aria-label={label}>
            <ul className="tfe-tabbar__list">
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
