import React from 'react';
import Header from '@/Components/Header';
import HeaderBack from '@/Components/Common/HeaderBack';
import { useActiveNav } from '@/Layouts/DashboardV2';

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
    school_community: 'Schools & Communities',
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
    // Sprint 62. An entry here is MANDATORY for every role a layout can
    // pass: the lookup below is unguarded, so a missing key is a crash on
    // `config.roleBadge`, not a graceful fallback.
    institution: {
        roleBadge: { label: 'Institution', icon: 'fas fa-school' },
        navLinks: [
            { label: 'Group Trips', icon: 'fas fa-route', route: 'fan.itineraries' },
            { label: 'Learning Hub', icon: 'fas fa-graduation-cap', route: 'learn.index' },
        ],
    },
};

/** Each role's dashboard home: the page Back climbs to, and the one with no Back. */
export const DASHBOARD_HOME_ROUTE = {
    fan: 'fan.dashboard',
    admin: 'admin.dashboard',
    partner: 'partner.dashboard',
    institution: 'institution.dashboard',
};

/**
 * The dashboard's header: THE site header (Components/Header) in its
 * dashboard variant (Nov 2026). This wrapper only decides content: the role
 * badge, and Back.
 *
 * Back shows on every page except the role's home. It retraces this visit,
 * or goes up to the sidebar item the page belongs to (a booking -> Journey),
 * or to the dashboard home from a top-level page (HeaderBack.goBack).
 *
 * Navigation itself lives in the sidebar and, on phones, the bottom tab bar
 * (AppSidebar), so the header has no site links or hamburger here.
 */
export default function DashboardHeader({ role = 'fan', user }) {
    const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.fan;
    const { item } = useActiveNav();
    const homeRoute = DASHBOARD_HOME_ROUTE[role] || DASHBOARD_HOME_ROUTE.fan;
    const onHome = route().current(homeRoute);

    let back = null;
    if (!onHome) {
        // On a sidebar page itself, its parent is home; deeper, it is that page.
        const inSection = item?.route && !route().current(item.route) && item.route !== homeRoute;
        back = inSection
            ? <HeaderBack parentHref={route(item.route)} parentLabel={item.label} />
            : <HeaderBack parentHref={route(homeRoute)} parentLabel="Dashboard" />;
    }

    const badge = config.roleBadge
        ? { icon: config.roleBadge.icon, label: resolveRoleLabel(role, config.roleBadge.label, user) }
        : null;

    return (
        <Header
            variant="dashboard"
            role={role}
            roleBadge={badge}
            back={back}
            homeHref={route(homeRoute)}
        />
    );
}
