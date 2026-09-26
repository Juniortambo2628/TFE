import React, { useState } from 'react';
import HorizontalCardSection from '@/Components/Common/HorizontalCardSection';
import LandingCard from '@/Components/Common/LandingCard';
import LandingModal from '@/Components/Common/LandingModal';
import { useTournament } from '@/Context/TournamentContext';

// Defaults only. The CMS copy lives in config/site_sections.php and arrives
// as the `cards` prop; these keep the landing sections rendering when a
// caller does not pass any (and must stay in step with that config).
const ABOUT_CARDS = [
    {
        image: 'assets/img/IMG-11.jpg',
        title: 'Premium Travel',
        subtitle: 'Curated match experiences',
        tags: ['VIP Access', 'Curated'],
        description: 'End-to-end match trips built around the fixtures you care about — premium seats, hospitality, and transfers handled so all you do is show up and support your team.',
    },
    {
        image: 'assets/img/backdrops/stadium-fans.jpg',
        title: 'Match Day Magic',
        subtitle: 'Cheer from the best seats',
        tags: ['Live', 'Stadium'],
        description: 'Feel the roar from the right seats. We secure vantage points across the host stadiums so you experience the tournament from inside the atmosphere, not the nosebleeds.',
    },
    {
        image: 'assets/img/IMG-15.jpg',
        title: 'Travel Concierge',
        subtitle: 'Hassle-free arrangements',
        tags: ['24/7', 'Support'],
        description: 'A dedicated team on the ground and on call — visas, itineraries, last-minute changes and local know-how, so nothing between kick-offs is left to chance.',
    },
    {
        image: 'assets/img/backdrops/plane-square.jpg',
        title: 'Flights & Stays',
        subtitle: 'Bundled packages',
        tags: ['All-Inclusive'],
        description: 'Flights, hotels and transfers bundled into one price and one plan, negotiated for travelling fans and timed around match days rather than standard check-in windows.',
    },
];

export default function About({ variant = 'split', hideHeader = false, cards = ABOUT_CARDS }) {
    var tournamentCtx = useTournament();
    var tournament = tournamentCtx.tournament;
    var tournamentName = tournament ? tournament.name : 'the next tournament';
    var hosts = tournament && tournament.hosts && tournament.hosts.length ? tournament.hosts.join(', ') : 'top destinations';
    var [modalData, setModalData] = useState(null);

    var description = 'We create premium travel experiences for African football fans who value comfort, style, and a personal approach. From ' + hosts + ' and beyond — only trusted destinations, exclusive offers, and top-tier service for ' + tournamentName + '.';

    return (
        <>
            <HorizontalCardSection
                id="about"
                number="01"
                badge="About TFE"
                title="About Us"
                description={description}
                action={{ label: 'Learn More', href: '#features' }}
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
                            cta: { label: 'Start planning', href: route('register') },
                        }}
                    />
                ))}
          </HorizontalCardSection>
            <LandingModal open={modalData !== null} onClose={() => setModalData(null)} data={modalData} />
        </>
    );
}
