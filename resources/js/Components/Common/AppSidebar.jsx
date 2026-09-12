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
                    Item look (padding, radius, gradient active chip)
                    lives in primitives.css so every sidebar has the
                    same rhythm and a repaint only touches tokens. */}
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
                                        <SidebarMenuButton asChild isActive={active} size="lg" className="p-0 h-auto bg-transparent hover:bg-transparent data-[active=true]:bg-transparent">
                                            <Link
                                                id={`sidebar-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                                                href={route(item.route)}
                                                onClick={handleLinkClick}
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
                                        </SidebarMenuButton>
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
