import React from 'react';
import HorizontalCardSection from '@/Components/Common/HorizontalCardSection';
import LandingCard from '@/Components/Common/LandingCard';
import { useTournament } from '@/Context/TournamentContext';

const ABOUT_CARDS = [
    {
        image: 'assets/img/IMG-11.jpg',
        title: 'Premium Travel',
        subtitle: 'Curated match experiences',
        tags: ['VIP Access', 'Curated'],
    },
    {
        image: 'assets/img/backdrops/stadium-fans.jpg',
        title: 'Match Day Magic',
        subtitle: 'Cheer from the best seats',
        tags: ['Live', 'Stadium'],
    },
    {
        image: 'assets/img/IMG-15.jpg',
        title: 'Travel Concierge',
        subtitle: 'Hassle-free arrangements',
        tags: ['24/7', 'Support'],
    },
    {
        image: 'assets/img/backdrops/plane-square.jpg',
        title: 'Flights & Stays',
        subtitle: 'Bundled packages',
        tags: ['All-Inclusive'],
    },
];

export default function About({ variant = 'split' }) {
    var tournamentCtx = useTournament();
    var tournament = tournamentCtx.tournament;
    var tournamentName = tournament ? tournament.name : 'the next tournament';
    var hosts = tournament && tournament.hosts && tournament.hosts.length ? tournament.hosts.join(', ') : 'top destinations';

    var description = 'We create premium travel experiences for African football fans who value comfort, style, and a personal approach. From ' + hosts + ' and beyond — only trusted destinations, exclusive offers, and top-tier service for ' + tournamentName + '.';

    return (
        <HorizontalCardSection
            id="about"
            number="01"
            badge="About TFE"
            title="About Us"
            description={description}
            action={{ label: 'Learn More', href: '#features' }}
            variant={variant}
        >
            {ABOUT_CARDS.map((card) => (
                <LandingCard
                    key={card.title}
                    image={card.image}
                    title={card.title}
                    subtitle={card.subtitle}
                    tags={card.tags}
                />
            ))}
      </HorizontalCardSection>
    );
}
