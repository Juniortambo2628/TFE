import React, { useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
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
import PartnerCarousel from '@/Components/Common/PartnerCarousel';
import HorizontalCardSection from '@/Components/Common/HorizontalCardSection';
import LandingCard from '@/Components/Common/LandingCard';
import AdPlaceholder from '@/Components/Common/AdPlaceholder';
import PrivacyConsent from '@/Components/Common/PrivacyConsent';
import { TournamentProvider } from '@/Context/TournamentContext';

const EXPERIENCES = [
    {
        image: 'assets/img/backdrops/plane-square.jpg',
        title: 'Private Yacht Tours',
        subtitle: 'Coastal match-day cruise experiences',
        tags: ['VIP', 'Cruise'],
    },
    {
        image: 'assets/img/backdrops/field-spotlight.jpg',
        title: 'Stadium Pitch Walks',
        subtitle: 'Walk the turf before kick-off',
        tags: ['Pitch Walk', 'Exclusive'],
    },
    {
        image: 'assets/img/IMG-15.jpg',
        title: 'Luxury Stays',
        subtitle: 'Curated 4-5 star properties',
        tags: ['4-5 Star', 'Luxury'],
    },
    {
        image: 'assets/img/backdrops/argentina-fans.jpg',
        title: 'Fan Meetups',
        subtitle: 'Connect with travelling fans',
        tags: ['Community', 'Meetups'],
    },
];

export default function Home({ appName, stadiums = [] }) {

    // Global Initializations
    useEffect(() => {
        // Dynamically load AOS (Animate On Scroll) for landing page
        if (!window.AOS) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '/assets/libs/aos.css';
            document.head.appendChild(link);

            const script = document.createElement('script');
            script.src = '/assets/libs/aos.js';
            script.onload = () => {
                if (window.AOS) {
                    window.AOS.init({ once: true, duration: 1000 });
                }
            };
            document.head.appendChild(script);
        } else {
            window.AOS.init({ once: true, duration: 1000 });
        }

        const handleScroll = () => {
            const header = document.querySelector('.tfe-header');
            if (header) {
                if (window.scrollY >= 60) header.classList.add('fixed-header');
                else header.classList.remove('fixed-header');
            }
        };
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <TournamentProvider>
            <Head title="Home" />

            <Header />

            <div className="page-wrapper overflow-hidden bg-black text-white">
                <Hero stadiums={stadiums} />

                {/* Top Ad Space */}
                <div className="container my-5">
                    <AdPlaceholder position="horizontal" />
              </div>

                <About variant="split" />
                <Features variant="split-reverse" />
                <Services variant="split" />

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
            <PrivacyConsent />
       </TournamentProvider>
    );
}
