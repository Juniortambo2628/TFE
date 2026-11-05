import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from '@inertiajs/react';
import Breadcrumbs from './Breadcrumbs';
import { assetPath } from '@/lib/assets';
import { TOOLBAR_ID, useActiveNav, useDashboardV2 } from '@/Layouts/DashboardV2';

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
    return useDashboardV2() ? <DashboardHeroV2 {...props} /> : <DashboardHeroV1 {...props} />;
}

function DashboardHeroV1({
    title,
    subtitle = '',
    breadcrumbs = [],
    actions = null,
    showBack = false,
    bgImage = DEFAULT_BG,
    children,
    id = null,
    role = 'fan',
    action = null,
}) {
    const homeRoute = HOME_ROUTE[role] || HOME_ROUTE.fan;
    const styleVars = bgImage ? { '--dash-hero-bg-image': `url(${assetPath(bgImage)})` } : undefined;

    return (
        <div id={id} className="mb-4">
            <Breadcrumbs
                title={title}
                breadcrumbs={breadcrumbs}
                actions={actions}
                showBack={showBack}
                homeRoute={homeRoute}
            />

            <div
                className={`dashboard-hero has-bg`}
                data-role={role}
                style={styleVars}
            >
                <div className="dashboard-hero__body">
                    <h1 className="dashboard-hero__title">{title}</h1>
                    {subtitle && <p className="dashboard-hero__subtitle">{subtitle}</p>}
                </div>

                <div className="dashboard-hero__actions">
                    {children}
                    {action && (
                        <button
                            onClick={action.onClick}
                            className={action.variant === 'outline' ? 'btn-admin-outline' : 'btn-admin'}
                        >
                            {action.icon && <i className={action.icon}></i>}
                            {action.label}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
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

    const hasTools = Boolean(action || actions || React.Children.count(children));

    return (
        <div id={id} className="tfe-dv2-hero">
            <nav className="tfe-dv2-hero__crumbs" aria-label="Breadcrumb">
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

            {hasTools && (
                <FloatingToolbar>
                    {actions}
                    {children}
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
 * The page's actions in the floating toolbar host BaseLayout renders. Until
 * the host is found (first paint) nothing renders, rather than the actions
 * appearing in the heading and jumping.
 */
function FloatingToolbar({ children }) {
    const [host, setHost] = useState(null);
    useEffect(() => { setHost(document.getElementById(TOOLBAR_ID)); }, []);
    if (!host) return null;
    return createPortal(<div className="tfe-dv2-toolbar__bar" role="toolbar" aria-label="Page actions">{children}</div>, host);
}

function stripOrigin(href) {
    try { return new URL(href, window.location.origin).pathname; } catch { return href; }
}
