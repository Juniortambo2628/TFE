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
import { useActiveNav, useDashboardV2 } from '@/Layouts/DashboardV2';
import { assetPath } from '@/lib/assets';

/**
 * AppSidebar - Generic sidebar engine for the TFE platform.
 * Configured via props to support Fan, Admin, and Partner roles.
 */
export default function AppSidebar(props) {
    return useDashboardV2() ? <AppSidebarV2 {...props} /> : <AppSidebarV1 {...props} />;
}

function AppSidebarV1({ 
    user, 
    roleLabel = 'Member',
    accentColor = '#e31b23', // Default red
    menuItems = [],
    brandingIcon: BrandingIcon,
    showActiveDot = false
}) {
    const { url } = usePage();
    const { isMobile, setOpenMobile } = useSidebar();

    const handleLinkClick = () => {
        if (isMobile) {
            setOpenMobile(false);
        }
    };

    const isUrlActive = (path) => url.startsWith(path);

    // Helper for active styles
    const getActiveStyles = (active) => {
        if (!active) return "text-white/70 hover:text-white hover:!bg-white/5";
        return `!bg-[${accentColor}26] !text-[${accentColor}] border-l-[3px] border-l-[${accentColor}] rounded-l-none`;
    };

    // Fold the flat menuItems (interleaved `{ heading }` markers + links) into
    // groups. Items before the first heading are ungrouped and always shown;
    // each heading becomes a collapsible bucket.
    const groups = useMemo(() => {
        const out = [];
        let current = { heading: null, items: [] };
        out.push(current);
        for (const item of menuItems) {
            if (item.heading) {
                current = { heading: item.heading, defaultOpen: !!item.defaultOpen, items: [] };
                out.push(current);
            } else {
                current.items.push(item);
            }
        }
        return out.filter((g) => g.items.length > 0);
    }, [menuItems]);

    const storageKey = `tfe-sidebar-groups-${roleLabel}`;
    const activeHeading = groups.find((g) => g.heading && g.items.some((it) => isUrlActive(it.path)))?.heading;

    // Open state per heading. Default: only the group holding the active route
    // is open; a persisted choice (localStorage) wins once the user toggles.
    const [open, setOpen] = useState(() => {
        const initial = {};
        let stored = null;
        try { stored = JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch { /* ignore */ }
        for (const g of groups) {
            if (!g.heading) continue;
            // `defaultOpen` on a heading marker opens it until the user chooses (Sprint 66).
            initial[g.heading] = stored ? !!stored[g.heading] : (g.heading === activeHeading || g.defaultOpen);
        }
        return initial;
    });

    // Always keep the active group open (e.g. after navigating into it).
    useEffect(() => {
        if (activeHeading && !open[activeHeading]) {
            setOpen((prev) => ({ ...prev, [activeHeading]: true }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeHeading]);

    const toggleGroup = (heading) => {
        setOpen((prev) => {
            const next = { ...prev, [heading]: !prev[heading] };
            try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* ignore */ }
            return next;
        });
    };

    // New-activity counts by route name (Sprint 70, ActivityBadges).
    const badges = usePage().props.auth?.activityBadges || {};
    // mobileOnly items are hidden at md+ (the top bar carries them there),
    // so a closed group's total must not count what opening it won't show.
    const isDesktop = useMediaQuery('(min-width: 768px)');

    const renderItem = (item) => {
        const active = isUrlActive(item.path);
        const badge = badges[item.route] || 0;
        return (
            <SidebarMenuItem
                key={item.route}
                className={item.mobileOnly ? 'md:hidden' : ''}
            >
                <Link
                    id={`sidebar-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    href={route(item.route)}
                    onClick={handleLinkClick}
                    data-active={active}
                    className={`tfe-sidebar-nav-item${active ? ' is-active' : ''}`}
                >
                    <i className={item.icon} />
                    <span>{item.label}</span>
                    {badge > 0 && <ActivityBadge count={badge} label={item.label} />}
                    {active && showActiveDot && !badge && (
                        <span
                            className="ml-auto"
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: accentColor,
                                boxShadow: `0 0 8px ${accentColor}80`,
                                display: 'inline-block',
                            }}
                        />
                    )}
                </Link>
            </SidebarMenuItem>
        );
    };

    return (
        <Sidebar
            className={`border-r`}
            style={{ borderColor: `${accentColor}4d` }}
        >
            {/* Sprint 32 — sidebar spans inset-y-0 on desktop but the
                fixed 60px header sits on top of it, clipping the avatar.
                Add top padding equal to the header height on desktop
                only (mobile renders as a slide-over so it doesn't need it). */}
            <SidebarHeader className="p-4 md:pt-[76px]">
                <div
                    className="flex flex-col items-center gap-3 rounded-xl p-5"
                    style={{
                        background: `linear-gradient(180deg, ${accentColor}24, rgba(0, 0, 0, 0.2))`,
                        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                    }}
                >
                    <div
                        className="flex items-center justify-center rounded-full text-white text-2xl font-semibold overflow-hidden"
                        style={{
                            width: '64px',
                            height: '64px',
                            background: accentColor,
                            border: '3px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: `0 4px 12px ${accentColor}4d`,
                        }}
                    >
                        {BrandingIcon ? <BrandingIcon /> : (user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.name.charAt(0))}
                    </div>
                    <div className="text-center">
                        <h4 className="m-0 text-white text-base font-semibold leading-tight">{user.name}</h4>
                        <div className="text-[11px] tracking-[0.05em] mt-1 font-semibold" style={{ color: accentColor }}>
                            {roleLabel}
                        </div>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent className="no-scrollbar">
                {/* Sprint 33 — rendered as `.tfe-sidebar-nav-item` pills.
                    Sprint 34 — drop the shadcn SidebarMenuButton wrapper
                    entirely; its cva ships a big Tailwind utility bag
                    (flex, gap, rounded-md, p-2, hover states) that was
                    winning against .tfe-sidebar-nav-item because
                    Tailwind's compiled CSS sits after primitives.css
                    in the cascade. Rendering the Link directly gives
                    our tokens sole ownership of the item's look. */}
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-1 px-2">
                            {groups.map((group, gi) => {
                                // Ungrouped items (before the first heading) render bare.
                                if (!group.heading) {
                                    return (
                                        <React.Fragment key={`ungrouped-${gi}`}>
                                            {group.items.map(renderItem)}
                                        </React.Fragment>
                                    );
                                }
                                const isOpen = !!open[group.heading];
                                const hasActive = group.items.some((it) => isUrlActive(it.path));
                                // A closed group still says there is something inside it.
                                const groupBadge = group.items
                                    .filter((it) => !(isDesktop && it.mobileOnly))
                                    .reduce((n, it) => n + (badges[it.route] || 0), 0);
                                return (
                                    // An <li> holding its own <ul>, so the list stays valid
                                    // markup for screen readers (Sprint 66 a11y pass).
                                    <li key={group.heading} className="tfe-sidebar-group">
                                        <button
                                            type="button"
                                            className={`tfe-sidebar-group__toggle${hasActive ? ' has-active' : ''}`}
                                            aria-expanded={isOpen}
                                            onClick={() => toggleGroup(group.heading)}
                                        >
                                            <span>{group.heading}</span>
                                            {!isOpen && groupBadge > 0 && <ActivityBadge count={groupBadge} label={group.heading} />}
                                            <i
                                                className={`fas fa-chevron-down tfe-sidebar-group__chevron${isOpen ? ' is-open' : ''}`}
                                                aria-hidden="true"
                                            />
                                        </button>
                                        {isOpen && (
                                            <ul className="tfe-sidebar-group__body">
                                                {group.items.map(renderItem)}
                                            </ul>
                                        )}
                                    </li>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}

/**
 * The Naoa-style sidebar (Layouts/DashboardV2): the logo at the top, the
 * role's own menu under plain section titles — every link in view rather
 * than folded into groups — and the current page as a light pill with a dot
 * in the role's colour. Who is signed in moves to the header's account menu.
 * The active item is published so the page heading can open with its icon.
 */
function AppSidebarV2({ user, roleLabel = 'Member', menuItems = [] }) {
    const { url } = usePage();
    const { isMobile, setOpenMobile } = useSidebar();
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
    const active = useMemo(() => {
        const path = url.split('?')[0];
        return menuItems
            .filter((it) => !it.heading && (path === it.path || path.startsWith(`${it.path}/`)))
            .sort((a, b) => b.path.length - a.path.length)[0] || null;
    }, [url, menuItems]);

    useEffect(() => { setItem(active); }, [active, setItem]);

    return (
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
                                {group.items.map((item) => {
                                    const isActive = active?.route === item.route;
                                    const badge = badges[item.route] || 0;
                                    return (
                                        <li key={item.route} className={item.mobileOnly ? 'md:hidden' : ''}>
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
