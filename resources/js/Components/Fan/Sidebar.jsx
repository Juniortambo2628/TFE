import React from 'react';
import AppSidebar from '@/Components/Common/AppSidebar';
import { INSTITUTION_MENU } from '@/Components/Institution/Sidebar';

export default function FanSidebar({ user }) {
    // An institution meets the shared planning surfaces (the Budget
    // Calculator, Itineraries, the Match Schedule) on fan routes, which
    // mount the fan shell. Without this it would find a personal fan's nav
    // — Store, Predict, Tribes, Virtual Card — halfway through planning a
    // school trip. One menu definition, imported, so the two cannot drift
    // (Sprint 62).
    const isInstitution = user?.account_type === 'institution';

    const menuItems = isInstitution ? INSTITUTION_MENU : [
        { label: 'Home', icon: 'fas fa-home', route: 'fan.dashboard', path: '/fan/dashboard' },
        { label: 'Profile', icon: 'fas fa-user', route: 'fan.profile', path: '/fan/profile' },
        { label: 'Stories', icon: 'fas fa-circle', route: 'fan.stories', path: '/fan/stories' },
        { label: 'Journey', icon: 'fas fa-suitcase-rolling', route: 'fan.journey', path: '/fan/journey' },
        { label: 'My Itineraries', icon: 'fas fa-map-marked-alt', route: 'fan.itineraries', path: '/fan/itineraries' },
        { label: 'Events', icon: 'fas fa-calendar-alt', route: 'fan.events', path: '/fan/events' },
        { label: 'Match Schedule', icon: 'fas fa-calendar-check', route: 'fan.match-schedule', path: '/fan/match-schedule' },
        { label: 'Tickets', icon: 'fas fa-ticket-alt', route: 'fan.tickets.index', path: '/fan/tickets' },
        { label: 'Messages', icon: 'fas fa-comments', route: 'fan.communication', path: '/fan/communication' },
        { label: 'Financing', icon: 'fas fa-hand-holding-usd', route: 'fan.loan-applications', path: '/fan/loan-applications' },
        { label: 'Virtual Card', icon: 'fas fa-credit-card', route: 'fan.virtual-card', path: '/fan/virtual-card' },
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
            roleLabel={isInstitution ? 'Institution' : 'Fan Member'}
            accentColor={isInstitution ? '#0d9488' : '#e31b23'}
            menuItems={menuItems}
        />
    );
}
