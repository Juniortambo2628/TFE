import React from 'react';
import AppSidebar from '@/Components/Common/AppSidebar';

// Sprint 23 — partner_type-aware label so a finance partner doesn't
// see "Travel Partner" in the sidebar avatar block. Matches the header
// resolver in Common/DashboardHeader.jsx.
const ROLE_LABEL = {
    travel_agent: 'Travel Partner',
    finance_partner: 'Finance Partner',
    airline: 'Airline Partner',
    hotel_provider: 'Hospitality Partner',
    destination: 'Destination Partner',
    club: 'Club Partner',
    federation: 'Federation Partner',
    event_organiser: 'Event Organiser',
    sponsor: 'Sponsor',
};

export default function PartnerSidebar({ user }) {
    const menuItems = [
        { label: 'Dashboard', icon: 'fas fa-home', route: 'partner.dashboard', path: '/partner/dashboard' },
        { label: 'Publish', icon: 'fas fa-tags', route: 'partner.listings.index', path: '/partner/listings' },
        { label: 'Convert', icon: 'fas fa-suitcase', route: 'partner.requests', path: '/partner/requests' },
        { label: 'Measure', icon: 'fas fa-chart-line', route: 'partner.analytics', path: '/partner/analytics' },
        { label: 'Messages', icon: 'fas fa-envelope', route: 'partner.messages', path: '/partner/messages' },
        { label: 'Profile', icon: 'fas fa-user', route: 'partner.profile', path: '/partner/profile' },
        { label: 'Security', icon: 'fas fa-shield-alt', route: 'partner.security', path: '/partner/security' },
    ];

    return (
        <AppSidebar
            user={user}
            roleLabel={ROLE_LABEL[user?.partner_type] || 'Partner'}
            accentColor="#d97706" // amber-600
            menuItems={menuItems}
        />
    );
}
