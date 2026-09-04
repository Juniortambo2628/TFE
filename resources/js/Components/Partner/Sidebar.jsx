import React from 'react';
import AppSidebar from '@/Components/Common/AppSidebar';

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
            roleLabel="Travel Partner"
            accentColor="#d97706" // amber-600
            menuItems={menuItems}
        />
    );
}
