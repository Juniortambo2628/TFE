import React from 'react';
import { usePage } from '@inertiajs/react';
import TabBar from '@/Components/Common/TabBar';
import { openTripPlanner } from '@/lib/tripPlanner';

/**
 * Labelled bottom tab bar for public pages below lg (UX review, 2 Nov 2026,
 * plan item B4). Reviewers said first-time visitors don't think to open the
 * hamburger, so the four things a visitor comes to do — plan a trip, find
 * their trips, find a partner, see the tournament — are always one labelled
 * tap away, plus the full menu.
 *
 * Mounted by the public Header, so every page that has the header has the
 * bar and nothing is wired per page. Rendered through the shared TabBar
 * (which the dashboard uses too); space for it is reserved in CSS with
 * `body:has(.tfe-tabbar)` — see public-tabbar.css.
 */
export default function PublicTabBar({ menuOpen = false, onToggleMenu, menuId }) {
    const page = usePage();
    const user = page.props.auth?.user;
    const tournament = page.props.tournament;
    const path = (page.url || '').split('?')[0];

    // "My trips" goes straight to the fan's itineraries. A guest is sent to
    // sign in by the auth middleware, which returns them there afterwards.
    // Admins and partners have no itineraries; their tab is their dashboard.
    const account = user?.is_admin
        ? { href: route('admin.dashboard'), label: 'Dashboard', icon: 'fas fa-gauge' }
        : user?.is_partner
            ? { href: route('partner.dashboard'), label: 'Dashboard', icon: 'fas fa-gauge' }
            : { href: route('fan.itineraries'), label: 'My trips', icon: 'fas fa-suitcase-rolling' };

    const items = [
        { key: 'plan', label: 'Plan a trip', icon: 'fas fa-plane', primary: true, onClick: () => openTripPlanner() },
        { key: 'account', ...account },
        { key: 'partners', label: 'Partners', icon: 'fas fa-handshake', href: route('partners.index'), current: path.startsWith('/partners') },
        tournament?.slug && {
            key: 'tournament',
            label: tournament.short_name || 'Tournament',
            icon: 'fas fa-trophy',
            href: route('tournaments.show', tournament.slug),
            current: path.startsWith('/tournaments/'),
        },
        {
            key: 'menu',
            label: menuOpen ? 'Close' : 'Menu',
            icon: menuOpen ? 'fas fa-xmark' : 'fas fa-bars',
            onClick: onToggleMenu,
            expanded: menuOpen,
            controls: menuId,
        },
    ].filter(Boolean);

    return <TabBar items={items} />;
}
