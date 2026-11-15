import React, { useEffect, useRef, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import TournamentSwitcher from '@/Components/Common/TournamentSwitcher';
import HeaderUserCluster from '@/Components/Common/HeaderUserCluster';
import assetPath from '@/lib/assets';
import TripPlannerDialog from '@/Components/Common/TripPlannerDialog';
import PublicTabBar from '@/Components/PublicTabBar';
import InstallPrompt from '@/Components/Common/InstallPrompt';
import { openTripPlanner } from '@/lib/tripPlanner';
import '../../css/tournament-switcher.css';
import '../../css/fan/dashboard-header-extras.css';
import '../../css/header.css';

/**
 * Public site header. Session-aware since Sprint 48 — a signed-in visitor
 * sees the same notifications / messages / profile cluster the dashboards
 * show; the "Sign In" button only renders for guests.
 */
export default function Header() {
    const page = usePage();
    const { auth } = page.props;
    // Root-relative, not `assetUrl + path`: assetUrl is absolute, so the
    // concatenation produced a double slash and assetPath then left it alone
    // (it treats `//…` as protocol-relative). This is the exact pattern
    // CLAUDE.md forbids.
    const logo = assetPath('/assets/img/logo/TFE-logo.png');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // `?plan=1` opens the trip planner: the installed app's "Plan a trip"
    // shortcut (manifest.webmanifest) lands here. After the dialog has
    // mounted, so its listener is there to hear it.
    useEffect(() => {
        if (new URLSearchParams(window.location.search).get('plan') !== '1') return undefined;
        const t = setTimeout(() => openTripPlanner(), 0);
        return () => clearTimeout(t);
    }, []);
    const user = auth?.user;
    const headerRef = useRef(null);

    // Publishes the header's real height as --tfe-header-h on <html>, so
    // what sticks under it (the "On this page" strip) sits flush against it.
    // The header shrinks once the page scrolls (smaller logo, less padding),
    // and a fixed guess left a gap the page showed through.
    useEffect(() => {
        const header = headerRef.current;
        if (!header || typeof ResizeObserver === 'undefined') return undefined;
        const root = document.documentElement;
        const publish = () => root.style.setProperty('--tfe-header-h', `${Math.round(header.getBoundingClientRect().height)}px`);
        const observer = new ResizeObserver(publish);
        // border-box: the header's padding shrinks on scroll too, which a
        // content-box observer never hears about.
        observer.observe(header, { box: 'border-box' });
        publish();
        return () => {
            observer.disconnect();
            root.style.removeProperty('--tfe-header-h');
        };
    }, []);

    // While the phone menu is open: Escape closes it, and it is sized to
    // stop above the tab bar from where the header actually ends (the
    // header is shorter once the page has scrolled).
    useEffect(() => {
        if (!isMenuOpen) return undefined;
        const header = headerRef.current;
        if (header) {
            header.style.setProperty('--tfe-mobile-nav-top', `${Math.round(header.getBoundingClientRect().bottom) + 8}px`);
        }
        const onKey = (e) => { if (e.key === 'Escape') setIsMenuOpen(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isMenuOpen]);

    const switcherVariant = page.component === 'Home'
        ? 'landing'
        : page.component === 'Tournaments/Show'
            ? 'tournament'
            : null;

    const navLinks = [
        { label: 'About', href: route('about') },
        { label: 'Features', href: route('features') },
        { label: 'Services', href: route('services') },
        { label: 'News', href: route('news') },
        { label: 'Contact', href: route('contact') },
        { label: 'Partners', href: route('partners.index') },
    ];

    // The phone menu: the same pages plus Learn and Tribes, each with an icon.
    const menuLinks = [
        { label: 'About', href: route('about'), icon: 'fa-circle-info' },
        { label: 'Features', href: route('features'), icon: 'fa-star' },
        { label: 'Services', href: route('services'), icon: 'fa-briefcase' },
        { label: 'News', href: route('news'), icon: 'fa-newspaper' },
        { label: 'Learn', href: route('learn.index'), icon: 'fa-graduation-cap' },
        { label: 'Tribes', href: route('community.tribes'), icon: 'fa-users' },
        { label: 'Partners', href: route('partners.index'), icon: 'fa-handshake' },
        { label: 'Contact', href: route('contact'), icon: 'fa-envelope' },
    ];

    const renderLinks = () =>
        navLinks.map((link) => (
            <li key={link.href} className="nav-item">
                <Link className="nav-link" href={link.href} onClick={() => setIsMenuOpen(false)}>
                    {link.label}
                </Link>
            </li>
        ));

    return (
        <header
            ref={headerRef}
            className="header position-fixed start-0 top-0 w-100 tfe-header"
            style={{ zIndex: 1000 }}
            data-role={user?.is_admin ? 'admin' : user?.is_partner ? 'partner' : 'fan'}
        >
            <div className="container">
                <div className="header-wrapper d-flex align-items-center position-relative">
                    {/* BackNav portals its Back button in here once the
                        page's breadcrumb has scrolled away (HEADER_BACK_SLOT).
                        Empty otherwise; while it is filled the logo moves to
                        the centre on phones and tablets (header.css). */}
                    <div id="tfe-header-back" className="tfe-header-back"></div>
                    <div className="logo">
                        <Link href="/" className="tfe-logo-link">
                            <img src={logo} alt="The Football Experience" className="tfe-logo-img" />
                        </Link>
                    </div>

                    <nav className="tfe-nav d-none d-lg-flex" aria-label="Primary">
                        <ul className="navbar-nav">{renderLinks()}</ul>
                    </nav>

                    <div className="tfe-header-actions d-flex align-items-center gap-3 ms-auto">
                        {switcherVariant && <TournamentSwitcher variant={switcherVariant} />}

                        <button type="button" className="tfe-btn d-none d-md-inline-flex" onClick={() => openTripPlanner()}>
                            <i className="fas fa-plane" aria-hidden="true"></i>
                            <span>Plan my trip</span>
                        </button>

                        {user ? (
                            <div className="d-none d-lg-flex align-items-center gap-2">
                                <HeaderUserCluster user={user} />
                            </div>
                        ) : (
                            <Link href={route('login')} className="tfe-btn tfe-btn--filled d-none d-lg-inline-flex">
                                <span>Sign In</span>
                                <iconify-icon icon="lucide:arrow-up-right" />
                            </Link>
                        )}

                        <button
                            className="navbar-toggler tfe-nav-toggler d-lg-none"
                            type="button"
                            onClick={() => setIsMenuOpen((v) => !v)}
                            aria-expanded={isMenuOpen}
                            aria-controls="tfe-mobile-nav"
                            aria-label="Menu"
                        >
                            <i className={isMenuOpen ? 'fas fa-xmark' : 'fas fa-bars'} aria-hidden="true"></i>
                        </button>
                    </div>

                    <div id="tfe-mobile-nav" className={'tfe-mobile-nav d-lg-none' + (isMenuOpen ? ' show' : '')}>
                        {/* Phones/tablets. The bottom tab bar already carries
                            Home, Partners, Plan a trip and Sign in / My trips,
                            so this is the rest of the site as a tile grid,
                            then the account. Learn and Tribes are only
                            reachable from here on a phone. */}
                        <p className="tfe-mobile-nav__label">Explore</p>
                        <ul className="tfe-mobile-nav__grid">
                            {menuLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        className="tfe-mobile-nav__tile"
                                        href={link.href}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <i className={`fas ${link.icon}`} aria-hidden="true"></i>
                                        <span>{link.label}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        <div className="tfe-mobile-nav__account">
                            {user ? (
                                <>
                                    <div className="tfe-mobile-nav__who">
                                        <span className="tfe-mobile-nav__avatar" aria-hidden="true">
                                            {(user.name || '?').trim().charAt(0).toUpperCase()}
                                        </span>
                                        <span className="tfe-mobile-nav__who-text">
                                            <small>Signed in as</small>
                                            <strong>{user.name}</strong>
                                        </span>
                                    </div>
                                    <div className="tfe-mobile-nav__actions">
                                        <Link
                                            href={route(user.is_admin ? 'admin.dashboard' : user.is_partner ? 'partner.dashboard' : 'fan.dashboard')}
                                            className="tfe-btn tfe-btn--filled"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <i className="fas fa-house" aria-hidden="true"></i> Dashboard
                                        </Link>
                                        <Link href={route('logout')} method="post" as="button" className="tfe-btn">
                                            <i className="fas fa-right-from-bracket" aria-hidden="true"></i> Log out
                                        </Link>
                                    </div>
                                </>
                            ) : (
                                <div className="tfe-mobile-nav__actions">
                                    <Link href={route('login')} className="tfe-btn tfe-btn--filled" onClick={() => setIsMenuOpen(false)}>
                                        <i className="fas fa-right-to-bracket" aria-hidden="true"></i> Sign in
                                    </Link>
                                    <Link href={route('register')} className="tfe-btn" onClick={() => setIsMenuOpen(false)}>
                                        <i className="fas fa-user-plus" aria-hidden="true"></i> Create account
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Mounted once here so every public page shares one planner;
                any CTA opens it with openTripPlanner() (Sprint 64). */}
            <TripPlannerDialog />
            {/* Phones/tablets: labelled shortcuts at the bottom of every
                public page (portalled to <body>; hidden from lg up). */}
            <PublicTabBar
                menuOpen={isMenuOpen}
                onToggleMenu={() => setIsMenuOpen((v) => !v)}
                menuId="tfe-mobile-nav"
            />
            <InstallPrompt />
        </header>
    );
}
