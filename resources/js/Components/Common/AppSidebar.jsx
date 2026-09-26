import React, { useEffect, useMemo, useState } from 'react';
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

/**
 * AppSidebar - Generic sidebar engine for the TFE platform.
 * Configured via props to support Fan, Admin, and Partner roles.
 */
export default function AppSidebar({ 
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
                current = { heading: item.heading, items: [] };
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
            initial[g.heading] = stored ? !!stored[g.heading] : g.heading === activeHeading;
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

    const renderItem = (item) => {
        const active = isUrlActive(item.path);
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
                    {active && showActiveDot && (
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
                                return (
                                    <div key={group.heading} className="tfe-sidebar-group">
                                        <button
                                            type="button"
                                            className={`tfe-sidebar-group__toggle${hasActive ? ' has-active' : ''}`}
                                            aria-expanded={isOpen}
                                            onClick={() => toggleGroup(group.heading)}
                                        >
                                            <span>{group.heading}</span>
                                            <i
                                                className={`fas fa-chevron-down tfe-sidebar-group__chevron${isOpen ? ' is-open' : ''}`}
                                                aria-hidden="true"
                                            />
                                        </button>
                                        {isOpen && (
                                            <div className="tfe-sidebar-group__body">
                                                {group.items.map(renderItem)}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
