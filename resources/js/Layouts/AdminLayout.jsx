import React from 'react';
import AdminSidebar from '@/Components/Admin/AdminSidebar';
import RoleLayout from './RoleLayout';
// Same CSS stack as FanLayout — single source of truth for header,
// hero, cards, fonts. admin-theme.css only layers admin-specific
// utility classes (btn-admin, admin-card-dark) on top of that base.
import '../../css/fan/_shared.css';
import '../../css/fan/dashboard.css';
import '../../css/fan/fan-dashboard-cards.css';
import '../../css/fan/fan-dashboard-header.css';
import '../../css/fan/dashboard-header-extras.css';
import '../../css/fan/dashboard-hero.css';
import '../../css/admin-theme.css';

/**
 * AdminLayout — now a thin wrapper around RoleLayout so the admin
 * surface renders through the exact same BaseLayout + DashboardHeader
 * as the fan surface. The old AdminThemeProvider + Customize UI toggle
 * were removed in favour of a single source of truth: what the fan sees
 * is what the admin sees, minus the fan nav pills.
 */
export default function AdminLayout({ children, title }) {
    return (
        <RoleLayout
            title={title ? `${title} | Admin` : 'Admin Dashboard'}
            sidebar={AdminSidebar}
            role="admin"
        >
            {children}
        </RoleLayout>
    );
}
