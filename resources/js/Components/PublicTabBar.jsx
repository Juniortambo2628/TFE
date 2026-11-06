import React from 'react';
import { usePage } from '@inertiajs/react';
import TabBar from '@/Components/Common/TabBar';
import { openTripPlanner } from '@/lib/tripPlanner';

/**
 * Labelled bottom tab bar for public pages below lg (UX review, 2 Nov 2026,
 * plan item B4; tabs revised 6 Nov). Reviewers said first-time visitors
 * don't think to open the hamburger, so what a visitor comes to do is one
 * labelled tap away: Home, Partners, Plan a trip (centre, accent), Contact
 * and Sign in. A signed-in person gets My trips (or their dashboard) and
 * the full menu in place of the last two.
 *
 * Mounted by the public Header, so every page that has the header has the
 * bar and nothing is wired per page. Rendered through the shared TabBar
 * (which the dashboard uses too); space for it is reserved in CSS with
 * `body:has(.tfe-tabbar)` — see public-tabbar.css.
 */
export default function PublicTabBar({ menuOpen = false, onToggleMenu, menuId }) {
    const page = usePage();
    const user = page.props.auth?.user;
    const path = (page.url || '').split('?')[0];
    const isAt = (...prefixes) => prefixes.some((p) => path === p || path.startsWith(`${p}/`));

    // Plan a trip sits in the middle, in the accent colour, for everyone: it
    // is the one action the platform is built around (Nov 2026).
    const home = { key: 'home', label: 'Home', icon: 'fas fa-house', href: '/', current: path === '/' || path === '/v2' };
    const partners = { key: 'partners', label: 'Partners', icon: 'fas fa-handshake', href: route('partners.index'), current: isAt('/partners', '/v2/partners') };
    const plan = { key: 'plan', label: 'Plan a trip', icon: 'fas fa-plane', primary: true, onClick: () => openTripPlanner() };

    // A visitor: the pages that answer "what is this, who is behind it, how
    // do I ask" — then Sign in. The site menu stays in the header.
    const items = !user
        ? [
            home,
            partners,
            plan,
            { key: 'contact', label: 'Contact', icon: 'fas fa-envelope', href: route('contact'), current: isAt('/contact', '/v2/contact') },
            { key: 'signin', label: 'Sign in', icon: 'fas fa-circle-user', href: route('login') },
        ]
        // Signed in: their own place instead of Contact and Sign in, and the
        // full menu. Admins and partners have no trips; theirs is the dashboard.
        : [
            home,
            partners,
            plan,
            user.is_admin
                ? { key: 'account', label: 'Dashboard', icon: 'fas fa-gauge', href: route('admin.dashboard') }
                : user.is_partner
                    ? { key: 'account', label: 'Dashboard', icon: 'fas fa-gauge', href: route('partner.dashboard') }
                    : { key: 'account', label: 'My trips', icon: 'fas fa-suitcase-rolling', href: route('fan.itineraries') },
            {
                key: 'menu',
                label: menuOpen ? 'Close' : 'Menu',
                icon: menuOpen ? 'fas fa-xmark' : 'fas fa-bars',
                onClick: onToggleMenu,
                expanded: menuOpen,
                controls: menuId,
            },
        ];

    return <TabBar items={items} />;
}
