import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from '@inertiajs/react';
import Breadcrumbs from './Breadcrumbs';
import { assetPath } from '@/lib/assets';
import { TOOLBAR_ID, useActiveNav } from '@/Layouts/DashboardV2';
import useIsPhone from '@/hooks/useIsPhone';

const HOME_ROUTE = {
    fan: 'fan.dashboard',
    admin: 'admin.dashboard',
    partner: 'partner.dashboard',
    institution: 'institution.dashboard',
};

/**
 * DashboardHero — single hero card used by every role.
 *
 * All visuals live in resources/css/fan/dashboard-hero.css and are
 * scoped by [data-role]. When a bgImage is provided, the .has-bg class
 * kicks in and the image lands via the --dash-hero-bg-image CSS var
 * (so the gradient can layer on top without inline styles).
 */
// Every dashboard hero shares the same stadium backdrop unless a caller
// overrides it — same rich look on fan, admin and partner surfaces
// (the role accent still tints the overlay via [data-role] CSS).
const DEFAULT_BG = '/assets/img/fan/backgrounds/stadium_hero.png';

export default function DashboardHero(props) {
    return <DashboardHeroV2 {...props} />;
}

/**
 * The Naoa-style page heading (Layouts/DashboardV2): breadcrumbs, then the
 * page's icon (the sidebar item that was clicked) beside its title and
 * subtitle — no photo banner. Whatever the page put in the hero's action
 * slots (`action`, `actions`, children) goes to the floating toolbar at the
 * bottom of the screen, which is where Naoa keeps every page's actions.
 *
 * Breadcrumbs the page passes start after "Dashboard"; an entry that only
 * repeats the home link (some pages pass one) is dropped.
 */
function DashboardHeroV2({ title, subtitle = '', breadcrumbs = [], actions = null, children, id = null, role = 'fan', action = null, icon }) {
    const { item } = useActiveNav();
    const homeRoute = HOME_ROUTE[role] || HOME_ROUTE.fan;
    const homeHref = route(homeRoute);
    const trail = breadcrumbs.filter((c) => !(c.href && stripOrigin(c.href) === stripOrigin(homeHref)) && c.label !== 'Dashboard' && c.label !== 'Home');
    const isHome = item?.route === homeRoute;
    const pageIcon = icon || item?.icon || 'fas fa-home';

    // Buttons go to the toolbar; anything else a page puts in its heading
    // (status pills, a partner strip, the calculator's running totals) is
    // content and stays here. Sending it all to the toolbar overflowed it.
    const { tools, content } = splitHeroChildren(children);
    const hasTools = Boolean(action || actions || tools.length);

    return (
        <div id={id} className="tfe-dv2-hero">
            {/* `is-top`: only "Dashboard › this page", which a phone hides
                (the tab bar is the way home); deeper trails stay, they are
                the way back. */}
            <nav className={'tfe-dv2-hero__crumbs' + (trail.length <= 1 ? ' is-top' : '')} aria-label="Breadcrumb">
                {isHome && trail.length === 0 ? (
                    <span aria-current="page">Dashboard</span>
                ) : (
                    <>
                        <Link href={homeHref}>Dashboard</Link>
                        {(trail.length ? trail : [{ label: title }]).map((c, i, all) => (
                            <React.Fragment key={`${c.label}-${i}`}>
                                <i className="fas fa-chevron-right" aria-hidden="true"></i>
                                {c.href && i < all.length - 1
                                    ? <Link href={c.href}>{c.label}</Link>
                                    : <span aria-current={i === all.length - 1 ? 'page' : undefined}>{c.label}</span>}
                            </React.Fragment>
                        ))}
                    </>
                )}
            </nav>

            <div className="tfe-dv2-hero__row">
                <span className="tfe-dv2-hero__icon" aria-hidden="true"><i className={pageIcon}></i></span>
                <div className="tfe-dv2-hero__copy">
                    <h1 className="tfe-dv2-hero__title">{title}</h1>
                    {subtitle && <p className="tfe-dv2-hero__subtitle">{subtitle}</p>}
                </div>
            </div>

            {content.length > 0 && <div className="tfe-dv2-hero__extra">{content}</div>}

            {hasTools && (
                <FloatingToolbar>
                    {actions}
                    {tools}
                    {action && (
                        <button type="button" onClick={action.onClick} className="tfe-btn tfe-btn--filled">
                            {action.icon && <i className={action.icon} aria-hidden="true"></i>}
                            {action.label}
                        </button>
                    )}
                </FloatingToolbar>
            )}
        </div>
    );
}

/**
 * The page's actions, in the actions slot of the page toolbar
 * (DashboardV2/PageToolbar). Until the slot is found (first paint) nothing
 * renders, rather than the actions appearing in the heading and jumping.
 *
 * On a phone they stay in the heading instead: a labelled button or a
 * dropdown does not fit a bar that also has to clear the tab bar, and a
 * toolbar wider than the screen covers the page it serves.
 */
function FloatingToolbar({ children }) {
    const phone = useIsPhone();
    const [host, setHost] = useState(null);
    useEffect(() => { if (!phone) setHost(document.getElementById(TOOLBAR_ID)); }, [phone]);
    if (phone) return <div className="tfe-dv2-hero__actions">{children}</div>;
    if (!host) return null;
    return createPortal(children, host);
}

/** A heading child that is an action: a button, a link, or anything styled
 *  as one. Fragments are opened so a conditional group of buttons counts. */
function isAction(el) {
    if (!React.isValidElement(el)) return false;
    if (el.type === 'button' || el.type === Link) return true;
    return /(^|\s)(tfe-btn|btn-admin)/.test(el.props?.className || '');
}

export function splitHeroChildren(children) {
    const flat = [];
    const walk = (nodes) => React.Children.toArray(nodes).forEach((n) => {
        if (React.isValidElement(n) && n.type === React.Fragment) walk(n.props.children);
        else flat.push(n);
    });
    walk(children);
    return { tools: flat.filter(isAction), content: flat.filter((n) => !isAction(n)) };
}

function stripOrigin(href) {
    try { return new URL(href, window.location.origin).pathname; } catch { return href; }
}
