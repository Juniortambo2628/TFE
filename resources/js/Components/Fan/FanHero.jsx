import React from 'react';
import DashboardHero from '@/Components/Common/DashboardHero';

/**
 * Fan Hero — thin wrapper around DashboardHero with Fan defaults.
 * Preserved for backward compatibility with all Fan page imports.
 */
export default function FanHero({ title, subtitle, breadcrumbs = [], actions = null, showBack = false, bgImage = null, children, id = null }) {
    return (
        <DashboardHero
            id={id}
            role="fan"
            title={title}
            subtitle={subtitle}
            breadcrumbs={breadcrumbs}
            actions={actions}
            showBack={showBack}
            bgImage={bgImage}
        >
            {children}
        </DashboardHero>
    );
}
