import React, { useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';

export default function Services() {
    const { assetUrl } = usePage().props;

    useEffect(() => {
        // Init Owl Carousel (Featured Projects)
        const initOwl = () => {
            if (window.$ && window.$.fn.owlCarousel && window.$('.featured-projects-slider .owl-carousel').length) {
                // Destroy previous instance if any to prevent duplication
                window.$('.featured-projects-slider .owl-carousel').trigger('destroy.owl.carousel');
                
                window.$('.featured-projects-slider .owl-carousel').owlCarousel({
                    center: true,
                    loop: true,
                    margin: 30,
                    nav: false,
                    dots: true,
                    autoplay: true,
                    autoplayTimeout: 5000,
                    autoplayHoverPause: true,
                    responsive: {
                        0: { items: 1 },
                        600: { items: 2 },
                        1000: { items: 3 },
                        1200: { items: 4 }
                    }
                });
            }
        };

        const timer = setTimeout(initOwl, 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <section className="services py-5 py-lg-11 py-xl-12 bg-dark" id="services">
            <div className="container">
            <div className="d-flex flex-column gap-5 gap-xl-10">
                <div className="row gap-7 gap-xl-0">
                <div className="col-xl-4 col-xxl-4">
                    <div className="d-flex align-items-center gap-7 py-2" data-aos="fade-right" data-aos-delay="100" data-aos-duration="1000">
                    <span className="round-36 flex-shrink-0 text-white rounded-circle bg-primary hstack justify-content-center fw-medium">03</span>
                    <hr className="border-line bg-white border-opacity-25"/>
                    <span className="badge text-dark bg-primary">Services</span>
                    </div>
                </div>
                <div className="col-xl-8 col-xxl-7">
                    <div className="row">
                    <div className="col-xxl-8">
                        <div className="d-flex flex-column gap-6" data-aos="fade-up" data-aos-delay="100" data-aos-duration="1000">
                        <h2 className="mb-0 text-white fw-bold display-6">What we offer</h2>
                        <p className="fs-5 mb-0 text-white text-opacity-70">Comprehensive solutions to make your World Cup 2026 dream a reality. From flexible financing to complete travel packages.</p>
                        </div>
                    </div>
                    </div>
                </div>
                </div>
                <div className="services-tab">
                <div className="row gap-5 gap-xl-0">
                    <div className="col-xl-4">
                    <div className="tab-content" data-aos="zoom-in" data-aos-delay="100" data-aos-duration="1000">
                        <div className="tab-pane active" id="one" role="tabpanel" aria-labelledby="one-tab" tabIndex="0">
                        <img src={`${assetUrl}assets/img/IMG-12.jpg`} alt="Structured Financing" className="img-fluid" loading="eager"/>
                        </div>
                        <div className="tab-pane" id="two" role="tabpanel" aria-labelledby="two-tab" tabIndex="0">
                        <img src={`${assetUrl}assets/img/backdrops/plane-square.jpg`} alt="Travel Packages" className="img-fluid" loading="lazy"/>
                        </div>
                        <div className="tab-pane" id="three" role="tabpanel" aria-labelledby="three-tab" tabIndex="0">
                        <img src={`${assetUrl}assets/img/IMG-16.jpg`} alt="Match Tickets" className="img-fluid" loading="lazy"/>
                        </div>
                        <div className="tab-pane" id="four" role="tabpanel" aria-labelledby="four-tab" tabIndex="0">
                        <img src={`${assetUrl}assets/img/IMG-18.jpg`} alt="Premium Accommodations" className="img-fluid" loading="lazy"/>
                        </div>
                    </div>
                    </div>
                    <div className="col-xl-8">
                    <div className="d-flex flex-column gap-5">
                        <ul className="nav nav-tabs" id="myTab" role="tablist" data-aos="fade-up" data-aos-delay="200" data-aos-duration="1000">
                        <li className="nav-item py-4 py-lg-8 border-top border-white border-opacity-10 d-flex align-items-center w-100" role="presentation">
                            <div className="row w-100 align-items-center gx-3">
                            <div className="col-lg-6 col-xxl-5">
                                <button className="nav-link fs-10 fw-bold py-1 px-0 border-0 rounded-0 flex-shrink-0 active text-white" id="one-tab" data-bs-toggle="tab" data-bs-target="#one" type="button" role="tab" aria-controls="one" aria-selected="true">Structured Financing</button>
                            </div>
                            <div className="col-lg-6 col-xxl-7">
                                <p className="text-white text-opacity-70 mb-0">Break down World Cup packages into manageable monthly payments over 12-24 months instead of paying upfront.</p>
                            </div>
                            </div>
                        </li>
                        <li className="nav-item py-4 py-lg-8 border-top border-white border-opacity-10 d-flex align-items-center w-100" role="presentation">
                            <div className="row w-100 align-items-center gx-3">
                            <div className="col-lg-6 col-xxl-5">
                                <button className="nav-link fs-10 fw-bold py-1 px-0 border-0 rounded-0 flex-shrink-0 text-white" id="two-tab" data-bs-toggle="tab" data-bs-target="#two" type="button" role="tab" aria-controls="two" aria-selected="false">Travel Packages</button>
                            </div>
                            <div className="col-lg-6 col-xxl-7">
                                <p className="text-white text-opacity-70 mb-0">All-inclusive packages with premium accommodations, flights, transfers, and travel insurance.</p>
                            </div>
                            </div>
                        </li>
                        <li className="nav-item py-4 py-lg-8 border-top border-white border-opacity-10 d-flex align-items-center w-100" role="presentation">
                            <div className="row w-100 align-items-center gx-3">
                            <div className="col-lg-6 col-xxl-5">
                                <button className="nav-link fs-10 fw-bold py-1 px-0 border-0 rounded-0 flex-shrink-0 text-white" id="three-tab" data-bs-toggle="tab" data-bs-target="#three" type="button" role="tab" aria-controls="three" aria-selected="false">Ticketing Guide</button>
                            </div>
                            <div className="col-lg-6 col-xxl-7">
                                <p className="text-white text-opacity-70 mb-0">Stay informed with the latest FIFA ticket sales news. We provide information and direct links to the official portal.</p>
                            </div>
                            </div>
                        </li>
                        <li className="nav-item py-4 py-lg-8 border-top border-white border-opacity-10 d-flex align-items-center w-100" role="presentation">
                            <div className="row w-100 align-items-center gx-3">
                            <div className="col-lg-6 col-xxl-5">
                                <button className="nav-link fs-10 fw-bold py-1 px-0 border-0 rounded-0 flex-shrink-0 text-white" id="four-tab" data-bs-toggle="tab" data-bs-target="#four" type="button" role="tab" aria-controls="four" aria-selected="false">Premium Accommodations</button>
                            </div>
                            <div className="col-lg-6 col-xxl-7">
                                <p className="text-white text-opacity-70 mb-0">4-5 star hotels near stadiums with easy access to match venues and local attractions.</p>
                            </div>
                            </div>
                        </li>
                        </ul>
                        <Link href={route('register')} className="btn-glass-pill mt-4" style={{ background: '#e31b23', borderColor: '#e31b23' }}>
                            <span>Get Started</span>
                            <iconify-icon icon="lucide:arrow-up-right" className="btn-icon"></iconify-icon>
                        </Link>
                    </div>
                    </div>
                </div>
                </div>
            </div>
            </div>
        </section>
    );
}
