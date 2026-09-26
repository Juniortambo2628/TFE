import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import TournamentSwitcher from '@/Components/Common/TournamentSwitcher';
import HeaderUserCluster from '@/Components/Common/HeaderUserCluster';
import assetPath from '@/lib/assets';
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
    const { assetUrl, auth } = page.props;
    const logo = assetPath((assetUrl || '') + 'assets/img/logo/TFE-logo.png');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const user = auth?.user;

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
            className="header position-fixed start-0 top-0 w-100 tfe-header"
            style={{ zIndex: 1000 }}
            data-role={user?.is_admin ? 'admin' : user?.is_partner ? 'partner' : 'fan'}
        >
            <div className="container">
                <div className="header-wrapper d-flex align-items-center position-relative">
                    <div className="logo">
                        <Link href="/" className="tfe-logo-link">
                            <img src={logo} alt="TFE Logo" className="img-fluid tfe-logo-img" style={{ maxHeight: '70px' }} />
                        </Link>
                    </div>

                    <nav className="tfe-nav d-none d-lg-flex" aria-label="Primary">
                        <ul className="navbar-nav">{renderLinks()}</ul>
                    </nav>

                    <div className="tfe-header-actions d-flex align-items-center gap-3 ms-auto">
                        {switcherVariant && <TournamentSwitcher variant={switcherVariant} />}

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
                            aria-label="Toggle navigation"
                        >
                            <i className={isMenuOpen ? 'fas fa-xmark' : 'fas fa-bars'} aria-hidden="true"></i>
                        </button>
                    </div>

                    <div className={'tfe-mobile-nav d-lg-none' + (isMenuOpen ? ' show' : '')}>
                        <ul className="navbar-nav">{renderLinks()}</ul>
                        {user ? (
                            <div className="mt-3 pt-3 border-top border-secondary d-flex flex-column gap-2">
                                <div className="text-white-50 small">Signed in as {user.name}</div>
                                <Link
                                    href={route(user.is_admin ? 'admin.dashboard' : user.is_partner ? 'partner.dashboard' : 'fan.dashboard')}
                                    className="tfe-btn tfe-btn--filled w-100 justify-content-center"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <i className="fas fa-home"></i> Go to my dashboard
                                </Link>
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="tfe-btn w-100 justify-content-center"
                                >
                                    <i className="fas fa-sign-out-alt"></i> Logout
                                </Link>
                            </div>
                        ) : (
                            <Link href={route('login')} className="tfe-btn tfe-btn--filled w-100 justify-content-center mt-2" onClick={() => setIsMenuOpen(false)}>
                                <span>Sign In</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
