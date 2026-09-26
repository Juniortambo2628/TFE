import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import AccountSecurity from '@/Components/Common/AccountSecurity';

/**
 * Admin security (Sprint 53). The admin surface had no security page at all —
 * password changes lived on the profile form and there was nowhere to manage
 * 2FA, passkeys or review login history. It renders the same shared
 * AccountSecurity component as the fan and partner dashboards.
 */
export default function Security(props) {
    return (
        <AdminLayout title="Security">
            <AccountSecurity
                {...props}
                role="admin"
                breadcrumbs={[
                    { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
                    { label: 'Security' },
                ]}
                routes={{
                    password: 'admin.security.password',
                    twoFactor: 'admin.security.two-factor',
                    twoFactorConfirm: 'admin.security.two-factor.confirm',
                    notifications: 'admin.security.notifications',
                }}
            />
        </AdminLayout>
    );
}
