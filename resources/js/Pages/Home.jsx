import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import '../../css/hero-enhancements.css';

// Components
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import Hero from '@/Components/Hero';
import About from '@/Components/About';
import Features from '@/Components/Features';
import Services from '@/Components/Services';
import News from '@/Components/News';
import Contact from '@/Components/Contact';

import Testimonials from '@/Components/Landing/Testimonials';
import TournamentCompare from '@/Components/Landing/TournamentCompare';
import PartnerCarousel from '@/Components/Common/PartnerCarousel';
import HorizontalCardSection from '@/Components/Common/HorizontalCardSection';
import LandingCard from '@/Components/Common/LandingCard';
import LandingModal from '@/Components/Common/LandingModal';
import AdPlaceholder from '@/Components/Common/AdPlaceholder';
import PrivacyConsent from '@/Components/Common/PrivacyConsent';
import { TournamentProvider } from '@/Context/TournamentContext';

const EXPERIENCES = [
    {
        image: 'assets/img/backdrops/plane-square.jpg',
        title: 'Private Yacht Tours',
        subtitle: 'Coastal match-day cruise experiences',
        tags: ['VIP', 'Cruise'],
        description: 'Sail into match day in style. Private charters along the host coastline with onboard hospitality, transfers to the stadium and a skipper who knows the fixtures. Ideal for groups celebrating a milestone trip.',
    },
    {
        image: 'assets/img/backdrops/field-spotlight.jpg',
        title: 'Stadium Pitch Walks',
        subtitle: 'Walk the turf before kick-off',
        tags: ['Pitch Walk', 'Exclusive'],
        description: 'Get closer than the front row. Guided pitch-side access before selected fixtures, with photo opportunities in the tunnel and dugout — a bucket-list moment for any fan.',
    },
    {
        image: 'assets/img/IMG-15.jpg',
        title: 'Luxury Stays',
        subtitle: 'Curated 4-5 star properties',
        tags: ['4-5 Star', 'Luxury'],
        description: 'Hand-picked 4 and 5 star hotels within easy reach of the stadiums, with flexible check-in around kick-off times and rates negotiated for travelling fans.',
    },
    {
        image: 'assets/img/backdrops/argentina-fans.jpg',
        title: 'Fan Meetups',
        subtitle: 'Connect with travelling fans',
        tags: ['Community', 'Meetups'],
        description: 'Find your people. Organised meetups, watch-alongs and supporter marches so you experience the tournament with fellow fans rather than on your own.',
    },
];

export default function Home({ appName }) {
    const [experienceModal, setExperienceModal] = useState(null);

    // Global Initializations
    useEffect(() => {
        // NOTE: AOS (Animate On Scroll) used to be injected here, but nothing
        // on the page carries a data-aos attribute anymore — every landing
        // animation is framer-motion now. Loading AOS just fetched an extra
        // CSS + JS bundle and attached idle scroll/resize listeners for zero
        // effect, so it was removed as dead weight.

        // rAF-throttled + passive so the scroll listener does at most one
        // DOM write per frame instead of firing (and toggling a class)
        // synchronously on every scroll tick — a common jank source.
        let ticking = false;
        let lastFixed = null;
        const applyHeaderState = () => {
            ticking = false;
            const header = document.querySelector('.tfe-header');
            if (!header) return;
            const shouldFix = window.scrollY >= 60;
            if (shouldFix !== lastFixed) {
                lastFixed = shouldFix;
                header.classList.toggle('fixed-header', shouldFix);
            }
        };
        const handleScroll = () => {
            if (!ticking) {
                ticking = true;
                window.requestAnimationFrame(applyHeaderState);
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <TournamentProvider>
            <Head title="Home" />

            <Header />

            <div className="page-wrapper overflow-hidden bg-black text-white">
                <Hero />

                {/* Top Ad Space */}
                <div className="container my-5">
                    <AdPlaceholder position="horizontal" />
              </div>

                <About variant="split" />
                <Features variant="split-reverse" />
                <Services variant="split" />

                {/* Compare-tournaments widget — helps fans pick which one to plan */}
                <TournamentCompare />

                {/* Popular Experiences — stacked variant (title row + cards) */}
                <HorizontalCardSection
                    id="experiences"
                    variant="stacked"
                    theme="light"
                    title="Popular Experiences"
                    headerAction={{ label: 'See All Tours', href: '#contact' }}
                >
                    {EXPERIENCES.map((card) => (
                        <LandingCard
                            key={card.title}
                            image={card.image}
                            title={card.title}
                            subtitle={card.subtitle}
                            tags={card.tags}
                            onClick={setExperienceModal}
                            modalData={{
                                description: card.description,
                                cta: { label: 'Start planning this', href: route('register') },
                            }}
                        />
                    ))}
              </HorizontalCardSection>

                {/* Middle Ad Space */}
                <div className="container my-5">
                    <AdPlaceholder position="horizontal" />
              </div>

                <News variant="split-reverse" />
                <Contact />
                <Testimonials />
                <PartnerCarousel />

                {/* Bottom Ad Space */}
                <div className="container mt-5 mb-0">
                    <AdPlaceholder position="horizontal" />
              </div>

                <Footer />
          </div>
            <LandingModal
                open={experienceModal !== null}
                onClose={() => setExperienceModal(null)}
                data={experienceModal}
            />
            <PrivacyConsent />
       </TournamentProvider>
    );
}
