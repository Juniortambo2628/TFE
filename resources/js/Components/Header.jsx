import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import TournamentSwitcher from '@/Components/Common/TournamentSwitcher';
import '../../css/tournament-switcher.css';

export default function Header() {
    const { assetUrl } = usePage().props;
    const logo = (assetUrl || '') + 'assets/img/logo/TFE-logo.png';
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navLinks = [
        { label: 'Home', href: '#hero' },
        { label: 'About', href: '#about' },
        { label: 'Features', href: '#features' },
        { label: 'Services', href: '#services' },
        { label: 'Partners', href: route('partners.index') },
        { label: 'News', href: '#news' },
        { label: 'Contact', href: '#contact' },
    ];

    const renderLinks = () =>
        navLinks.map((link) => (
            <li key={link.href} className="nav-item">
                <a className="nav-link" href={link.href} onClick={() => setIsMenuOpen(false)}>
                    {link.label}
                </a>
            </li>
        ));

    return (
        <header className="header position-fixed start-0 top-0 w-100 tfe-header" style={{ zIndex: 1000 }}>
            <div className="container">
                <div className="header-wrapper d-flex align-items-center position-relative">
                    {/* Logo */}
                    <div className="logo">
                        <Link href="/" className="tfe-logo-link">
                            <img src={logo} alt="TFE Logo" className="img-fluid tfe-logo-img" style={{ maxHeight: '70px' }} />
                        </Link>
                    </div>

                    {/* Desktop navigation (centre) */}
                    <nav className="tfe-nav d-none d-lg-flex" aria-label="Primary">
                        <ul className="navbar-nav">{renderLinks()}</ul>
                    </nav>

                    {/* Right cluster: tournament switcher + Sign In + mobile toggler */}
                    <div className="tfe-header-actions d-flex align-items-center gap-3 ms-auto">
                        <TournamentSwitcher />

                        <Link href={route('login')} className="tfe-btn tfe-btn--filled d-none d-lg-inline-flex">
                            <span>Sign In</span>
                            <iconify-icon icon="lucide:arrow-up-right" />
                        </Link>

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

                    {/* Mobile dropdown navigation */}
                    <div className={'tfe-mobile-nav d-lg-none' + (isMenuOpen ? ' show' : '')}>
                        <ul className="navbar-nav">{renderLinks()}</ul>
                        <Link href={route('login')} className="tfe-btn tfe-btn--filled w-100 justify-content-center mt-2" onClick={() => setIsMenuOpen(false)}>
                            <span>Sign In</span>
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}
