import React from 'react';
import DashboardHero from '@/Components/Common/DashboardHero';

/**
 * Admin Hero — thin wrapper around DashboardHero with Admin defaults.
 * Preserved for backward compatibility with all Admin page imports.
 */
export default function AdminHero({ title, subtitle = '', breadcrumbs = [], action = null }) {
    return (
        <DashboardHero
            role="admin"
            title={title}
            subtitle={subtitle}
            breadcrumbs={breadcrumbs}
            action={action}
        />
    );
}
