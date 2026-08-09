import React from 'react';
import { usePage } from '@inertiajs/react';
import PartnerSidebar from '@/Components/Partner/Sidebar';
import DashboardHeader from '@/Components/Common/DashboardHeader';
import BaseLayout from './BaseLayout';
import '../../css/fan/dashboard.css'; // Shared grid layout classes (summary-cards-grid, content-cards-grid)
import '../../css/partner/dashboard.css';

export default function PartnerLayout({ children, title }) {
    const { assetUrl, auth } = usePage().props;
    const user = auth.user;

    return (
        <BaseLayout
            title={title}
            user={user}
            assetUrl={assetUrl}
            sidebar={PartnerSidebar}
            header={(props) => <DashboardHeader role="partner" {...props} />}
        >
            {children}
        </BaseLayout>
    );
}
