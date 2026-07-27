import React from 'react';
import { Link } from '@inertiajs/react';

export default function Footer() {
    return (
        <footer className="footer bg-dark py-5 py-lg-11 py-xl-12">
            <div className="container">
                <div className="row">
                    <div className="col-xl-5 mb-8 mb-xl-0">
                        <div className="d-flex flex-column gap-8 pe-xl-5">
                            <h2 className="mb-0 text-white">Ready to start your World Cup journey?</h2>
                            <div className="d-flex flex-column gap-2">
                                <a href="mailto:info@wctfe.com" className="link-hover hstack gap-3 text-white fs-5">
                                    <iconify-icon icon="lucide:mail" className="fs-7 text-primary"></iconify-icon>
                                    info@wctfe.com
                                </a>
                                <a href="tel:+1-212-456-7890" className="link-hover hstack gap-3 text-white fs-5">
                                    <iconify-icon icon="lucide:phone" className="fs-7 text-primary"></iconify-icon>
                                    +1-212-456-7890
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4 col-xl-2 mb-8 mb-xl-0">
                        <ul className="footer-menu list-unstyled mb-0 d-flex flex-column gap-2">
                            <li><a className="link-hover fs-5 text-white" href="#hero">Home</a></li>
                            <li><a className="link-hover fs-5 text-white" href="#about">About</a></li>
                            <li><a className="link-hover fs-5 text-white" href="#features">Features</a></li>
                            <li><a className="link-hover fs-5 text-white" href="#services">Services</a></li>
                            <li><a className="link-hover fs-5 text-white" href="#world-cup-news">News</a></li>
                            <li><a className="link-hover fs-5 text-white" href="#contact">Contact</a></li>
                        </ul>
                    </div>
                        <div className="col-md-4 col-xl-2 mb-8 mb-xl-0">
                        <ul className="footer-menu list-unstyled mb-0 d-flex flex-column gap-2">
                            <li><Link className="link-hover fs-5 text-white" href={route('login')}>Sign In</Link></li>
                            <li><Link className="link-hover fs-5 text-white" href={route('register')}>Sign Up</Link></li>
                        </ul>
                    </div>
                    <div className="col-md-4 col-xl-3 mb-8 mb-xl-0">
                        <p className="mb-0 text-white text-opacity-70 text-md-end">© The Football Experience 2025</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
