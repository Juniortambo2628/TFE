import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';

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
import AdPlaceholder from '@/Components/Common/AdPlaceholder';
import GoogleTranslate from '@/Components/Common/GoogleTranslate';
import PrivacyConsent from '@/Components/Common/PrivacyConsent';

export default function Home({ appName, stadiums }) {

    // Global Initializations
    useEffect(() => {
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
        <>
            <Head title="Welcome" />
            
            <Header />

            <div className="page-wrapper overflow-hidden bg-black text-white">
                <Hero stadiums={stadiums} />
                
                {/* Top Ad Space */}
                <div className="container my-5">
                    <AdPlaceholder position="horizontal" />
                </div>

                <About />
                <Features />
                <Services />

                {/* Middle Ad Space */}
                <div className="container my-5">
                    <AdPlaceholder position="horizontal" />
                </div>

                <News />
                <Contact />
                <Testimonials />
                <PartnerCarousel />

                {/* Bottom Ad Space */}
                <div className="container mt-5 mb-0">
                    <AdPlaceholder position="horizontal" />
                </div>

                <Footer />
                <GoogleTranslate />
            </div>
            <PrivacyConsent />
        </>
    );
}
