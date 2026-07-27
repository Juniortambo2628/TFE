import React from 'react';
import AppSidebar from '@/Components/Common/AppSidebar';

export default function PartnerSidebar({ user }) {
    const menuItems = [
        { label: 'Dashboard', icon: 'fas fa-home', route: 'partner.dashboard', path: '/partner/dashboard' },
        { label: 'Travel Requests', icon: 'fas fa-suitcase', route: 'partner.requests', path: '/partner/requests' },
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
