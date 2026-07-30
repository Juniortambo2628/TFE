import React from 'react';
import HorizontalCardSection from '@/Components/Common/HorizontalCardSection';
import LandingCard from '@/Components/Common/LandingCard';

const FEATURE_CARDS = [
    {
        image: 'assets/img/IMG-11.jpg',
        title: 'Flexible Payment Plans',
        subtitle: 'Pay in manageable monthly installments',
        tags: ['12-24 Months', 'No Hidden Fees'],
    },
    {
        image: 'assets/img/backdrops/nigeria-fans.jpg',
        title: 'Community Savings',
        subtitle: 'Group rates with fellow fans',
        tags: ['Group Rates', 'Together'],
    },
    {
        image: 'assets/img/backdrops/plane-square.jpg',
        title: 'All-Inclusive Packages',
        subtitle: 'Flights, hotels, transfers, insurance',
        tags: ['Travel Info', 'Travel'],
    },
    {
        image: 'assets/img/IMG-13.jpg',
        title: '24/7 Local Support',
        subtitle: 'Multilingual team on the ground',
        tags: ['24/7', 'Multilingual'],
    },
];

export default function Features() {
    return (
        <HorizontalCardSection
            id="features"
            number="02"
            badge="Features"
            title="Core Features"
            description="Structured financing solutions, flexible payment plans, community savings groups, and all-inclusive travel packages designed for African football fans."
            action={{ label: 'Explore Features', href: '#services' }}
        >
            {FEATURE_CARDS.map((card) => (
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
