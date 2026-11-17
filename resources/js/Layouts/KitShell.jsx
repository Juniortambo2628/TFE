import React, { useEffect, useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import { InertiaRouter } from '@okjt/inertia';
import { DashboardProvider, DashboardShell } from '@okjt/dashboard';
import { Toaster } from '@/Components/ui/sonner';
import CommandMenu from '@/Components/CommandMenu';
import Footer from '@/Components/Footer';
import HeaderBack from '@/Components/Common/HeaderBack';
import HeaderUserCluster from '@/Components/Common/HeaderUserCluster';
import PageTransition from '@/Components/Common/PageTransition';
import PageToolbar from '@/Components/Common/DashboardV2/PageToolbar';
import { ActiveNavProvider, ToolbarProvider, useActiveNav } from './DashboardV2';
import { ShellProvider } from './ShellContext';
import { activeMenuItem, dashboardTabs } from '@/lib/dashboardTabs';
import { assetPath } from '@/lib/assets';
import '../../css/fan/_shared.css';
import '../../css/fan/dashboard.css';
import '../../css/fan/fan-dashboard-cards.css';
import '../../css/fan/fan-dashboard-header.css';
import '../../css/fan/dashboard-header-extras.css';
import '../../css/fan/dashboard-hero.css';
import '../../css/dashboard-v2.css';
import '../../css/header.css';
import '../../css/kit-shell.css';

/**
 * A TFE role's dashboard in the OKJT kit's shell (kit migration phase 4,
 * docs/proposals/okjt-kit-migration.md): the kit's sidebar, header and phone
 * tab bar around TFE's own pages. One role at a time; institution first.
 *
 * What stays TFE's for now, and why:
 *  - The page content. It sits in `.tfe-dv2` (KitPage), so the pages look as
 *    they did, and moves to the kit's page pieces (AdminPageHero,
 *    AdminSummaryCards, Modal) page by page.
 *  - The page toolbar (PageToolbar): DashboardHero portals a page's actions
 *    into it. It goes when the pages move to AdminPageLayout.
 *  - The skeleton between pages (PageTransition): the kit's pageSkeleton
 *    covers lazy routes; an Inertia visit is a wait it cannot see.
 *  - The bell, envelope and account menu (HeaderUserCluster), and Back.
 *  - The footer, last on every dashboard page.
 *
 * Off: the kit's collaboration (no `api`, so no presence), Share, Version
 * history and the tour; TFE has none of them.
 */

/** A Font Awesome class as the component the kit's sidebar expects. */
const FA_ICONS = new Map();
function faIcon(className) {
    // One component per class, so a re-render never swaps the icon's type.
    if (FA_ICONS.has(className)) return FA_ICONS.get(className);
    function FaIcon({ className: extra = '' }) {
        return <i className={`${className} tfe-kit-fa ${extra}`} aria-hidden="true" />;
    }
    FaIcon.displayName = `FaIcon(${className})`;
    FA_ICONS.set(className, FaIcon);
    return FaIcon;
}

/** The phone menu button's icon, white on the dark header. */
function MenuIcon() {
    return <i className="fas fa-bars tfe-kit-fa text-xl text-white/80" aria-hidden="true" />;
}

/** A route name as the path the kit matches against (no host). */
function pathFor(name) {
    try {
        return new URL(route(name), window.location.origin).pathname;
    } catch {
        return null;
    }
}

/**
 * TFE's menu constants ({ label, icon, route } and `{ heading }` markers) as
 * the kit's `shell.nav` groups. One source: the same constant the old
 * sidebar reads, so the two cannot drift while both exist.
 */
export function navFromMenu(menu) {
    const groups = [{ title: undefined, items: [] }];
    for (const item of menu) {
        if (item.heading) {
            groups.push({ title: item.heading, items: [] });
            continue;
        }
        const path = pathFor(item.route);
        if (!path) continue;
        groups[groups.length - 1].items.push({
            path,
            label: item.label,
            icon: faIcon(item.icon),
            id: `sidebar-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`,
        });
    }
    return groups.filter((g) => g.items.length > 0);
}

/** TFE's tab picks (route names) as the kit's `shell.tabBar.tabs` (paths). */
export function tabsFromMenu(menu, tabs) {
    return dashboardTabs(menu, tabs, '').map((t) => ({
        path: pathFor(t.route),
        label: t.label,
        primary: !!t.primary,
    })).filter((t) => t.path);
}

/**
 * The sidebar item for this page, for DashboardHero's icon and breadcrumb
 * and for Back (the old sidebar published it; the kit's does not).
 */
function ActiveNavSync({ menu }) {
    const { url } = usePage();
    const { setItem } = useActiveNav();
    const active = useMemo(() => activeMenuItem(menu, url), [menu, url]);
    useEffect(() => { setItem(active || null); }, [active, setItem]);
    return null;
}

function RoleBadge({ icon, label }) {
    return (
        <span className="tfe-dv2-header__badge tfe-kit-badge">
            <i className={icon} aria-hidden="true" />
            {label}
        </span>
    );
}

/**
 * Pages built on the kit's own page parts (AdminPageLayout). They do not
 * get TFE's floating PageToolbar: their actions are in the kit's hero. The
 * other pages in the shell still portal their hero actions into it.
 */
const KIT_PAGE_PREFIXES = ['Institution/'];

/** The page under the kit's frame, with TFE's page styles around it. */
function KitPage({ role, children }) {
    const { component } = usePage();
    const onKitPage = KIT_PAGE_PREFIXES.some((p) => component.startsWith(p));
    return (
        <div className="tfe-dv2 tfe-kit-page" data-dashboard="v2" data-role={role}>
            <div className="tfe-dv2__page">
                <ShellProvider>
                    <PageTransition role={role}>{children}</PageTransition>
                </ShellProvider>
            </div>
            <Footer />
            {!onKitPage && <PageToolbar />}
        </div>
    );
}

/**
 * @param {object} props
 * @param {string} props.role        TFE role ('institution', …): data-role, page styles
 * @param {Array}  props.menu        the role's menu constant (INSTITUTION_MENU, …)
 * @param {Array}  props.tabs        the role's tab picks (INSTITUTION_TABS, …)
 * @param {string} props.homeRoute   the role's dashboard route
 * @param {{icon: string, label: string}} props.badge  the header's role badge
 */
export default function KitShell({ role, menu, tabs, homeRoute, badge, children }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const homePath = pathFor(homeRoute) || '/';

    const dashboard = useMemo(() => {
        function HeaderStart() {
            return <KitHeaderStart homeRoute={homeRoute} badge={badge} />;
        }
        function Notifications() {
            return <KitHeaderCluster role={role} />;
        }
        return {
            home: { label: 'Dashboard', path: homePath },
            // A page passes a Font Awesome class ('fas fa-route') wherever the
            // kit takes an icon; the kit's own names fall back to its icons.
            iconFor: (name) => (/^fa[srb]? fa-/.test(name) ? faIcon(name) : null),
            // The kit's look for dark dashboards (Najenga's): pages that use
            // AdminPageLayout / AdminPageHero / AdminSummaryCards get it.
            componentDefaults: {
                PageLayout: { variant: 'bold' },
                PageHero: { variant: 'bold' },
                SummaryCards: { variant: 'bold' },
                EmptyState: { variant: 'card' },
            },
            shell: {
                logo: { src: assetPath('/assets/img/logo/TFE-logo.png'), alt: 'The Football Experience', to: homePath },
                nav: navFromMenu(menu),
                tabBar: tabs?.length ? { tabs: tabsFromMenu(menu, tabs), label: `${badge?.label || 'Dashboard'} tabs` } : false,
                pageSkeleton: true,
                // TFE's frame on the kit's: the sidebar as wide as before,
                // near-black, the current page a light pill.
                sidebarWidth: 272,
                sidebarBackground: '#0f0f12',
                sidebarClass: 'border-r border-white/[0.07]',
                logoClass: 'h-11 w-auto',
                navTitleClass: 'px-3 mb-1 text-xs font-semibold text-white/55',
                navActiveClass: 'bg-white text-[#0b0b0d] font-semibold',
                navIdleClass: 'text-white/70 hover:bg-white/[0.06] hover:text-white',
                background: '#08080a',
                headerBackground: 'rgb(8 8 10 / 0.85)',
                headerBorder: '1px solid rgb(255 255 255 / 0.07)',
                menuButtonClass: 'hover:bg-white/10',
                MenuIcon,
                mainClass: 'min-w-0 overflow-x-clip',
                headerActions: [],
                HeaderStart,
                Notifications,
                // No collaboration API: never render the kit's own panels.
                ShareModal: () => null,
                HistoryDrawer: () => null,
            },
        };
    }, [role, menu, tabs, homeRoute, homePath, badge]);

    return (
        <InertiaRouter>
            <ActiveNavProvider>
                <ToolbarProvider>
                    <ActiveNavSync menu={menu} />
                    <DashboardProvider dashboard={dashboard}>
                        <div className="tfe-kit-shell" data-role={role}>
                            <DashboardShell>
                                <KitPage role={role}>{children}</KitPage>
                            </DashboardShell>
                        </div>
                    </DashboardProvider>
                    <Toaster />
                    <CommandMenu />
                </ToolbarProvider>
            </ActiveNavProvider>
        </InertiaRouter>
    );
}

/** Back (on every page but home) and the role badge, after the menu button. */
function KitHeaderStart({ homeRoute, badge }) {
    const { item } = useActiveNav();
    const onHome = route().current(homeRoute);
    let back = null;
    if (!onHome) {
        const inSection = item?.route && !route().current(item.route) && item.route !== homeRoute;
        back = inSection
            ? <HeaderBack parentHref={route(item.route)} parentLabel={item.label} />
            : <HeaderBack parentHref={route(homeRoute)} parentLabel="Dashboard" />;
    }
    return (
        <div className="tfe-header tfe-kit-header-start">
            <div id="tfe-header-back" className="tfe-header-back">{back}</div>
            {badge && <RoleBadge {...badge} />}
        </div>
    );
}

/** The bell, envelope and account menu, styled as in TFE's own header. */
function KitHeaderCluster({ role }) {
    const { auth } = usePage().props;
    return (
        <div className="tfe-header tfe-header--dashboard tfe-kit-cluster">
            <div className="dashboard-header tfe-dv2-header__cluster" data-role={role}>
                <div className="dashboard-header-actions">
                    <HeaderUserCluster user={auth?.user} role={role} />
                </div>
            </div>
        </div>
    );
}
