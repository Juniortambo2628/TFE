import React from 'react';
import { usePage } from '@inertiajs/react';
import AdminSidebar from '@/Components/Admin/AdminSidebar';
import DashboardHeader from '@/Components/Common/DashboardHeader';
import { AdminThemeProvider, useAdminTheme } from '@/Contexts/AdminThemeContext';
import BaseLayout from './BaseLayout';
import '../../css/admin-theme.css';

function AdminHeaderWithEditToggle(props) {
    const { editMode, toggleEditMode } = useAdminTheme();

    const extraActions = (
        <button
            onClick={toggleEditMode}
            className={`px-3 py-1 rounded-full text-sm font-semibold transition-all d-flex align-items-center gap-2 ${editMode ? 'bg-primary text-white' : 'text-white'}`}
            style={{
                background: editMode ? '#3b82f6' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${editMode ? '#3b82f6' : '#444'}`,
                cursor: 'pointer',
            }}
        >
            <i className={`fas ${editMode ? 'fa-check' : 'fa-paint-brush'}`}></i>
            {editMode ? 'Finish Customizing' : 'Customize UI'}
        </button>
    );

    return <DashboardHeader role="admin" {...props} extraActions={extraActions} />;
}

export default function AdminLayout({ children, title }) {
    const { assetUrl, auth } = usePage().props;
    const user = auth.user;

    return (
        <AdminThemeProvider>
            <BaseLayout
                title={title ? `${title} | Admin` : 'Admin Dashboard'}
                user={user}
                assetUrl={assetUrl}
                sidebar={AdminSidebar}
                header={(props) => <AdminHeaderWithEditToggle {...props} />}
            >
                {children}
            </BaseLayout>
        </AdminThemeProvider>
    );
}
