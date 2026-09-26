import React from 'react';
import PartnerLayout from '@/Layouts/PartnerLayout';
import AccountSecurity from '@/Components/Common/AccountSecurity';

/**
 * Partner security. Was a hand-rolled copy of the fan page that had drifted
 * badly — browser confirm() prompts, a password form posting to the profile
 * endpoint, and 2FA/passkey buttons bound to route names that never existed.
 * It renders the shared AccountSecurity component now (Sprint 53).
 */
export default function Security(props) {
    return (
        <PartnerLayout title="Security">
            <AccountSecurity
                {...props}
                role="partner"
                breadcrumbs={[
                    { label: 'Partner', icon: 'fas fa-home', href: route('partner.dashboard') },
                    { label: 'Security' },
                ]}
                routes={{
                    password: 'partner.security.password',
                    twoFactor: 'partner.security.two-factor',
                    twoFactorConfirm: 'partner.security.two-factor.confirm',
                    notifications: 'partner.security.notifications',
                }}
            />
        </PartnerLayout>
    );
}
