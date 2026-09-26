import React from 'react';
import { Head } from '@inertiajs/react';
import { Toaster } from '@/Components/ui/sonner';
import CommandMenu from '@/Components/CommandMenu';
import { SidebarProvider } from '@/Components/ui/sidebar';
import PageTransition from '@/Components/Common/PageTransition';
import { ShellProvider } from './ShellContext';

/**
 * BaseLayout - Shared layout logic for all user roles (Fan, Admin, Partner)
 * Centralizes SidebarProvider, Toasters, CommandMenu, and metadata.
 *
 * Mounted ONCE per role as the Inertia persistent layout (see app.jsx), so the
 * sidebar, header and providers below survive every in-app navigation and only
 * `{children}` swaps. `ShellProvider` tells the layout each page still renders
 * inside itself to stand down to a passthrough — see ShellContext.
 */
export default function BaseLayout({
    children,
    title,
    sidebar: SidebarComponent,
    header: HeaderComponent,
    user,
    assetUrl,
    role = 'fan',
    showPrivacyConsent = false,
    privacyConsentComponent: PrivacyConsent
}) {
    return (
        <SidebarProvider
            defaultOpen={true}
            style={{
                "--sidebar-width": "260px",
                "--sidebar-width-mobile": "280px",
            }}
        >
            {/* Only when the shell itself carries a title. Pages render their
                own <Head title> through the passthrough layout, and two live
                <Head> titles would fight over the document title. */}
            {title && <Head title={title} />}

            {/* Global CSS Links — role-specific CSS should be loaded in role layouts */}

            {SidebarComponent && <SidebarComponent user={user} />}

            {/* `overflow-x-clip`, not `overflow-auto` (Sprint 56). Any
                `overflow` other than `visible`/`clip` makes this <main> a
                scroll container, and a scroll container is what `position:
                sticky` inside it measures against — but this element grows
                with its content and never scrolls (the document does), so
                every sticky descendant had a scrollport it could never reach
                the edge of and simply never stuck. That silently disabled the
                sticky live-preview pane on every SplitEditorLayout page
                (admin tournaments, the Content CMS, fan/partner profiles) and
                any sticky action bar. `clip` still contains a wide child
                without creating a scroll container, so the horizontal
                protection `overflow-auto` was giving us stays — with
                `min-w-0`, because a flex item's automatic minimum size is
                only ignored for a scroll container, and without it a wide
                child (the partner carousel track on the fan dashboard)
                stretches this element past the viewport. */}
            <main className="flex-1 flex flex-col min-h-svh min-w-0 overflow-x-clip">
                {HeaderComponent && (
                    <HeaderComponent
                        user={user}
                        assetUrl={assetUrl}
                    />
                )}
                <div className="flex-1 p-6" style={{ marginTop: '60px' }}>
                    <ShellProvider>
                        <PageTransition role={role}>{children}</PageTransition>
                    </ShellProvider>
                </div>
            </main>

            {/* Global Components — zero-size wrapper keeps them out of flex flow */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, overflow: 'visible', zIndex: 9999, pointerEvents: 'none' }}>
                <div style={{ pointerEvents: 'auto' }}>
                    {showPrivacyConsent && PrivacyConsent && <PrivacyConsent />}
                    <Toaster />
                    <CommandMenu />
                </div>
            </div>
        </SidebarProvider>
    );
}
