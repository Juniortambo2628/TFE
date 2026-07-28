import React from 'react';
import { usePage } from '@inertiajs/react';

export default function Features() {
    const { assetUrl } = usePage().props;

    return (
        <section className="featured-projects py-5 py-lg-11 py-xl-12 bg-dark" id="features">
            <div className="d-flex flex-column gap-5 gap-xl-11">
            <div className="container">
                <div className="row gap-7 gap-xl-0">
                <div className="col-xl-4 col-xxl-4">
                    <div className="d-flex align-items-center gap-7 py-2" data-aos="fade-right" data-aos-delay="100" data-aos-duration="1000">
                    <span className="round-36 flex-shrink-0 text-white rounded-circle bg-primary hstack justify-content-center fw-medium">02</span>
                    <hr className="border-line border-white border-opacity-25"/>
                    <span className="badge text-bg-primary">Features</span>
                    </div>
                </div>
                <div className="col-xl-8 col-xxl-7">
                    <div className="row">
                    <div className="col-xxl-8">
                        <div className="d-flex flex-column gap-6" data-aos="fade-up" data-aos-delay="100" data-aos-duration="1000">
                        <h2 className="mb-0 text-white fw-bold display-6">Core Features</h2>
                        <p className="fs-5 mb-0 text-white text-opacity-70">Structured financing solutions, flexible payment plans, community savings groups, and all-inclusive travel packages designed for African football fans.</p>
                        </div>
                    </div>
                    </div>
                </div>
                </div>
            </div>
            <div className="featured-projects-slider px-3">
                <div className="owl-carousel owl-theme">
                <div className="item">
                    <div className="portfolio d-flex flex-column gap-6">
                    <div className="portfolio-img position-relative overflow-hidden">
                        <img src={`${assetUrl}assets/img/IMG-11.jpg`} alt="Flexible Payment Plans" className="img-fluid" loading="lazy"/>
                        <div className="portfolio-overlay">
                        <a href="#services" className="position-absolute top-50 start-50 translate-middle btn-glass-pill" style={{ padding: '1rem', background: 'rgba(227, 27, 35, 0.4)', borderColor: 'rgba(227, 27, 35, 0.6)' }}>
                            <iconify-icon icon="lucide:arrow-up-right" className="fs-8 text-white"></iconify-icon>
                        </a>
                        </div>
                    </div>
                    <div className="portfolio-details d-flex flex-column gap-3">
                        <h3 className="mb-0 text-white">Flexible Payment Plans</h3>
                        <div className="hstack gap-2">
                        <span className="badge text-dark border bg-primary">12-24 Months</span>
                        <span className="badge text-dark border bg-primary">No Hidden Fees</span>
                        </div>
                    </div>
                    </div>
                </div>
                    <div className="item">
                    <div className="portfolio d-flex flex-column gap-6">
                    <div className="portfolio-img position-relative overflow-hidden">
                        <img src={`${assetUrl}assets/img/backdrops/nigeria-fans.jpg`} alt="Community" className="img-fluid" loading="lazy"/>
                        <div className="portfolio-overlay">
                        <a href="#services" className="position-absolute top-50 start-50 translate-middle btn-glass-pill" style={{ padding: '1rem', background: 'rgba(227, 27, 35, 0.4)', borderColor: 'rgba(227, 27, 35, 0.6)' }}>
                            <iconify-icon icon="lucide:arrow-up-right" className="fs-8 text-white"></iconify-icon>
                        </a>
                        </div>
                    </div>
                    <div className="portfolio-details d-flex flex-column gap-3">
                        <h3 className="mb-0 text-white">Community Savings</h3>
                        <div className="hstack gap-2">
                        <span className="badge text-dark border bg-primary">Group Rates</span>
                        <span className="badge text-dark border bg-primary">Together</span>
                        </div>
                    </div>
                    </div>
                </div>
                    <div className="item">
                    <div className="portfolio d-flex flex-column gap-6">
                    <div className="portfolio-img position-relative overflow-hidden">
                        <img src={`${assetUrl}assets/img/backdrops/plane-square.jpg`} alt="All-Inclusive" className="img-fluid" loading="lazy"/>
                        <div className="portfolio-overlay">
                        <a href="#services" className="position-absolute top-50 start-50 translate-middle btn-glass-pill" style={{ padding: '1rem', background: 'rgba(227, 27, 35, 0.4)', borderColor: 'rgba(227, 27, 35, 0.6)' }}>
                            <iconify-icon icon="lucide:arrow-up-right" className="fs-8 text-white"></iconify-icon>
                        </a>
                        </div>
                    </div>
                    <div className="portfolio-details d-flex flex-column gap-3">
                        <h3 className="mb-0 text-white">All-Inclusive Packages</h3>
                        <div className="hstack gap-2">
                        <span className="badge text-dark border bg-primary">Travel Info</span>
                        <span className="badge text-dark border bg-primary">Travel</span>
                        </div>
                    </div>
                    </div>
                </div>
                <div className="item">
                    <div className="portfolio d-flex flex-column gap-6">
                    <div className="portfolio-img position-relative overflow-hidden">
                        <img src={`${assetUrl}assets/img/IMG-13.jpg`} alt="24/7 Local Support" className="img-fluid" loading="lazy"/>
                        <div className="portfolio-overlay">
                        <a href="#services" className="position-absolute top-50 start-50 translate-middle btn-glass-pill" style={{ padding: '1rem', background: 'rgba(227, 27, 35, 0.4)', borderColor: 'rgba(227, 27, 35, 0.6)' }}>
                            <iconify-icon icon="lucide:arrow-up-right" className="fs-8 text-white"></iconify-icon>
                        </a>
                        </div>
                    </div>
                    <div className="portfolio-details d-flex flex-column gap-3">
                        <h3 className="mb-0 text-white">24/7 Local Support</h3>
                        <div className="hstack gap-2">
                        <span className="badge text-dark border bg-primary">24/7</span>
                        <span className="badge text-dark border bg-primary">Multilingual</span>
                        </div>
                    </div>
                    </div>
                </div>
                </div>
            </div>
            </div>
        </section>
    );
}
