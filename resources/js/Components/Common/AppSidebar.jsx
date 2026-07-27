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
            <SidebarHeader className="p-4">
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
                        <div className="text-[10px] uppercase tracking-[0.2em] mt-1 font-bold" style={{ color: accentColor }}>
                            {roleLabel}
                        </div>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent className="no-scrollbar">
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item) => (
                                <SidebarMenuItem
                                    key={item.route}
                                    className={item.mobileOnly ? "md:hidden" : ""}
                                >
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isUrlActive(item.path)}
                                        size="lg"
                                        style={isUrlActive(item.path) ? { 
                                            background: `${accentColor}26`, 
                                            color: accentColor,
                                            borderLeft: `3px solid ${accentColor}`,
                                            borderRadius: 0
                                        } : {}}
                                        className={!isUrlActive(item.path) ? "text-white/70 hover:text-white hover:!bg-white/5" : ""}
                                    >
                                        <Link
                                            id={`sidebar-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                                            href={route(item.route)}
                                            onClick={handleLinkClick}
                                        >
                                            <i className={`${item.icon} w-5 text-center`} style={isUrlActive(item.path) ? { color: accentColor } : {}} />
                                            <span>{item.label}</span>
                                            
                                            {/* Active Indicator (Dot or subtle highlight) */}
                                            {isUrlActive(item.path) && showActiveDot && (
                                                <span
                                                    className="ml-auto"
                                                    style={{
                                                        width: '8px',
                                                        height: '8px',
                                                        backgroundColor: accentColor,
                                                        borderRadius: '50%',
                                                        boxShadow: `0 0 8px ${accentColor}80`,
                                                        display: 'inline-block',
                                                        flexShrink: 0,
                                                    }}
                                                />
                                            )}
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
