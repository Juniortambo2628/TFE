import React, { useState } from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Head, router } from '@inertiajs/react';
import { useTournament } from '@/Context/TournamentContext';
import '../../../css/fan/fan-pages.css';
import DashboardHero from '@/Components/Common/DashboardHero';
import SummaryTiles from '@/Components/Common/SummaryTiles';
import MatchCard from '@/Components/Fan/MatchCard';
import { TEAM_FLAGS } from '@/Data/countryFlags';

export default function MatchSchedule({ auth, allFixtures = [], groups = [], stages = [], teams = [], stats = {}, userFavorites = [], isConcluded = false }) {
    const { tournament } = useTournament();
    const [activeTab, setActiveTab] = useState('groups');
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [favorites, setFavorites] = useState(userFavorites);

    // Filter matches based on tab and selected group
    const getFilteredMatches = () => {
        if (activeTab === 'groups') {
            let matches = allFixtures.filter(m => m.stage === 'Group Stage');
            if (selectedGroup) {
                matches = matches.filter(m => m.group === selectedGroup);
            }
            return matches;
        } else {
            // Knockout rounds (exclude Group Stage)
            return allFixtures.filter(m => m.stage !== 'Group Stage');
        }
    };;

    const filteredMatches = getFilteredMatches();

    // Group matches by date
    const matchesByDate = filteredMatches.reduce((acc, match) => {
        if (!acc[match.date]) {
            acc[match.date] = [];
        }
        acc[match.date].push(match);
        return acc;
    }, {});

    const toggleFavorite = (matchId) => {
        // Toggle in state for UI
        setFavorites(prev => 
            prev.includes(matchId) 
                ? prev.filter(id => id !== matchId)
                : [...prev, matchId]
        );
        
        // Send to backend
        router.post(route('fan.match-schedule.favorite', matchId), {}, {
            preserveScroll: true
        });
    };

    const isFavorite = (matchId) => favorites.includes(matchId);

    // Get country flag
    const getCountryFlag = (venue) => {
        // Try to extract country from venue name or use default
        for (const [country, flag] of Object.entries(TEAM_FLAGS)) {
            if (venue && venue.toLowerCase().includes(country.toLowerCase())) {
                return flag;
            }
        }
        return '🏟️';
    };

    // Format date
    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    return (
        <FanLayout user={auth.user} header="Match Schedule">
            <Head title="Match Schedule" />

            <div>
                <DashboardHero role="fan" 
                    title={isConcluded ? `${tournament?.short_name || 'Tournament'} — Results` : 'Match Schedule'}
                    subtitle={isConcluded
                        ? `${tournament?.name || 'Tournament'} has concluded. View all results below.`
                        : `${tournament?.name || 'Tournament'} — ${tournament?.hosts?.join(', ') || ''}`
                    }
                    breadcrumbs={[{ label: isConcluded ? 'Results' : 'Schedule' }]}
                    bgImage="/assets/img/fan/backgrounds/gaming_hero.png"
                >
                    {tournament?.start_date && tournament?.end_date && (
                        <div className="d-flex align-items-center gap-2">
                            <span className="tfe-pill tfe-pill--info">
                                <i className={`fas ${isConcluded ? 'fa-check' : 'fa-play'} me-2`}></i>
                                {new Date(tournament.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            <span className="text-white-50 small">to</span>
                            <span className="tfe-pill tfe-pill--live">
                                <i className="fas fa-trophy me-2"></i>
                                {new Date(tournament.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                    )}
                </DashboardHero>

                <SummaryTiles
                    className="mb-5"
                    items={[
                        { label: 'Matches',  value: allFixtures.length, icon: 'fa-futbol',         accent: 'red',  subtext: isConcluded ? 'Total played' : 'Full fixtures' },
                        { label: 'Teams',    value: teams.length || 48, icon: 'fa-users',          accent: 'blue', subtext: 'Qualified nations' },
                        { label: 'Favorites',value: favorites.length,   icon: 'fa-star',           accent: 'rose', subtext: 'Saved matches' },
                        { label: 'Stadiums', value: allFixtures.length > 0 ? [...new Set(allFixtures.map(m => m.venue))].length : 16, icon: 'fa-map-marker-alt', accent: 'teal', subtext: 'Host venues' },
                    ]}
                />

                {/* Tab Navigation */}
                <div className="d-flex flex-wrap gap-2 mb-4">
                    <button
                        type="button"
                        onClick={() => { setActiveTab('groups'); setSelectedGroup(null); }}
                        aria-pressed={activeTab === 'groups'}
                        className="tfe-btn tfe-btn--sm"
                    >
                        <i className="fas fa-layer-group"></i> Group Stage
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('knockout')}
                        aria-pressed={activeTab === 'knockout'}
                        className="tfe-btn tfe-btn--sm"
                    >
                        <i className="fas fa-trophy"></i> Knockout Rounds
                    </button>
                </div>

                {/* Group Filters (only for Group Stage) */}
                {activeTab === 'groups' && (
                    <div className="d-flex flex-wrap gap-2 mb-4">
                        <button
                            type="button"
                            onClick={() => setSelectedGroup(null)}
                            aria-pressed={selectedGroup === null}
                            className="tfe-btn tfe-btn--sm"
                        >
                            All Groups
                        </button>
                        {groups.map(group => (
                            <button
                                type="button"
                                key={group}
                                onClick={() => setSelectedGroup(group)}
                                aria-pressed={selectedGroup === group}
                                className="tfe-btn tfe-btn--sm"
                            >
                                Group {group}
                            </button>
                        ))}
                    </div>
                )}

                {/* Matches List */}
                <div className="matches-schedule">
                    {Object.keys(matchesByDate).length > 0 ? (
                        Object.entries(matchesByDate)
                            .sort(([a], [b]) => new Date(a) - new Date(b))
                            .map(([date, matches]) => (
                            <div key={date} className="match-day-section">
                                <h3 className="match-day-title">
                                    <i className="far fa-calendar"></i>
                                    {formatDate(date)}
                                    <span className="match-count">{matches.length} matches</span>
                                </h3>
                                <div className="matches-grid">
                                    {matches.map((match) => (
                                        <MatchCard 
                                            key={match.id}
                                            match={match}
                                            isFavorite={isFavorite(match.id)}
                                            onToggleFavorite={toggleFavorite}
                                            mode="schedule"
                                        />
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="tfe-empty">
                            <div className="tfe-empty__icon"><i className="fas fa-calendar-times"></i></div>
                            <div className="tfe-empty__title">No matches found</div>
                            <div className="tfe-empty__body">Try selecting a different filter.</div>
                        </div>
                    )}
                </div>

                {/* Legend */}
                <div className="schedule-legend">
                    {tournament?.hosts?.map((host, i) => (
                        <div key={host} className="legend-item">
                            <span className={`legend-dot host-${host.toLowerCase().replace(/\s+/g, '-')}`}></span> {host}
                        </div>
                    )) || (
                        <>
                            <div className="legend-item"><span className="legend-dot host-usa"></span> USA</div>
                            <div className="legend-item"><span className="legend-dot host-mexico"></span> Mexico</div>
                            <div className="legend-item"><span className="legend-dot host-canada"></span> Canada</div>
                        </>
                    )}
                </div>
            </div>
        </FanLayout>
    );
}
