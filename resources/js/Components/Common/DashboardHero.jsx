import React from 'react';
import Breadcrumbs from './Breadcrumbs';

const HOME_ROUTE = {
    fan: 'fan.dashboard',
    admin: 'admin.dashboard',
    partner: 'partner.dashboard',
};

/**
 * DashboardHero — single hero card used by every role.
 *
 * All visuals live in resources/css/fan/dashboard-hero.css and are
 * scoped by [data-role]. When a bgImage is provided, the .has-bg class
 * kicks in and the image lands via the --dash-hero-bg-image CSS var
 * (so the gradient can layer on top without inline styles).
 */
export default function DashboardHero({
    title,
    subtitle = '',
    breadcrumbs = [],
    actions = null,
    showBack = false,
    bgImage = null,
    children,
    id = null,
    role = 'fan',
    action = null,
}) {
    const homeRoute = HOME_ROUTE[role] || HOME_ROUTE.fan;
    const styleVars = bgImage ? { '--dash-hero-bg-image': `url(${bgImage})` } : undefined;

    return (
        <div id={id} className="mb-4">
            <Breadcrumbs
                title={title}
                breadcrumbs={breadcrumbs}
                actions={actions}
                showBack={showBack}
                homeRoute={homeRoute}
            />

            <div
                className={`dashboard-hero${bgImage ? ' has-bg' : ''}`}
                data-role={role}
                style={styleVars}
            >
                <div className="dashboard-hero__body">
                    <h1 className="dashboard-hero__title">{title}</h1>
                    {subtitle && <p className="dashboard-hero__subtitle">{subtitle}</p>}
                </div>

                <div className="dashboard-hero__actions">
                    {children}
                    {action && (
                        <button
                            onClick={action.onClick}
                            className={action.variant === 'outline' ? 'btn-admin-outline' : 'btn-admin'}
                        >
                            {action.icon && <i className={action.icon}></i>}
                            {action.label}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
