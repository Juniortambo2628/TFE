import React, { useState } from 'react';
import HorizontalCardSection from '@/Components/Common/HorizontalCardSection';
import LandingCard from '@/Components/Common/LandingCard';
import LandingModal from '@/Components/Common/LandingModal';
import { useTournament } from '@/Context/TournamentContext';

// Defaults only. The CMS copy lives in config/site_sections.php and arrives
// as the `cards` prop; these keep the landing sections rendering when a
// caller does not pass any (and must stay in step with that config).
const FEATURE_CARDS = [
    {
        image: 'assets/img/IMG-11.jpg',
        title: 'Flexible Payment Plans',
        subtitle: 'Pay in manageable monthly installments',
        tags: ['12-24 Months', 'No Hidden Fees'],
        description: 'Spread the cost of your trip over 12 to 24 months instead of paying upfront. Transparent instalments with no hidden fees, so the tournament fits your budget, not the other way round.',
    },
    {
        image: 'assets/img/backdrops/nigeria-fans.jpg',
        title: 'Community Savings',
        subtitle: 'Group rates with fellow fans',
        tags: ['Group Rates', 'Together'],
        description: 'Travel as a tribe. Pool with fellow fans to unlock group rates on tickets, stays and transfers, and save together toward a shared match-day goal.',
    },
    {
        image: 'assets/img/backdrops/plane-square.jpg',
        title: 'All-Inclusive Packages',
        subtitle: 'Flights, hotels, transfers, insurance',
        tags: ['Travel Info', 'Travel'],
        description: 'One package, everything covered — flights, hotels, transfers and insurance bundled and priced together so there are no surprise line items once you land.',
    },
    {
        image: 'assets/img/IMG-13.jpg',
        title: '24/7 Local Support',
        subtitle: 'Multilingual team on the ground',
        tags: ['24/7', 'Multilingual'],
        description: 'A multilingual team on the ground around the clock — for directions, changes, or anything that comes up between kick-offs, in a language you speak.',
    },
];

export default function Features({ variant = 'split', hideHeader = false, cards = FEATURE_CARDS }) {
    const { tournament } = useTournament();
    const tournamentName = tournament ? tournament.name : 'the next tournament';
    const [modalData, setModalData] = useState(null);
    const description = 'Structured financing solutions, flexible payment plans, community savings groups, and all-inclusive travel packages designed for ' + tournamentName + ' fans.';
    return (
        <>
            <HorizontalCardSection
                id="features"
                number="02"
                badge="Features"
                title="Core Features"
                description={description}
                action={{ label: 'Explore Features', href: '#services' }}
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
