import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import PrivacyConsent from '@/Components/Common/PrivacyConsent';
import PageHero from '@/Components/Common/PageHero';
import BackNav from '@/Components/Common/BackNav';
import { TournamentProvider } from '@/Context/TournamentContext';
import '../../../css/hero-enhancements.css';

/**
 * SectionPageShell — the landing chrome for a standalone section page.
 *
 * Each public section (About, Features, Services, News, Contact) now lives on
 * its own route to keep the landing page light. They share this shell so they
 * read exactly like the landing: fixed header (with the same on-scroll state),
 * a spacer so the section clears the fixed header, the section itself, the
 * footer, and the cookie consent.
 */
// `breadcrumbs` is the trail after Home ([{label, href?}], current page last).
// It reaches the shell's own PageHero; a page passing `heroSlot` hands it to
// its PageHero itself.
export default function SectionPageShell({ title, hero, heroSlot, breadcrumbs, children }) {
    useEffect(() => {
        // Same rAF-throttled fixed-header toggle the landing page uses so the
        // header picks up its scrolled background on these pages too.
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
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <TournamentProvider>
            <Head title={title} />
            <Header />
            <div className="page-wrapper overflow-hidden bg-black text-white section-page">
                {heroSlot ? (
                    heroSlot
                ) : hero ? (
                    <PageHero
                        eyebrow={hero.eyebrow}
                        title={hero.title}
                        tagline={hero.tagline}
                        background={hero.background}
                        cta={hero.cta_label ? { label: hero.cta_label, href: hero.cta_href } : undefined}
                        breadcrumbs={breadcrumbs ?? [{ label: title || hero.title }]}
                    />
                ) : (
                    <>
                        <div className="section-page-spacer" aria-hidden="true" />
                        <div className="container">
                            <BackNav crumbs={breadcrumbs ?? [{ label: title }]} />
                        </div>
                    </>
                )}
                {children}
                <Footer />
            </div>
            <PrivacyConsent />
        </TournamentProvider>
    );
}
