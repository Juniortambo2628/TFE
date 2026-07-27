import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import GoogleTranslate from '@/Components/Common/GoogleTranslate';
import { Toaster } from '@/Components/ui/sonner';
import CommandMenu from '@/Components/CommandMenu';
import { SidebarProvider } from '@/Components/ui/sidebar';

/**
 * BaseLayout - Shared layout logic for all user roles (Fan, Admin, Partner)
 * Centralizes SidebarProvider, Toasters, CommandMenu, and metadata.
 */
export default function BaseLayout({ 
    children, 
    title, 
    sidebar: SidebarComponent, 
    header: HeaderComponent,
    user,
    assetUrl,
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
            <Head title={title} />
            
            {/* Global CSS Links — role-specific CSS should be loaded in role layouts */}

            {SidebarComponent && <SidebarComponent user={user} />}

            <main className="flex-1 flex flex-col min-h-svh overflow-auto">
                {HeaderComponent && (
                    <HeaderComponent 
                        user={user} 
                        assetUrl={assetUrl}
                    />
                )}
                <div className="flex-1 p-6" style={{ marginTop: '60px' }}>
                    {children}
                </div>
            </main>

            {/* Global Components — zero-size wrapper keeps them out of flex flow */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, overflow: 'visible', zIndex: 9999, pointerEvents: 'none' }}>
                <div style={{ pointerEvents: 'auto' }}>
                    <GoogleTranslate />
                    {showPrivacyConsent && PrivacyConsent && <PrivacyConsent />}
                    <Toaster />
                    <CommandMenu />
                </div>
            </div>
        </SidebarProvider>
    );
}
