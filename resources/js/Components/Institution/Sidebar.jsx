import React from 'react';
import AppSidebar from '@/Components/Common/AppSidebar';

/**
 * The institution's navigation (Sprint 62).
 *
 * Exported as a plain array as well as a component, because an institution
 * meets this menu in TWO shells: its own group surfaces, and the shared
 * planning surfaces that still live on fan routes (the Budget Calculator,
 * Itineraries, the Match Schedule). `FanSidebar` renders this same list for
 * an institution account, so a school never finds itself looking at Store,
 * Predict and Tribes — a personal fan's nav — halfway through planning a
 * school trip. One definition, two shells, nothing to drift.
 */
export const INSTITUTION_MENU = [
    { label: 'Group Dashboard', icon: 'fas fa-school', route: 'institution.dashboard', path: '/institution/dashboard' },
    { label: 'Plan a Trip', icon: 'fas fa-calculator', route: 'fan.budget-calculator', path: '/fan/budget-calculator' },
    { label: 'Group Trips', icon: 'fas fa-route', route: 'fan.itineraries', path: '/fan/itineraries' },
    { label: 'Match Schedule', icon: 'fas fa-calendar-alt', route: 'fan.match-schedule', path: '/fan/match-schedule' },
    { label: 'Learning Hub', icon: 'fas fa-graduation-cap', route: 'learn.index', path: '/learn' },
    { label: 'Messages', icon: 'fas fa-envelope', route: 'fan.communication', path: '/fan/communication' },
    { label: 'Institution', icon: 'fas fa-building', route: 'institution.profile', path: '/institution/profile' },
    { label: 'Security', icon: 'fas fa-shield-alt', route: 'fan.security', path: '/fan/security' },
];

export default function InstitutionSidebar({ user }) {
    return (
        <AppSidebar
            user={user}
            roleLabel="Institution"
            accentColor="#0d9488"
            menuItems={INSTITUTION_MENU}
        />
    );
}
