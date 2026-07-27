import React from 'react';
import AppSidebar from '@/Components/Common/AppSidebar';

export default function FanSidebar({ user }) {
    const menuItems = [
        { label: 'Home', icon: 'fas fa-home', route: 'fan.dashboard', path: '/fan/dashboard' },
        { label: 'Profile', icon: 'fas fa-user', route: 'fan.profile', path: '/fan/profile' },
        { label: 'Stories', icon: 'fas fa-circle', route: 'fan.stories', path: '/fan/stories' },
        { label: 'Journey', icon: 'fas fa-suitcase-rolling', route: 'fan.journey', path: '/fan/journey' },
        { label: 'My Itineraries', icon: 'fas fa-map-marked-alt', route: 'fan.itineraries', path: '/fan/itineraries' },
        { label: 'Events', icon: 'fas fa-calendar-alt', route: 'fan.events', path: '/fan/events' },
        { label: 'Match Schedule', icon: 'fas fa-calendar-check', route: 'fan.match-schedule', path: '/fan/match-schedule' },
        { label: 'Messages', icon: 'fas fa-comments', route: 'fan.communication', path: '/fan/communication' },
        { label: 'Payments', icon: 'fas fa-credit-card', route: 'fan.payments', path: '/fan/payments' },
        { label: 'Security', icon: 'fas fa-shield-alt', route: 'fan.security', path: '/fan/security' },
        { label: 'Contact Support', icon: 'fas fa-headset', route: 'fan.contact', path: '/fan/contact' },
        { label: 'Social', icon: 'fas fa-users', route: 'fan.feed', path: '/fan/feed', mobileOnly: true },
        { label: 'Tribes', icon: 'fas fa-layer-group', route: 'fan.tribes', path: '/fan/tribes', mobileOnly: true },
        { label: 'Store', icon: 'fas fa-tshirt', route: 'fan.store', path: '/fan/store', mobileOnly: true },
        { label: 'Predict', icon: 'fas fa-futbol', route: 'fan.predict-win', path: '/fan/predict-win', mobileOnly: true },
    ];

    return (
        <AppSidebar
            user={user}
            roleLabel="Fan Member"
            accentColor="#e31b23"
            menuItems={menuItems}
        />
    );
}
