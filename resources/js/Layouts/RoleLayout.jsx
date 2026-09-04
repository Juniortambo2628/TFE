import React from 'react';
import { usePage } from '@inertiajs/react';
import DashboardHeader from '@/Components/Common/DashboardHeader';
import BaseLayout from './BaseLayout';

/**
 * Factory for role-based layouts (Fan, Partner, Admin) — every dashboard
 * surface routes through here so header/hero/sidebar stay in lockstep.
 *
 * @param {Object} config
 * @param {React.Component} config.sidebar - Sidebar component
 * @param {string} config.role - Role string ("fan" | "partner")
 * @param {string[]} config.css - CSS module paths to import
 * @param {React.Component} [config.privacyConsent] - Optional privacy consent component
 */
export default function RoleLayout({ children, title, sidebar: SidebarComponent, role, css = [], privacyConsent: PrivacyConsent }) {
    const { assetUrl, auth } = usePage().props;
    const user = auth.user;

    return (
        <BaseLayout
            title={title}
            user={user}
            assetUrl={assetUrl}
            sidebar={SidebarComponent}
            header={(props) => <DashboardHeader role={role} {...props} />}
            showPrivacyConsent={!!PrivacyConsent}
            privacyConsentComponent={PrivacyConsent}
        >
            {children}
        </BaseLayout>
    );
}
