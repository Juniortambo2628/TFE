import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';

export default function Header() {
    const { assetUrl } = usePage().props;
    const logo = `${assetUrl}assets/img/logo/TFE-logo.png`;
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <header className="header position-fixed start-0 top-0 w-100 tfe-header" style={{ zIndex: 1000 }}>
            <div className="container">
                <div className="header-wrapper d-flex align-items-center justify-content-between">
                    <div className="logo">
                        <Link href="/" className="logo-white">
                            <img src={logo} alt="TFE Logo" className="img-fluid tfe-logo-img" style={{ maxHeight: '70px' }} />
                        </Link>
                        <Link href="/" className="logo-dark">
                            <img src={logo} alt="TFE Logo" className="img-fluid tfe-logo-img" style={{ maxHeight: '70px' }} />
                        </Link>
                    </div>
                    <div className="d-flex align-items-center gap-4">
                        <Link href={route('login')} className="btn-glass-pill btn-glass-pill-sm d-none d-lg-inline-flex" style={{ background: '#e31b23', borderColor: '#e31b23' }}>
                            <span>Sign In</span>
                            <iconify-icon icon="lucide:arrow-up-right" className="btn-icon"></iconify-icon>
                        </Link>
                        <Link href={route('register')} className="btn-glass-pill btn-glass-pill-sm d-lg-none" style={{ background: '#e31b23', borderColor: '#e31b23' }}>
                            <span>Begin Journey</span>
                            <iconify-icon icon="lucide:arrow-up-right" className="btn-icon"></iconify-icon>
                        </Link>
                        <button 
                            className="navbar-toggler btn-pill-crimson d-none" 
                            type="button" 
                            onClick={toggleMenu}
                            aria-expanded={isMenuOpen}
                            aria-label="Toggle navigation"
                        >
                            <iconify-icon icon="solar:hamburger-menu-line-duotone" className="menu-icon fs-8"></iconify-icon>
                        </button>
                        <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`} id="navbarNav">
                            <ul className="navbar-nav align-items-center justify-content-end flex-grow-1">
                                <li className="nav-item"><a className="nav-link" href="#hero" onClick={() => setIsMenuOpen(false)}>Home</a></li>
                                <li className="nav-item"><a className="nav-link" href="#about" onClick={() => setIsMenuOpen(false)}>About TFE</a></li>
                                <li className="nav-item"><a className="nav-link" href="#features" onClick={() => setIsMenuOpen(false)}>Features</a></li>
                                <li className="nav-item"><a className="nav-link" href="#services" onClick={() => setIsMenuOpen(false)}>Services</a></li>
                                <li className="nav-item"><a className="nav-link" href="#world-cup-news" onClick={() => setIsMenuOpen(false)}>News</a></li>
                                <li className="nav-item"><a className="nav-link" href="#contact" onClick={() => setIsMenuOpen(false)}>Contact</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
