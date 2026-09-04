import React, { useState, useEffect } from 'react';
import HorizontalCardSection from '@/Components/Common/HorizontalCardSection';
import LandingCard from '@/Components/Common/LandingCard';
import LandingModal from '@/Components/Common/LandingModal';
import { useTournament } from '@/Context/TournamentContext';

export default function Testimonials() {
    var tournamentCtx = useTournament();
    var tournamentName = tournamentCtx.tournament
        ? (tournamentCtx.tournament.short_name || tournamentCtx.tournament.name)
        : 'their tournament';
    var testimonialsState = useState([]);
    var testimonials = testimonialsState[0];
    var setTestimonials = testimonialsState[1];

    var loadingState = useState(true);
    var loading = loadingState[0];
    var setLoading = loadingState[1];

    var modalState = useState(null);
    var openTestimonial = modalState[0];
    var setOpenTestimonial = modalState[1];

    useEffect(function () {
        fetch('/testimonials')
            .then(function (res) { return res.json(); })
            .then(function (data) {
                setTestimonials(data);
                setLoading(false);
            })
            .catch(function () {
                setLoading(false);
            });
    }, []);

    var handleClick = function (data) { setOpenTestimonial(data); };
    var closeModal = function () { setOpenTestimonial(null); };

    return (
        <>
            <HorizontalCardSection
                id="community"
                number="06"
                badge="Community"
                title="What Fans Say"
                description={'Join thousands of African football fans experiencing ' + tournamentName + ' with us.'}
            >
                {loading ? (
                    React.createElement('div', { style: { color: 'rgba(255,255,255,0.5)', padding: '2rem' } }, 'Loading stories...')
                ) : testimonials.length > 0 ? (
                    testimonials.map(function (item, index) {
                        var stars = [1, 2, 3, 4, 5].map(function (s) {
                            return s <= item.rating ? '\u2605' : '\u2606';
                        }).join('');
                        return React.createElement(LandingCard, {
                            key: index,
                            image: 'assets/img/IMG-16.jpg',
                            title: item.name,
                            subtitle: (item.role ? item.role + ' \u00b7 ' : '') + stars,
                            tags: ['Testimonial'],
                            onClick: handleClick,
                            modalData: {
                                description: '"' + item.content + '"',
                                cta: { label: 'Share Your Story', href: '#share' },
                            },
                        });
                    })
                ) : (
                    React.createElement('div', { style: { color: 'rgba(255,255,255,0.5)', padding: '2rem' } }, 'No testimonials yet. Be the first to share your story!')
                )}
        </HorizontalCardSection>

            <LandingModal open={openTestimonial !== null} onClose={closeModal} data={openTestimonial} />
        </>
    );
}
