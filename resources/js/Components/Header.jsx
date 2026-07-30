import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import TournamentSwitcher from '@/Components/Common/TournamentSwitcher';
import '../../css/tournament-switcher.css';

export default function Header() {
    var pageProps = usePage().props;
    var assetUrl = pageProps.assetUrl;
    var logo = assetUrl + 'assets/img/logo/TFE-logo.png';
    var menuState = useState(false);
    var isMenuOpen = menuState[0];
    var setIsMenuOpen = menuState[1];

    var toggleMenu = function () {
        setIsMenuOpen(!isMenuOpen);
    };

    var navLinks = [
        { label: 'Home', href: '#hero' },
        { label: 'About TFE', href: '#about' },
        { label: 'Features', href: '#features' },
        { label: 'Services', href: '#services' },
        { label: 'News', href: '#news' },
        { label: 'Contact', href: '#contact' },
    ];

    return React.createElement('header', {
        className: 'header position-fixed start-0 top-0 w-100 tfe-header',
        style: { zIndex: 1000 },
    },
        React.createElement('div', { className: 'container' },
            React.createElement('div', { className: 'header-wrapper d-flex align-items-center justify-content-between' },
                React.createElement('div', { className: 'logo' },
                    React.createElement(Link, { href: '/', className: 'logo-white' },
                        React.createElement('img', { src: logo, alt: 'TFE Logo', className: 'img-fluid tfe-logo-img', style: { maxHeight: '70px' } })
                    ),
                    React.createElement(Link, { href: '/', className: 'logo-dark' },
                        React.createElement('img', { src: logo, alt: 'TFE Logo', className: 'img-fluid tfe-logo-img', style: { maxHeight: '70px' } })
                    )
                ),
                React.createElement('div', { className: 'd-flex align-items-center gap-4' },
                    React.createElement(TournamentSwitcher, null),
                    React.createElement(Link, {
                        href: route('login'),
                        className: 'btn-glass-pill btn-glass-pill-sm d-none d-lg-inline-flex',
                        style: { background: '#e31b23', borderColor: '#e31b23' },
                    },
                        React.createElement('span', null, 'Sign In'),
                        React.createElement('iconify-icon', { icon: 'lucide:arrow-up-right', className: 'btn-icon' })
                    ),
                    React.createElement(Link, {
                        href: route('register'),
                        className: 'btn-glass-pill btn-glass-pill-sm d-lg-none',
                        style: { background: '#e31b23', borderColor: '#e31b23' },
                    },
                        React.createElement('span', null, 'Begin Journey'),
                        React.createElement('iconify-icon', { icon: 'lucide:arrow-up-right', className: 'btn-icon' })
                    ),
                    React.createElement('button', {
                        className: 'navbar-toggler btn-pill-crimson d-none',
                        type: 'button',
                        onClick: toggleMenu,
                        'aria-expanded': isMenuOpen,
                        'aria-label': 'Toggle navigation',
                    },
                        React.createElement('iconify-icon', { icon: 'solar:hamburger-menu-line-duotone', className: 'menu-icon fs-8' })
                    ),
                    React.createElement('div', {
                        className: 'collapse navbar-collapse' + (isMenuOpen ? ' show' : ''),
                        id: 'navbarNav',
                    },
                        React.createElement('ul', { className: 'navbar-nav align-items-center justify-content-end flex-grow-1' },
                            navLinks.map(function (link) {
                                return React.createElement('li', { key: link.href, className: 'nav-item' },
                                    React.createElement('a', {
                                        className: 'nav-link',
                                        href: link.href,
                                        onClick: function () { setIsMenuOpen(false); },
                                    }, link.label)
                                );
                            })
                        )
                    )
                )
            )
        )
    );
}
