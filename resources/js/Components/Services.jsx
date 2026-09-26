import React, { useState } from 'react';
import HorizontalCardSection from '@/Components/Common/HorizontalCardSection';
import LandingCard from '@/Components/Common/LandingCard';
import LandingModal from '@/Components/Common/LandingModal';
import { useTournament } from '@/Context/TournamentContext';

// Defaults only. The CMS copy lives in config/site_sections.php and arrives
// as the `cards` prop; these keep the landing sections rendering when a
// caller does not pass any (and must stay in step with that config).
const SERVICE_CARDS = [
    {
        image: 'assets/img/IMG-12.jpg',
        title: 'Structured Financing',
        subtitle: 'Break tournament travel packages into monthly payments over 12-24 months instead of paying upfront.',
        tags: ['Financing', '12-24 Months'],
        description: 'Turn one big cost into a plan you control. Split your travel package across 12–24 monthly payments, matched to a finance partner, so you can lock in the trip now and pay it down over time.',
    },
    {
        image: 'assets/img/backdrops/plane-square.jpg',
        title: 'Travel Packages',
        subtitle: 'All-inclusive packages with premium accommodations, flights, transfers, and travel insurance.',
        tags: ['Travel', 'All-Inclusive'],
        description: 'Everything under one booking — premium stays, flights, airport and stadium transfers, and travel insurance — packaged and priced together so your trip is sorted end to end.',
    },
    {
        image: 'assets/img/IMG-16.jpg',
        title: 'Ticketing Guide',
        subtitle: 'Stay informed with the latest FIFA ticket sales news. We provide information and direct links to the official portal.',
        tags: ['Tickets', 'Info'],
        description: 'We keep you ahead of every ticket window with the latest official sale news and direct links to the tournament portal — no touts, no guesswork, just the right dates and the right links.',
    },
    {
        image: 'assets/img/IMG-18.jpg',
        title: 'Premium Accommodations',
        subtitle: '4-5 star hotels near stadiums with easy access to match venues and local attractions.',
        tags: ['4-5 Star', 'Premium'],
        description: 'Stay close to the action in hand-picked 4 and 5 star hotels near the stadiums, with easy access to venues and the best of each host city between fixtures.',
    },
];

export default function Services({ variant = 'split', hideHeader = false, cards = SERVICE_CARDS }) {
    const { tournament } = useTournament();
    const tournamentName = tournament ? tournament.name : 'tournament';
    const [modalData, setModalData] = useState(null);
    const description = 'Comprehensive solutions to make your ' + tournamentName + ' dream a reality. From flexible financing to complete travel packages.';
    return (
        <>
            <HorizontalCardSection
                id="services"
                number="03"
                badge="Services"
                title="What We Offer"
                description={description}
                action={{ label: 'Get Started', href: route('register') }}
                variant={variant}
                hideHeader={hideHeader}
            >
                {cards.map((card) => (
                    <LandingCard
                        key={card.title}
                        image={card.image}
                        title={card.title}
                        subtitle={card.subtitle}
                        tags={card.tags}
                        onClick={setModalData}
                        modalData={{
                            description: card.description,
                            cta: { label: 'Get started', href: route('register') },
                        }}
                    />
                ))}
          </HorizontalCardSection>
            <LandingModal open={modalData !== null} onClose={() => setModalData(null)} data={modalData} />
        </>
    );
}
