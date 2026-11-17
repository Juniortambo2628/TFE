import React from 'react';
import AppSidebar from '@/Components/Common/AppSidebar';

// Sprint 23 — partner_type-aware label so a finance partner doesn't
// see "Travel Partner" in the sidebar avatar block. Matches the header
// resolver in Common/DashboardHeader.jsx.
export const PARTNER_ROLE_LABEL = {
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

/**
 * A partner's menu. Exported as data as well as drawn here, because the
 * partner dashboard runs in the OKJT kit's shell (Layouts/PartnerKitShell),
 * which reads the same list: one definition, nothing to drift. A ticketing
 * partner sells seats, so Tickets / Sales replace Publish / Convert.
 */
export function partnerMenu(user) {
    const isTicketing = user?.partner_type === 'ticketing_partner';
    return [
        { label: 'Dashboard', icon: 'fas fa-home', route: 'partner.dashboard', path: '/partner/dashboard' },
        isTicketing
            ? { label: 'Tickets', icon: 'fas fa-ticket-alt', route: 'partner.tickets.index', path: '/partner/tickets' }
            : { label: 'Publish', icon: 'fas fa-tags', route: 'partner.listings.index', path: '/partner/listings' },
        isTicketing
            ? { label: 'Sales', icon: 'fas fa-cash-register', route: 'partner.tickets.sales', path: '/partner/tickets/sales' }
            : { label: 'Convert', icon: 'fas fa-suitcase', route: 'partner.requests', path: '/partner/requests' },
        { label: 'Measure', icon: 'fas fa-chart-line', route: 'partner.analytics', path: '/partner/analytics' },
        { label: 'Messages', icon: 'fas fa-envelope', route: 'partner.messages', path: '/partner/messages' },
        { label: 'Profile', icon: 'fas fa-user', route: 'partner.profile', path: '/partner/profile' },
        { label: 'Security', icon: 'fas fa-shield-alt', route: 'partner.security', path: '/partner/security' },
    ];
}

/** The partner's bottom tabs on phones, picked from the menu (a route not in it is skipped). */
export const PARTNER_TABS = ['partner.dashboard', 'partner.listings.index', 'partner.tickets.index', 'partner.requests', 'partner.tickets.sales', 'partner.messages'];

export default function PartnerSidebar({ user }) {
    return (
        <AppSidebar
            user={user}
            roleLabel={PARTNER_ROLE_LABEL[user?.partner_type] || 'Partner'}
            accentColor="#d97706" // amber-600
            menuItems={partnerMenu(user)}
            tabs={PARTNER_TABS}
        />
    );
}
