import React from 'react';
import FanLayout from '@/Layouts/FanLayout';
import AccountSecurity from '@/Components/Common/AccountSecurity';

/**
 * Fan security. The whole surface lives in the shared AccountSecurity
 * component (Sprint 53) — the fan, partner and admin pages are the same page
 * with different route names.
 */
export default function Security(props) {
    return (
        <FanLayout title="Security">
            <AccountSecurity
                {...props}
                role="fan"
                breadcrumbs={[{ label: 'Security' }]}
                routes={{
                    password: 'fan.security.password',
                    twoFactor: 'fan.security.two-factor',
                    twoFactorConfirm: 'fan.security.two-factor.confirm',
                    notifications: 'fan.security.notifications',
                }}
            />
        </FanLayout>
    );
}
