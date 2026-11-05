import React, { useMemo } from 'react';
import { Head, usePage } from '@inertiajs/react';
import DashboardHeader from '@/Components/Common/DashboardHeader';
import BaseLayout from './BaseLayout';
import { useInShell } from './ShellContext';

/**
 * Factory for role-based layouts (Fan, Partner, Admin) — every dashboard
 * surface routes through here so header/hero/sidebar stay in lockstep.
 *
 * Runs in one of two modes:
 *
 *  - **Shell mode** (no shell above it): renders the full BaseLayout chrome.
 *    This is what `app.jsx` mounts once, as the page's persistent layout.
 *  - **Passthrough** (a shell is already mounted): renders the page title and
 *    children only. Pages keep their own `<AdminLayout title="…">` wrapper,
 *    but it no longer duplicates — or remounts — the chrome. See ShellContext.
 *
 * @param {Object} config
 * @param {React.Component} config.sidebar - Sidebar component
 * @param {string} config.role - Role string ("fan" | "partner" | "admin")
 * @param {React.Component} [config.privacyConsent] - Optional privacy consent component
 */
export default function RoleLayout({ children, title, sidebar: SidebarComponent, role, privacyConsent: PrivacyConsent }) {
    const { assetUrl, auth } = usePage().props;
    const user = auth.user;
    const inShell = useInShell();

    // One header component per role, kept across renders. An inline
    // `(props) => <DashboardHeader …/>` is a new component TYPE every time
    // this layout re-renders — any prop refresh (a deferred prop arriving, a
    // poll) — so React threw the header away and built a new one, closing
    // whatever menu was open in it a second after it opened.
    const Header = useMemo(() => function RoleHeader(props) {
        return <DashboardHeader role={role} {...props} />;
    }, [role]);

    if (inShell) {
        return (
            <>
                {title && <Head title={title} />}
                {children}
            </>
        );
    }

    return (
        <BaseLayout
            title={title}
            user={user}
            assetUrl={assetUrl}
            sidebar={SidebarComponent}
            header={Header}
            showPrivacyConsent={!!PrivacyConsent}
            privacyConsentComponent={PrivacyConsent}
            role={role}
        >
            {children}
        </BaseLayout>
    );
}
