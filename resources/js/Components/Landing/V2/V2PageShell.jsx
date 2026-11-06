import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import PrivacyConsent from '@/Components/Common/PrivacyConsent';
import SectionNav from '@/Components/Landing/V2/SectionNav';
import ClosingCta from '@/Components/Landing/V2/ClosingCta';
import useFixedHeaderOnScroll from '@/hooks/useFixedHeaderOnScroll';
import { TournamentProvider } from '@/Context/TournamentContext';
import '../../../../css/landing-v2.css';

/**
 * The frame of every v2 public page (/v2/about, /v2/partners, …): the
 * landing v2 structure applied page by page — a hero that says what the
 * page is, the sticky "On this page" bar, sections that each open with an
 * eyebrow and a heading, and one closing call to action.
 *
 * `hero` is a rendered <V2PageHero>; `sections` feeds the bar (a section
 * missing from the page is left out of it); `closing` is ClosingCta's props.
 */
export default function V2PageShell({ title, hero, sections = [], closing, children }) {
    useFixedHeaderOnScroll();

    return (
        <TournamentProvider>
            <Head title={title}>
            </Head>
            <Header />

            {/* No overflow-hidden: the section bar has to stick (landing-v2.css). */}
            <div className="page-wrapper bg-black text-white v2-page v2-page--inner">
                {hero}
                {sections.length > 0 && <SectionNav sections={sections} />}
                {children}
                {closing && <ClosingCta {...closing} />}
                <Footer />
            </div>
            <PrivacyConsent />
        </TournamentProvider>
    );
}
