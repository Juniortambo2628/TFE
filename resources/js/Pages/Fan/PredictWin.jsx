import React, { useState } from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Head, useForm, router, Link } from '@inertiajs/react';
import AdPlaceholder from '@/Components/Common/AdPlaceholder';
import DashboardHero from '@/Components/Common/DashboardHero';
import SummaryTiles from '@/Components/Common/SummaryTiles';
import { formatMoney } from '@/lib/utils';
import '../../../css/betting-strip.css';

export default function PredictWin({ auth, upcomingMatches, userStats, leaderboard, prizes, bettingOffers = [] }) {
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [prediction, setPrediction] = useState({ home_score: 0, away_score: 0 });

    const submitPrediction = () => {
        if (!selectedMatch) return;
        
        router.post(route('fan.predict-win.predict'), {
            match_id: selectedMatch.id,
            home_score: prediction.home_score,
            away_score: prediction.away_score
        }, {
            onSuccess: () => {
                setSelectedMatch(null);
                setPrediction({ home_score: 0, away_score: 0 });
            }
        });
    };

    return (
        <FanLayout title="Predict & Win">
            {/* Hero Section */}
            <DashboardHero role="fan" 
                title="Predict & Win"
                subtitle="Predict match scores and win amazing prizes!"
                breadcrumbs={[{ label: 'Predict' }]}
                bgImage="/assets/img/fan/backgrounds/gaming_hero.png"
            />

            {/* Ad Placeholder */}
            <div className="mb-4">
                <AdPlaceholder position="horizontal" />
            </div>

            <SummaryTiles
                items={[
                    { label: 'Predictions', value: userStats.total_predictions,   icon: 'fa-bullseye',     accent: 'red',   subtext: 'Total submitted' },
                    { label: 'Correct',     value: userStats.correct_predictions, icon: 'fa-check-circle', accent: 'blue',  subtext: `${userStats.accuracy}% accuracy` },
                    { label: 'Points',      value: `${userStats.points} pts`,     icon: 'fa-star',         accent: 'amber', subtext: 'Earned so far' },
                    { label: 'Rank',        value: `#${userStats.rank}`,          icon: 'fa-trophy',       accent: 'teal',  subtext: 'Leaderboard Position' },
                ]}
            />

            {bettingOffers.length > 0 && (
                <section className="betting-strip">
                    <header className="betting-strip__head">
                        <div>
                            <span className="betting-strip__eyebrow">Featured odds from our partners</span>
                            <h3 className="betting-strip__title">Back your prediction with a boosted bundle</h3>
                        </div>
                        <span className="betting-strip__age">18+ · Gamble responsibly</span>
                    </header>
                    <div className="betting-strip__grid">
                        {bettingOffers.map((o) => <BettingOffer key={o.id} offer={o} />)}
                    </div>
                </section>
            )}

            <div className="content-cards-grid mt-4">
                {/* Upcoming Matches */}
                <div className="content-card" style={{flex: 2}}>
                    <div className="card-header">
                        <i className="fas fa-futbol"></i>
                        <h3>Upcoming Matches</h3>
                    </div>
                    
                    {upcomingMatches.length === 0 ? (
                        <div className="tfe-empty">
                            <div className="tfe-empty__icon"><i className="fas fa-futbol"></i></div>
                            <h4 className="tfe-empty__title">No fixtures to call yet</h4>
                            <p className="tfe-empty__body">
                                The schedule for this tournament has not been published. Check the
                                match schedule once fixtures are confirmed and your predictions
                                will open here.
                            </p>
                            <Link href={route('fan.match-schedule')} className="tfe-btn tfe-btn--sm tfe-empty__action">
                                <i className="fas fa-calendar-days"></i> Match Schedule
                            </Link>
                        </div>
                    ) : (
                    <div className="p-3">
                        {upcomingMatches.map(match => (
                            <div 
                                key={match.id} 
                                className={`predict-match${selectedMatch?.id === match.id ? ' is-selected' : ''}`}
                                onClick={() => setSelectedMatch(match)}
                            >
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="tfe-pill tfe-pill--concluded">{match.stage}</span>
                                    <span className="text-white-50 small">{match.date}</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center">
                                    <div className="text-center flex-fill">
                                        <div className="h5 mb-0 text-white">{match.home_team}</div>
                                    </div>
                                    <div className="px-3">
                                        <span className="tfe-pill tfe-pill--upcoming">VS</span>
                                    </div>
                                    <div className="text-center flex-fill">
                                        <div className="h5 mb-0 text-white">{match.away_team}</div>
                                    </div>
                                </div>
                                <div className="text-center mt-2">
                                    <small className="text-white-50"><i className="fas fa-map-marker-alt me-1"></i>{match.venue}</small>
                                </div>
                            </div>
                        ))}
                    </div>
                    )}
                </div>

                {/* Prediction Form / Leaderboard */}
                <div className="content-card" style={{flex: 1}}>
                    {selectedMatch ? (
                        <>
                            <div className="card-header">
                                <i className="fas fa-edit"></i>
                                <h3>Make Prediction</h3>
                            </div>
                            <div className="p-3">
                                <div className="text-center mb-4">
                                    <span className="tfe-pill tfe-pill--concluded mb-2">{selectedMatch.stage}</span>
                                    <h5 className="text-white">{selectedMatch.home_team} vs {selectedMatch.away_team}</h5>
                                </div>
                                
                                <div className="d-flex justify-content-center align-items-center gap-4 mb-4">
                                    <div className="text-center">
                                        <label className="text-white-50 small d-block mb-2">{selectedMatch.home_team}</label>
                                        <input 
                                            type="number" 
                                            className="tfe-input text-center"
                                            style={{width: '80px'}}
                                            min="0"
                                            value={prediction.home_score}
                                            onChange={(e) => setPrediction({...prediction, home_score: parseInt(e.target.value) || 0})}
                                        />
                                    </div>
                                    <span className="text-white h4">-</span>
                                    <div className="text-center">
                                        <label className="text-white-50 small d-block mb-2">{selectedMatch.away_team}</label>
                                        <input 
                                            type="number" 
                                            className="tfe-input text-center"
                                            style={{width: '80px'}}
                                            min="0"
                                            value={prediction.away_score}
                                            onChange={(e) => setPrediction({...prediction, away_score: parseInt(e.target.value) || 0})}
                                        />
                                    </div>
                                </div>

                                <button type="button" className="tfe-btn tfe-btn--filled w-100" onClick={submitPrediction}>
                                    <i className="fas fa-paper-plane me-2"></i>Submit Prediction
                                </button>
                                <button type="button" className="tfe-btn w-100 mt-2" onClick={() => setSelectedMatch(null)}>
                                    Cancel
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="card-header">
                                <i className="fas fa-trophy"></i>
                                <h3>Leaderboard</h3>
                            </div>
                            {leaderboard.length === 0 ? (
                                <div className="tfe-empty">
                                    <div className="tfe-empty__icon"><i className="fas fa-trophy"></i></div>
                                    <h4 className="tfe-empty__title">No standings yet</h4>
                                    <p className="tfe-empty__body">
                                        Nobody has scored a prediction for this tournament so far. Call a
                                        scoreline above and you will be the one to beat.
                                    </p>
                                </div>
                            ) : (
                                <ol className="tfe-leaderboard">
                                    {leaderboard.map(entry => (
                                        <li key={entry.rank} className="tfe-leaderboard__row">
                                            <span
                                                className="tfe-rank"
                                                data-medal={entry.rank <= 3 ? entry.rank : undefined}
                                                aria-label={`Rank ${entry.rank}`}
                                            >
                                                {entry.rank}
                                            </span>
                                            <span className="tfe-leaderboard__name">{entry.name}</span>
                                            <span className="tfe-leaderboard__score">
                                                <strong>{entry.points}</strong>
                                                <small>pts · {entry.correct} correct</small>
                                            </span>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Prizes Section */}
            <div className="content-card mt-4">
                <div className="card-header">
                    <i className="fas fa-gift"></i>
                    <h3>Prizes</h3>
                </div>
                {prizes.length === 0 ? (
                    <div className="tfe-empty">
                        <div className="tfe-empty__icon"><i className="fas fa-gift"></i></div>
                        <h4 className="tfe-empty__title">Prizes not announced yet</h4>
                        <p className="tfe-empty__body">
                            Prizes for this tournament's prediction game are still being confirmed.
                            Keep calling scorelines — points earned now still count.
                        </p>
                    </div>
                ) : (
                <div className="tfe-prize-grid">
                    {prizes.map((prize, index) => (
                        <article key={prize.position} className="tfe-prize" data-medal={index + 1}>
                            <span className="tfe-rank tfe-rank--lg" data-medal={index + 1}>
                                <i className="fas fa-medal"></i>
                            </span>
                            <h4 className="tfe-prize__title">{prize.position} Place</h4>
                            <p className="tfe-prize__body">{prize.prize}</p>
                            <span className="tfe-pill tfe-pill--upcoming">{prize.value}</span>
                        </article>
                    ))}
                </div>
                )}
            </div>
        </FanLayout>
    );
}

function BettingOffer({ offer }) {
    const accent = offer.partner?.theme_accent || '#16a34a';
    const remaining = Math.max(0, (offer.capacity || 0) - (offer.sold_count || 0));
    return (
        <article className="betting-card" style={{ '--betting-accent': accent }}>
            {offer.hero_image && <div className="betting-card__cover" style={{ backgroundImage: `url(/${offer.hero_image})` }} />}
            <div className="betting-card__body">
                <div className="betting-card__partner">
                    <span className="betting-card__dot" />
                    <span>{offer.partner?.display_name || 'Betting partner'}</span>
                    {offer.partner?.verified && <i className="fas fa-check-circle" title="Verified partner" />}
                </div>
                <h4 className="betting-card__title">{offer.name}</h4>
                <p className="betting-card__desc">{offer.description}</p>
                <div className="betting-card__foot">
                    <div className="betting-card__price">
                        <span>from</span><strong>{formatMoney(offer.base_price, offer.currency)}</strong>
                    </div>
                    {remaining > 0 && <span className="betting-card__stock">{remaining.toLocaleString()} spots left</span>}
                </div>
                {offer.partner?.slug && (
                    <Link href={`/partners/${offer.partner.slug}`} className="tfe-btn tfe-btn--sm betting-card__cta">
                        Claim on {offer.partner.display_name} <i className="fas fa-external-link-alt"></i>
                    </Link>
                )}
                <p className="betting-card__legal">18+ only. Gamble responsibly. Terms apply.</p>
            </div>
        </article>
    );
}

