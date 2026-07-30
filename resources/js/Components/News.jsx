import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import HorizontalCardSection from '@/Components/Common/HorizontalCardSection';
import LandingCard from '@/Components/Common/LandingCard';
import LandingModal from '@/Components/Common/LandingModal';
import { useTournament } from '@/Context/TournamentContext';

const CATEGORY_LABELS = {
    general: 'Football News',
    european: 'European Football',
    african: 'African Football',
    south_american: 'South American Football',
    transfers: 'Transfer News',
};

export default function News() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalData, setModalData] = useState(null);
    const { assetUrl } = usePage().props;
    var tournamentCtx = useTournament();
    var tournament = tournamentCtx.tournament;
    var newsCategory = (tournament && tournament.default_news_category) || 'general';
    var tournamentShortName = tournament ? tournament.short_name : '';

    useEffect(function () {
        fetch(route('news.index') + '?category=' + newsCategory)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                setNews(data.articles || []);
                setLoading(false);
            })
            .catch(function () {
                setLoading(false);
            });
    }, [newsCategory]);

    var handleCardClick = function (data) {
        setModalData(data);
    };

    var closeModal = function () {
        setModalData(null);
    };

    var newsTitle = tournamentShortName ? tournamentShortName + ' News' : 'Football News';
    var newsDescription = tournamentShortName
        ? 'The latest stories for ' + tournamentShortName + ' \u2014 fixtures, teams, and tournament news.'
        : 'The latest stories from across the football world \u2014 leagues, transfers, AFCON, and more.';

    return (
        <>
            <HorizontalCardSection
                id="news"
                number="04"
                badge="News"
                title={newsTitle}
                description={newsDescription}
                headerAction={{ label: 'View All', href: 'https://news.google.com/search?q=football' }}
            >
                {loading ? (
                    <div style={{ color: 'rgba(255,255,255,0.5)', padding: '2rem' }}>
                        Loading live news...
                  </div>
                ) : news.length > 0 ? (
                    news.map(function (item, index) {
                        return React.createElement(LandingCard, {
                            key: index,
                            image: item.image || 'https://via.placeholder.com/600x400?text=News',
                            title: item.title,
                            subtitle: (item.source ? item.source + ' • ' : '') + item.date,
                            tags: ['Football', 'News'],
                            onClick: handleCardClick,
                            modalData: {
                                description: item.excerpt || '',
                                meta: [item.date, item.source].filter(Boolean),
                                cta: { label: 'Read Full Article', href: item.url },
                            },
                        });
                    })
                ) : (
                    <div style={{ color: 'rgba(255,255,255,0.5)', padding: '2rem' }}>
                        Unable to load live news. Configure NEWSAPI_KEY in your .env to enable the feed.
                  </div>
                )}
         </HorizontalCardSection>

            <LandingModal open={modalData !== null} onClose={closeModal} data={modalData} />
        </>
    );
}
