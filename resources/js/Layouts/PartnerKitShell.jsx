import React, { useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import KitShell from './KitShell';
import { PARTNER_ROLE_LABEL, PARTNER_TABS, partnerMenu } from '@/Components/Partner/Sidebar';
import '../../css/partner/dashboard.css';

/**
 * A partner's dashboard on the OKJT kit's shell (kit migration phase 4, the
 * second role moved). The menu and the header badge follow the partner's
 * type: a ticketing partner gets Tickets / Sales, a finance partner reads
 * "Finance Partner".
 */
export default function PartnerKitShell({ children }) {
    const { auth } = usePage().props;
    const type = auth?.user?.partner_type;
    const menu = useMemo(() => partnerMenu({ partner_type: type }), [type]);
    const badge = useMemo(() => ({ icon: 'fas fa-handshake', label: PARTNER_ROLE_LABEL[type] || 'Partner' }), [type]);
    return (
        <KitShell role="partner" menu={menu} tabs={PARTNER_TABS} homeRoute="partner.dashboard" badge={badge}>
            {children}
        </KitShell>
    );
}
