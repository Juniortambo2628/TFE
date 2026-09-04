import React from 'react';
import PartnerSidebar from '@/Components/Partner/Sidebar';
import RoleLayout from './RoleLayout';
import '../../css/fan/_shared.css';
import '../../css/fan/dashboard.css';
import '../../css/fan/fan-dashboard-cards.css';
import '../../css/fan/fan-dashboard-header.css';
import '../../css/fan/dashboard-header-extras.css';
import '../../css/fan/dashboard-hero.css';
import '../../css/partner/dashboard.css';

export default function PartnerLayout({ children, title }) {
    return (
        <RoleLayout
            title={title}
            sidebar={PartnerSidebar}
            role="partner"
        >
            {children}
        </RoleLayout>
    );
}
