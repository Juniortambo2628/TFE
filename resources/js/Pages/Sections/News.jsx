import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import V2PageShell from '@/Components/Landing/V2/V2PageShell';
import V2PageHero from '@/Components/Landing/V2/V2PageHero';
import { V2Section, closingProps } from '@/Components/Landing/V2/V2Blocks';

/**
 * /v2/news: the same feed as /news (`news.index`, by the tournament's
 * category), as a grid of headlines that open on the publisher's site. No
 * feed configured is said plainly rather than shown as an empty grid.
 */
export default function News({ hero }) {
    const { v2Pages, tournament } = usePage().props;
    const copy = v2Pages.news;
    const [articles, setArticles] = useState(null);
    const category = tournament?.default_news_category || 'general';

    useEffect(() => {
        let live = true;
        fetch(`${route('news.index')}?category=${encodeURIComponent(category)}`)
            .then((r) => r.json())
            .then((d) => { if (live) setArticles(d.articles || []); })
            .catch(() => { if (live) setArticles([]); });
        return () => { live = false; };
    }, [category]);

    return (
        <V2PageShell
            title="News"
            hero={<V2PageHero crumbs={[{ label: 'News' }]} eyebrow={hero.eyebrow} title={hero.title} tagline={hero.tagline} background={hero.background} />}
            closing={closingProps(copy.closing, { primary: { action: 'planner' }, secondary: { action: 'link:/partners' }, tournamentId: tournament?.id })}
        >
            <V2Section id="headlines">
                <p className="v2-head__text v2-news__intro">{copy.intro}</p>
                {articles === null ? (
                    <div className="v2-news" aria-busy="true">
                        {[0, 1, 2].map((i) => <div key={i} className="v2-news__card tfe-skeleton" style={{ minHeight: 280 }} />)}
                    </div>
                ) : articles.length === 0 ? (
                    <div className="tfe-empty">
                        <div className="tfe-empty__icon"><i className="fas fa-newspaper" aria-hidden="true"></i></div>
                        <div className="tfe-empty__title">{copy.empty}</div>
                    </div>
                ) : (
                    <div className="v2-news">
                        {articles.map((a) => (
                            <a key={a.url || a.title} href={a.url} target="_blank" rel="noopener noreferrer" className="v2-news__card">
                                <span className="v2-news__image" style={{ '--v2-card-image': `url(${a.image || '/assets/img/backdrops/night-stadium.jpg'})` }} aria-hidden="true" />
                                <span className="v2-news__body">
                                    <span className="v2-news__meta">{[a.source, a.date].filter(Boolean).join(' · ')}</span>
                                    <span className="v2-news__title">{a.title}</span>
                                    {a.excerpt && <span className="v2-news__excerpt">{a.excerpt}</span>}
                                </span>
                            </a>
                        ))}
                    </div>
                )}
            </V2Section>
        </V2PageShell>
    );
}
