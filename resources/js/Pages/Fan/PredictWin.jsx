import React, { useState } from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Head, useForm, router } from '@inertiajs/react';
import AdPlaceholder from '@/Components/Common/AdPlaceholder';
import DashboardHero from '@/Components/Common/DashboardHero';
import SummaryTiles from '@/Components/Common/SummaryTiles';

export default function PredictWin({ auth, upcomingMatches, userStats, leaderboard, prizes }) {
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

            <div className="content-cards-grid mt-4">
                {/* Upcoming Matches */}
                <div className="content-card" style={{flex: 2}}>
                    <div className="card-header">
                        <i className="fas fa-futbol"></i>
                        <h3>Upcoming Matches</h3>
                    </div>
                    
                    <div className="p-3">
                        {upcomingMatches.map(match => (
                            <div 
                                key={match.id} 
                                className={`p-3 mb-3 rounded border ${selectedMatch?.id === match.id ? 'border-danger bg-dark' : 'border-secondary'}`}
                                style={{cursor: 'pointer'}}
                                onClick={() => setSelectedMatch(match)}
                            >
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="badge bg-secondary">{match.stage}</span>
                                    <span className="text-white-50 small">{match.date}</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center">
                                    <div className="text-center flex-fill">
                                        <div className="h5 mb-0 text-white">{match.home_team}</div>
                                    </div>
                                    <div className="px-3">
                                        <span className="badge bg-danger">VS</span>
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
                                    <span className="badge bg-secondary mb-2">{selectedMatch.stage}</span>
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
                            <div className="p-3">
                                {leaderboard.map(user => (
                                    <div key={user.rank} className="d-flex justify-content-between align-items-center py-2 border-bottom border-secondary">
                                        <div className="d-flex align-items-center gap-3">
                                            <span className={`badge ${user.rank <= 3 ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                                                #{user.rank}
                                            </span>
                                            <span className="text-white">{user.name}</span>
                                        </div>
                                        <div className="text-end">
                                            <div className="text-danger fw-bold">{user.points} pts</div>
                                            <small className="text-white-50">{user.correct} correct</small>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                <div className="row g-4 p-3">
                    {prizes.map(prize => (
                        <div key={prize.position} className="col-md-4">
                            <div className="p-4 text-center rounded border border-secondary">
                                <div className={`h1 mb-3 ${prize.position === '1st' ? 'text-warning' : 'text-secondary'}`}>
                                    <i className="fas fa-medal"></i>
                                </div>
                                <h5 className="text-white">{prize.position} Place</h5>
                                <p className="text-white-50 mb-2">{prize.prize}</p>
                                <span className="badge bg-danger">{prize.value}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </FanLayout>
    );
}
