import React, { useCallback, useEffect, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import PrivacyConsent from '@/Components/Common/PrivacyConsent';
import FeaturedPackages from '@/Components/Landing/FeaturedPackages';
import CommunityPreview from '@/Components/Landing/CommunityPreview';
import V2Hero from '@/Components/Landing/V2/V2Hero';
import AudiencePanel from '@/Components/Landing/V2/AudiencePanel';
import FactsStrip from '@/Components/Landing/V2/FactsStrip';
import SectionNav from '@/Components/Landing/V2/SectionNav';
import FanJourney from '@/Components/Landing/V2/FanJourney';
import FeatureExplorer from '@/Components/Landing/V2/FeatureExplorer';
import PartnerCategories from '@/Components/Landing/V2/PartnerCategories';
import Faq from '@/Components/Landing/V2/Faq';
import ClosingCta from '@/Components/Landing/V2/ClosingCta';
import { scrollToSection } from '@/Components/Landing/V2/LandingAction';
import useFixedHeaderOnScroll from '@/hooks/useFixedHeaderOnScroll';
import useStayInV2 from '@/hooks/useStayInV2';
import { TournamentProvider } from '@/Context/TournamentContext';
import '../../css/landing-v2.css';

/**
 * Landing page v2 (UX review, 2 Nov 2026, Track C) — /v2.
 *
 * The Najenga/Naoa structure: the page shows who TFE is for, how a trip
 * works and what each screen looks like BEFORE anyone is asked to sign in,
 * so by the time a visitor reaches a call to action they already know what
 * they are going to do. It lives beside the current landing page (/) while
 * the tester group compares the two; noindex until then.
 *
 * Copy: config/landing_v2.php + Admin -> Content -> Landing v2 overrides,
 * arriving as `content`. Facts and partner counts are counted server-side.
 */
export default function HomeV2({ content, facts = {}, partnerCounts = {}, partnerTypeLabels = {}, featuredPackages, communityPreview }) {
    const { tournament } = usePage().props;
    const [area, setArea] = useState(content.explorer?.areas?.[0]?.id);

    useStayInV2();
    useFixedHeaderOnScroll();

    // A journey step opens its area in the explorer and scrolls to it.
    const openArea = useCallback((id) => {
        setArea(id);
        scrollToSection('inside');
    }, []);

    // Deep links like /v2#inside-tickets open that area.
    useEffect(() => {
        const m = window.location.hash.match(/^#inside-([a-z-]+)$/);
        if (m && content.explorer.areas.some((a) => a.id === m[1])) openArea(m[1]);
    }, []);

    return (
        <TournamentProvider>
            <Head title="The Football Experience">
                <meta name="robots" content="noindex, nofollow" head-key="robots" />
            </Head>
            <Header />

            {/* No Bootstrap overflow-hidden here: it makes this a scroll container
                and the section bar would stop sticking (landing-v2.css). */}
            <div className="page-wrapper bg-black text-white v2-page">
                <V2Hero hero={content.hero} />
                <AudiencePanel about={content.about} audiences={content.audiences} />
                <FactsStrip facts={facts} labels={content.facts} />
                <SectionNav sections={content.sections} />

                <FanJourney journey={content.journey} onOpenArea={openArea} />
                <FeatureExplorer explorer={content.explorer} active={area} onChange={setArea} tournamentId={tournament?.id} />

                <FeaturedPackages
                    id="trips"
                    variant="carousel"
                    packages={featuredPackages}
                    tournamentName={tournament?.short_name}
                    eyebrow={content.trips.eyebrow}
                    title={content.trips.title}
                    sub={content.trips.text}
                />

                <PartnerCategories partners={content.partners} counts={partnerCounts} typeLabels={partnerTypeLabels} />

                <div id="community" className="v2-anchor">
                    <CommunityPreview preview={communityPreview} />
                </div>

                <Faq faq={content.faq} />

                <ClosingCta
                    title={content.closing.title}
                    text={content.closing.text}
                    primary={{ action: 'planner', label: content.closing.primary, icon: 'fas fa-plane' }}
                    secondary={{ action: 'section:trips', label: content.closing.secondary }}
                    tournamentId={tournament?.id}
                />

                <Footer />
            </div>
            <PrivacyConsent />
        </TournamentProvider>
    );
}
