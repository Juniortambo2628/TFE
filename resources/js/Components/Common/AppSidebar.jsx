import React, { useEffect, useMemo, useState } from 'react';
import ActivityBadge from '@/Components/Common/ActivityBadge';
import { Link, usePage } from '@inertiajs/react';
import {
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    useSidebar,
} from '@/Components/ui/sidebar';
import { useActiveNav } from '@/Layouts/DashboardV2';
import { assetPath } from '@/lib/assets';
import { activeMenuItem, dashboardTabs } from '@/lib/dashboardTabs';
import TabBar from '@/Components/Common/TabBar';

/**
 * AppSidebar - Generic sidebar engine for the TFE platform.
 * Configured via props to support Fan, Admin, and Partner roles.
 */
export default function AppSidebar(props) {
    return <AppSidebarV2 {...props} />;
}

/**
 * The Naoa-style sidebar (Layouts/DashboardV2): the logo at the top, the
 * role's own menu under plain section titles — every link in view rather
 * than folded into groups — and the current page as a light pill with a dot
 * in the role's colour. Who is signed in moves to the header's account menu.
 * The active item is published so the page heading can open with its icon.
 */
function AppSidebarV2({ roleLabel = 'Member', menuItems = [], tabs = [] }) {
    const { url } = usePage();
    const { isMobile, openMobile, setOpenMobile } = useSidebar();
    const { setItem } = useActiveNav();
    const badges = usePage().props.auth?.activityBadges || {};

    const groups = useMemo(() => {
        const out = [{ heading: null, items: [] }];
        for (const item of menuItems) {
            if (item.heading) out.push({ heading: item.heading, items: [] });
            else out[out.length - 1].items.push(item);
        }
        return out.filter((g) => g.items.length > 0);
    }, [menuItems]);

    // The longest matching path wins, so /fan/tickets/purchases lights
    // "Tickets" and /partner/tickets/sales lights "Sales", not both.
    const active = useMemo(() => activeMenuItem(menuItems, url), [url, menuItems]);
    // Published with its sidebar group, so the side panel can offer the
    // pages next to this one (DashboardV2/SidePanel).
    useEffect(() => {
        const group = active && groups.find((g) => g.items.includes(active));
        setItem(active ? { ...active, group: group ? { heading: group.heading, items: group.items } : null } : null);
    }, [active, groups, setItem]);

    // Phones: the role's main destinations as a bottom tab bar, picked from
    // this same menu (lib/dashboardTabs), plus Menu for the rest — the
    // shape a mobile app would have. It replaces the header's hamburger and
    // quick links. CSS shows it only where the sidebar is a slide-over.
    const tabItems = [
        ...dashboardTabs(menuItems, tabs, url).map((t) => ({
            key: t.route,
            label: t.label,
            icon: t.icon,
            href: route(t.route),
            current: t.current,
            primary: t.primary,
            badge: badges[t.route] || 0,
            onClick: () => setOpenMobile(false),
        })),
        {
            key: 'menu',
            label: openMobile ? 'Close' : 'Menu',
            icon: openMobile ? 'fas fa-xmark' : 'fas fa-bars',
            onClick: () => setOpenMobile(!openMobile),
            expanded: openMobile,
        },
    ];

    return (
        <>
            <Sidebar className="tfe-dv2-sidebar">
                <SidebarHeader className="tfe-dv2-sidebar__head">
                    <Link href={route(menuItems.find((it) => !it.heading)?.route || 'fan.dashboard')} className="tfe-dv2-sidebar__logo" aria-label="Dashboard home">
                        <img src={assetPath('/assets/img/logo/TFE-logo.png')} alt="The Football Experience" />
                    </Link>
                    <span className="tfe-dv2-sidebar__role">{roleLabel}</span>
                </SidebarHeader>

                <SidebarContent className="no-scrollbar tfe-dv2-sidebar__body">
                    <nav aria-label={`${roleLabel} navigation`}>
                        {groups.map((group, gi) => (
                            <div key={group.heading || `g-${gi}`} className="tfe-dv2-sidebar__group">
                                {group.heading && <p className="tfe-dv2-sidebar__title">{group.heading}</p>}
                                <ul className="tfe-dv2-sidebar__list">
                                    {/* Every item shows here, `mobileOnly` ones too: the
                                        header no longer carries them as quick links. */}
                                    {group.items.map((item) => {
                                        const isActive = active?.route === item.route;
                                        const badge = badges[item.route] || 0;
                                        return (
                                            <li key={item.route}>
                                                <Link
                                                    id={`sidebar-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                                                    href={route(item.route)}
                                                    onClick={() => { if (isMobile) setOpenMobile(false); }}
                                                    className={'tfe-dv2-nav' + (isActive ? ' is-active' : '')}
                                                    aria-current={isActive ? 'page' : undefined}
                                                >
                                                    <i className={item.icon} aria-hidden="true" />
                                                    <span>{item.label}</span>
                                                    {badge > 0
                                                        ? <ActivityBadge count={badge} label={item.label} />
                                                        : isActive && <span className="tfe-dv2-nav__dot" aria-hidden="true" />}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </nav>
                </SidebarContent>
            </Sidebar>

            {tabs.length > 0 && <TabBar items={tabItems} label={`${roleLabel} tabs`} className="tfe-tabbar--dashboard" />}
        </>
    );
}

function useMediaQuery(query) {
    const get = () => typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false;
    const [matches, setMatches] = useState(get);
    useEffect(() => {
        if (!window.matchMedia) return undefined;
        const mq = window.matchMedia(query);
        const onChange = () => setMatches(mq.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, [query]);
    return matches;
}
