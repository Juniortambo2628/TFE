import React from 'react';
import HorizontalCardSection from '@/Components/Common/HorizontalCardSection';
import LandingCard from '@/Components/Common/LandingCard';
import { useTournament } from '@/Context/TournamentContext';

const SERVICE_CARDS = [
    {
        image: 'assets/img/IMG-12.jpg',
        title: 'Structured Financing',
        subtitle: 'Break World Cup packages into monthly payments over 12-24 months instead of paying upfront.',
        tags: ['Financing', '12-24 Months'],
    },
    {
        image: 'assets/img/backdrops/plane-square.jpg',
        title: 'Travel Packages',
        subtitle: 'All-inclusive packages with premium accommodations, flights, transfers, and travel insurance.',
        tags: ['Travel', 'All-Inclusive'],
    },
    {
        image: 'assets/img/IMG-16.jpg',
        title: 'Ticketing Guide',
        subtitle: 'Stay informed with the latest FIFA ticket sales news. We provide information and direct links to the official portal.',
        tags: ['Tickets', 'Info'],
    },
    {
        image: 'assets/img/IMG-18.jpg',
        title: 'Premium Accommodations',
        subtitle: '4-5 star hotels near stadiums with easy access to match venues and local attractions.',
        tags: ['4-5 Star', 'Premium'],
    },
];

export default function Services({ variant = 'split' }) {
    const { tournament } = useTournament();
    const tournamentName = tournament ? tournament.name : 'FIFA World Cup 2026';
    const description = 'Comprehensive solutions to make your ' + tournamentName + ' dream a reality. From flexible financing to complete travel packages.';
    return (
        <HorizontalCardSection
            id="services"
            number="03"
            badge="Services"
            title="What We Offer"
            description={description}
            action={{ label: 'Get Started', href: route('register') }}
            variant={variant}
        >
            {SERVICE_CARDS.map((card) => (
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
