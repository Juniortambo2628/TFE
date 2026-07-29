import React from 'react';
import FanSidebar from '@/Components/Fan/Sidebar';
import DashboardHeader from '@/Components/Common/DashboardHeader';
import PrivacyConsent from '@/Components/Common/PrivacyConsent';
import { usePage } from '@inertiajs/react';
import BaseLayout from './BaseLayout';
import '../../css/fan/dashboard.css';
import '../../css/fan/fan-dashboard-cards.css';
import '../../css/fan/fan-dashboard-header.css';

export default function FanLayout({ children, title }) {
    const { assetUrl, auth } = usePage().props;
    const user = auth.user;

    return (
        <BaseLayout
            title={title}
            user={user}
            assetUrl={assetUrl}
            sidebar={FanSidebar}
            header={(props) => <DashboardHeader role="fan" {...props} />}
            showPrivacyConsent={true}
            privacyConsentComponent={PrivacyConsent}
        >
            {children}
        </BaseLayout>
    );
}
