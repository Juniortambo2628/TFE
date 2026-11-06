import React from 'react';
import { Head } from '@inertiajs/react';
import { Toaster } from '@/Components/ui/sonner';
import CommandMenu from '@/Components/CommandMenu';
import { SidebarProvider } from '@/Components/ui/sidebar';
import PageTransition from '@/Components/Common/PageTransition';
import { ShellProvider } from './ShellContext';
import { ActiveNavProvider, ToolbarProvider } from './DashboardV2';
import PageToolbar from '@/Components/Common/DashboardV2/PageToolbar';
import SidePanel from '@/Components/Common/DashboardV2/SidePanel';
import '../../css/dashboard-v2.css';

/**
 * BaseLayout - Shared layout logic for all user roles (Fan, Admin, Partner)
 * Centralizes SidebarProvider, Toasters, CommandMenu, and metadata.
 *
 * Mounted ONCE per role as the Inertia persistent layout (see app.jsx), so the
 * sidebar, header and providers below survive every in-app navigation and only
 * `{children}` swaps. `ShellProvider` tells the layout each page still renders
 * inside itself to stand down to a passthrough — see ShellContext.
 */
export default function BaseLayout(props) {
    return <BaseLayoutV2 {...props} />;
}

/**
 * The Naoa-style shell (Layouts/DashboardV2): the sidebar runs the full
 * height, the header sits in the content column and sticks, and the page's
 * actions land in the floating toolbar host at the bottom.
 */
function BaseLayoutV2({
    children,
    title,
    sidebar: SidebarComponent,
    header: HeaderComponent,
    user,
    assetUrl,
    role = 'fan',
    showPrivacyConsent = false,
    privacyConsentComponent: PrivacyConsent,
}) {
    return (
        <ActiveNavProvider>
            <ToolbarProvider>
            <SidebarProvider
                defaultOpen={true}
                className="tfe-dv2"
                data-dashboard="v2"
                data-role={role}
                style={{ '--sidebar-width': '272px', '--sidebar-width-mobile': '284px' }}
            >
                {title && <Head title={title} />}
                {SidebarComponent && <SidebarComponent user={user} />}

                {/* overflow-x: clip, never auto/hidden: a scroll container that never
                    scrolls is what every sticky descendant measures against, so
                    nothing inside would stick (Sprint 56). */}
                <main className="tfe-dv2__main">
                    {HeaderComponent && <HeaderComponent user={user} assetUrl={assetUrl} />}
                    {/* The page, with Naoa's side panel beside it on wide
                        screens, and the one page toolbar at the bottom. */}
                    <div className="tfe-dv2__content">
                        <div className="tfe-dv2__page">
                            <ShellProvider>
                                <PageTransition role={role}>{children}</PageTransition>
                            </ShellProvider>
                        </div>
                        <SidePanel />
                    </div>
                    <PageToolbar />
                </main>

                <div style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, overflow: 'visible', zIndex: 9999, pointerEvents: 'none' }}>
                    <div style={{ pointerEvents: 'auto' }}>
                        {showPrivacyConsent && PrivacyConsent && <PrivacyConsent />}
                        <Toaster />
                        <CommandMenu />
                    </div>
                </div>
            </SidebarProvider>
            </ToolbarProvider>
        </ActiveNavProvider>
    );
}
