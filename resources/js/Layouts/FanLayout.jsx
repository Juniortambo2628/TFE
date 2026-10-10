import React from 'react';
import FanSidebar from '@/Components/Fan/Sidebar';
import RoleLayout from './RoleLayout';
import '../../css/fan/_shared.css';
import '../../css/fan/dashboard.css';
import '../../css/fan/fan-dashboard-cards.css';
import '../../css/fan/fan-dashboard-header.css';
import '../../css/fan/dashboard-header-extras.css';
import '../../css/fan/dashboard-hero.css';

export default function FanLayout({ children, title }) {
    return (
        <RoleLayout
            title={title}
            sidebar={FanSidebar}
            role="fan"
            // No cookie banner inside the dashboard (Sprint 66): every fan
            // accepted the privacy policy at sign-up, and the banner sat on
            // top of the dashboard on every first visit. Public pages keep it.
        >
            {children}
        </RoleLayout>
    );
}
