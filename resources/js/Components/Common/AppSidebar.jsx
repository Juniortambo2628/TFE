import React from 'react';
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
                {/* Brand card: the member's avatar fills the card and fades
                    into the accent gradient (no separate circular avatar).
                    Accent + avatar arrive as CSS vars; all styling in CSS. */}
                <div
                    className="tfe-sidebar-brand"
                    style={{
                        '--sidebar-accent': accentColor,
                        '--sidebar-avatar': user.avatar ? `url(${user.avatar})` : 'none',
                    }}
                >
                    <h4 className="tfe-sidebar-brand__name">{user.name}</h4>
                    <div className="tfe-sidebar-brand__role">{roleLabel}</div>
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
                            {menuItems.map((item) => {
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
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
