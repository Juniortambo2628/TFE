import React from 'react';
import InstitutionSidebar from '@/Components/Institution/Sidebar';
import RoleLayout from './RoleLayout';
import '../../css/fan/_shared.css';
import '../../css/fan/dashboard.css';
import '../../css/fan/fan-dashboard-cards.css';
import '../../css/fan/fan-dashboard-header.css';
import '../../css/fan/dashboard-header-extras.css';
import '../../css/fan/dashboard-hero.css';

export default function InstitutionLayout({ children, title }) {
    return (
        <RoleLayout
            title={title}
            sidebar={InstitutionSidebar}
            role="institution"
        >
            {children}
        </RoleLayout>
    );
}
