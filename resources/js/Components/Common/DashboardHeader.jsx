import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import HeaderUserCluster from '@/Components/Common/HeaderUserCluster';
import { useSidebar } from '@/Components/ui/sidebar';
import FanTournamentSwitcher from '@/Components/Common/TournamentSwitcher';

/**
 * DashboardHeader — one header for every dashboard role.
 *
 * The role only decides content (which nav pills, which role badge,
 * which mark-all-read behaviour); every visual concern — accent
 * colour, spacing, tokens — lives in fan-dashboard-header.css and
 * dashboard-header-extras.css and is scoped via `data-role` on the
 * .dashboard-header element. There are no inline styles.
 */

// Partner badge is contextual: a finance_partner sees "Finance Partner",
// a travel_agent sees "Travel Partner", other types fall back to the
// title-cased partner_type. Non-partner roles keep their base label.
const PARTNER_TYPE_LABEL = {
    travel_agent: 'Travel Partner',
    finance_partner: 'Finance Partner',
    airline: 'Airline Partner',
    hotel_provider: 'Hospitality Partner',
    destination: 'Destination Partner',
    club: 'Club Partner',
    federation: 'Federation Partner',
    event_organiser: 'Event Organiser',
    sponsor: 'Sponsor',
    ticketing_partner: 'Ticketing Partner',
};

function resolveRoleLabel(role, base, user) {
    if (role !== 'partner') return base;
    const type = user?.partner_type;
    return PARTNER_TYPE_LABEL[type] || base;
}

const ROLE_CONFIG = {
    fan: {
        roleBadge: null,
        navLinks: [
            { label: 'Social', icon: 'fas fa-users', route: 'fan.feed' },
            { label: 'Tribes', icon: 'fas fa-layer-group', route: 'fan.tribes' },
            { label: 'Store', icon: 'fas fa-tshirt', route: 'fan.store' },
            { label: 'Predict', icon: 'fas fa-futbol', route: 'fan.predict-win' },
        ],
    },
    admin: {
        roleBadge: { label: 'System Admin', icon: 'fas fa-shield-alt' },
        navLinks: [],
    },
    partner: {
        // Base label — the actual role badge is derived from
        // user.partner_type so finance partners see "Finance Partner"
        // rather than the hard-coded "Travel Partner".
        roleBadge: { label: 'Partner', icon: 'fas fa-handshake' },
        navLinks: [],
    },
};

export default function DashboardHeader({ role = 'fan', user, assetUrl, toggleSidebar }) {
    const config = ROLE_CONFIG[role];
    const { assetUrl: pageAssetUrl } = usePage().props;
    const { toggleSidebar: toggleShadcnSidebar } = useSidebar();
    const baseUrl = assetUrl || pageAssetUrl || '';
    const doToggleSidebar = toggleSidebar || toggleShadcnSidebar;

    return (
        <div className="dashboard-header" data-role={role}>
            <button
                className="dashboard-hamburger"
                id="dashboardHamburger"
                onClick={(e) => { e.stopPropagation(); doToggleSidebar(); }}
                aria-label="Toggle sidebar"
            >
                <i className="fas fa-bars"></i>
            </button>

            <div className="dashboard-title">
                <img src={`${baseUrl}assets/img/logo/TFE-logo.png`} alt="TFE Logo" />
            </div>

            <div className="dashboard-header-nav">
                {config.roleBadge && (
                    <span className="dash-badge">
                        <i className={config.roleBadge.icon}></i>
                        {resolveRoleLabel(role, config.roleBadge.label, user)}
                    </span>
                )}

                {config.navLinks.map((link) => (
                    <Link
                        key={link.route}
                        id={`nav-link-${link.label.toLowerCase()}`}
                        href={route(link.route)}
                        className="dashboard-header-nav__link"
                    >
                        <i className={link.icon}></i>
                        <span>{link.label}</span>
                    </Link>
                ))}
            </div>

            <div className="dashboard-header-actions">
                {role === 'fan' && <FanTournamentSwitcher variant="dashboard" />}

                <HeaderUserCluster user={user} role={role} />
            </div>
        </div>
    );
}
