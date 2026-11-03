import React from 'react';
import { createPortal } from 'react-dom';
import { Link, usePage } from '@inertiajs/react';
import { openTripPlanner } from '@/lib/tripPlanner';
import '../../css/public-tabbar.css';

/**
 * Labelled bottom tab bar for public pages below lg (UX review, 2 Nov 2026,
 * plan item B4). Reviewers said first-time visitors don't think to open the
 * hamburger, so the four things a visitor comes to do — plan a trip, find
 * their trips, find a partner, see the tournament — are always one labelled
 * tap away, plus the full menu.
 *
 * Mounted by the public Header, so every page that has the header has the
 * bar and nothing is wired per page. Portalled to <body>: `position: fixed`
 * inside the page tree is measured against `.tfe-page`'s transformed
 * ancestor during the page-enter animation and visibly jumps (the same
 * trap as StepFlow docked / MobileActionBar).
 *
 * Space for it is reserved in CSS with `body:has(.tfe-tabbar)` — page
 * padding, the hero's height, and anything else pinned to the bottom
 * (cookie banner, docked StepFlow) — see public-tabbar.css.
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

    const tournamentHref = tournament?.slug ? route('tournaments.show', tournament.slug) : null;

    const bar = (
        <nav className="tfe-tabbar" aria-label="Quick links">
            <ul className="tfe-tabbar__list">
                <li>
                    <button type="button" className="tfe-tabbar__item tfe-tabbar__item--primary" onClick={() => openTripPlanner()}>
                        <i className="fas fa-plane" aria-hidden="true"></i>
                        <span>Plan a trip</span>
                    </button>
                </li>
                <li>
                    <Link href={account.href} className="tfe-tabbar__item">
                        <i className={account.icon} aria-hidden="true"></i>
                        <span>{account.label}</span>
                    </Link>
                </li>
                <li>
                    <Link
                        href={route('partners.index')}
                        className="tfe-tabbar__item"
                        aria-current={path.startsWith('/partners') ? 'page' : undefined}
                    >
                        <i className="fas fa-handshake" aria-hidden="true"></i>
                        <span>Partners</span>
                    </Link>
                </li>
                {tournamentHref && (
                    <li>
                        <Link
                            href={tournamentHref}
                            className="tfe-tabbar__item"
                            aria-current={path.startsWith('/tournaments/') ? 'page' : undefined}
                        >
                            <i className="fas fa-trophy" aria-hidden="true"></i>
                            <span>{tournament.short_name || 'Tournament'}</span>
                        </Link>
                    </li>
                )}
                <li>
                    <button
                        type="button"
                        className="tfe-tabbar__item"
                        onClick={onToggleMenu}
                        aria-expanded={menuOpen}
                        aria-controls={menuId}
                    >
                        <i className={menuOpen ? 'fas fa-xmark' : 'fas fa-bars'} aria-hidden="true"></i>
                        <span>{menuOpen ? 'Close' : 'Menu'}</span>
                    </button>
                </li>
            </ul>
        </nav>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(bar, document.body);
}
