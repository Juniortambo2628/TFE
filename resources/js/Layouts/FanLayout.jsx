import React from 'react';
import FanSidebar from '@/Components/Fan/Sidebar';
import PrivacyConsent from '@/Components/Common/PrivacyConsent';
import RoleLayout from './RoleLayout';
import '../../css/fan/_shared.css';
import '../../css/fan/dashboard.css';
import '../../css/fan/fan-dashboard-cards.css';
import '../../css/fan/fan-dashboard-header.css';

export default function FanLayout({ children, title }) {
    return (
        <RoleLayout
            title={title}
            sidebar={FanSidebar}
            role="fan"
            privacyConsent={PrivacyConsent}
        >
            {children}
        </RoleLayout>
    );
}
