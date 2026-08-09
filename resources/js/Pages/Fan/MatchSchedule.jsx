import React, { useState } from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Head, router } from '@inertiajs/react';
import '../../../css/fan/fan-pages.css';
import DashboardHero from '@/Components/Common/DashboardHero';
import MatchCard from '@/Components/Fan/MatchCard';

export default function MatchSchedule({ auth, allFixtures = [], groups = [], stages = [], teams = [], stats = {}, userFavorites = [] }) {
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
        // Default flags for known countries - will be enhanced with dynamic data
        const flags = { 'USA': '🇺🇸', 'Mexico': '🇲🇽', 'Canada': '🇨🇦' };
        // Try to extract country from venue name or use default
        for (const [country, flag] of Object.entries(flags)) {
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
                    title="Match Schedule"
                    subtitle="FIFA World Cup 2026 - USA, Mexico & Canada"
                    breadcrumbs={[{ label: 'Schedule' }]}
                    bgImage="/assets/img/fan/backgrounds/gaming_hero.png"
                >
                    <div className="tournament-dates d-flex align-items-center gap-3">
                        <span className="badge bg-secondary px-3 py-2"><i className="fas fa-play text-danger me-2"></i> June 11</span>
                        <span className="text-white-50">to</span>
                        <span className="badge bg-danger px-3 py-2"><i className="fas fa-trophy text-white me-2"></i> July 19</span>
                    </div>
                </DashboardHero>

                {/* Stats Cards */}
                {/* Summary Cards */}
                <div className="summary-cards-grid mb-5">
                    <div className="fan-card-premium glow-red">
                        <div className="card-content-gaming">
                            <div className="card-icon-gaming" style={{ color: '#ff2d55' }}>
                                <i className="fas fa-futbol"></i>
                            </div>
                            <h3 className="card-title-gaming">Matches</h3>
                            <div className="card-value-gaming">{allFixtures.length}</div>
                            <div className="text-white-50 small mt-1">Full Fixtures</div>
                        </div>
                    </div>
                    
                    <div className="fan-card-premium glow-blue">
                        <div className="card-content-gaming">
                            <div className="card-icon-gaming" style={{ color: '#00d2ff' }}>
                                <i className="fas fa-users"></i>
                            </div>
                            <h3 className="card-title-gaming">Teams</h3>
                            <div className="card-value-gaming">{teams.length || 48}</div>
                            <div className="text-white-50 small mt-1">Qualified Nations</div>
                        </div>
                    </div>

                    <div className="fan-card-premium glow-red">
                        <div className="card-content-gaming">
                            <div className="card-icon-gaming" style={{ color: '#ff2d55' }}>
                                <i className="fas fa-star"></i>
                            </div>
                            <h3 className="card-title-gaming">Favorites</h3>
                            <div className="card-value-gaming">{favorites.length}</div>
                            <div className="text-white-50 small mt-1">Saved Matches</div>
                        </div>
                    </div>

                    <div className="fan-card-premium glow-blue">
                        <div className="card-content-gaming">
                            <div className="card-icon-gaming" style={{ color: '#00d2ff' }}>
                                <i className="fas fa-map-marker-alt"></i>
                            </div>
                            <h3 className="card-title-gaming">Stadiums</h3>
                            <div className="card-value-gaming">{allFixtures.length > 0 ? [...new Set(allFixtures.map(m => m.venue))].length : 16}</div>
                            <div className="text-white-50 small mt-1">Host Venues</div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="schedule-tabs d-flex flex-wrap gap-2 mb-4">
                    <button 
                        onClick={() => { setActiveTab('groups'); setSelectedGroup(null); }}
                        className={`btn-glass-pill btn-glass-pill-sm ${activeTab === 'groups' ? 'active-glass' : ''}`}
                    >
                        <i className="fas fa-layer-group"></i> Group Stage
                    </button>
                    <button 
                        onClick={() => setActiveTab('knockout')}
                        className={`btn-glass-pill btn-glass-pill-sm ${activeTab === 'knockout' ? 'active-glass' : ''}`}
                    >
                        <i className="fas fa-trophy"></i> Knockout Rounds
                    </button>
                </div>

                {/* Group Filters (only for Group Stage) */}
                {activeTab === 'groups' && (
                    <div className="group-filter-tabs d-flex flex-wrap gap-2 mb-4">
                        <button 
                            onClick={() => setSelectedGroup(null)}
                            className={`btn-glass-pill btn-glass-pill-sm ${selectedGroup === null ? 'active-glass' : ''}`}
                        >
                            All Groups
                        </button>
                        {groups.map(group => (
                            <button
                                key={group}
                                onClick={() => setSelectedGroup(group)}
                                className={`btn-glass-pill btn-glass-pill-sm ${selectedGroup === group ? 'active-glass' : ''}`}
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
                        <div className="content-card empty-state">
                            <i className="fas fa-calendar-times"></i>
                            <h3>No matches found.</h3>
                            <p>Try selecting a different filter.</p>
                        </div>
                    )}
                </div>

                {/* Legend */}
                <div className="schedule-legend">
                    <div className="legend-item">
                        <span className="legend-dot host-usa"></span> USA (11 venues)
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot host-mexico"></span> Mexico (3 venues)
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot host-canada"></span> Canada (2 venues)
                    </div>
                </div>
            </div>
        </FanLayout>
    );
}
