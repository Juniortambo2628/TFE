import React, { useState } from 'react';
import HorizontalCardSection from '@/Components/Common/HorizontalCardSection';
import LandingCard from '@/Components/Common/LandingCard';
import LandingModal from '@/Components/Common/LandingModal';
import { useTournament } from '@/Context/TournamentContext';

const CONTACT_CARDS = [
    {
        image: 'assets/img/IMG-15.jpg',
        title: 'Speak With Our Team',
        subtitle: 'Personalised guidance for your journey',
        tags: ['Support', '24/7'],
        description: 'Our experienced travel concierges help you choose the right package, financing plan, and matches to attend. We respond within 2 hours during business days.',
    },
    {
        image: 'assets/img/backdrops/plane-square.jpg',
        title: 'Custom Travel Requests',
        subtitle: 'Tell us what you want to see',
        tags: ['Custom', 'Bespoke'],
        description: 'Planning to combine matches with a city break, family visit, or group tour? Send us your wishlist and we will craft a bespoke itinerary and quote.',
    },
    {
        image: 'assets/img/IMG-13.jpg',
        title: 'Partner With Us',
        subtitle: 'Travel agencies, sponsors, media',
        tags: ['B2B', 'Partners'],
        description: 'We collaborate with travel agencies, brands, and media across Africa and beyond. Reach out to explore partnership opportunities for AFCON 2027 and beyond.',
    },
];

export default function Contact() {
    var modalData = useState(null);
    var openCard = modalData[0];
    var setOpenCard = modalData[1];
    var handleClick = function (data) { setOpenCard(data); };
    var closeModal = function () { setOpenCard(null); };
    var tournamentCtx = useTournament();
    var tournamentName = tournamentCtx.tournament ? tournamentCtx.tournament.short_name || tournamentCtx.tournament.name : 'your next tournament';

    return (
        <>
            <HorizontalCardSection
                id="contact"
                number="05"
                badge="Contact"
                title="Get in Touch"
                description={'Have questions about our packages or financing? Our team is here to help you plan your ' + tournamentName + ' — and beyond — with confidence.'}
            >
                {CONTACT_CARDS.map(function (card) {
                    return React.createElement(LandingCard, {
                        key: card.title,
                        image: card.image,
                        title: card.title,
                        subtitle: card.subtitle,
                        tags: card.tags,
                        onClick: handleClick,
                        modalData: {
                            description: card.description,
                            cta: { label: 'Send a Message', href: 'mailto:hello@tfe.okjtech.co.ke' },
                        },
                    });
                })}
         </HorizontalCardSection>

            <LandingModal open={openCard !== null} onClose={closeModal} data={openCard} />
        </>
    );
}
