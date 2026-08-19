import React from 'react';
import { router } from '@inertiajs/react';
import { countryFlagMap, TEAM_FLAGS } from '@/Data/countryFlags';

/**
 * Reusable Match Card component
 * @param {Object} match - Match object with standardized format: { id, date, time, homeTeam, awayTeam, group, venue, stage, matchday }
 * @param {boolean} isFavorite - Whether the match is favorited
 * @param {function} onToggleFavorite - Callback function for toggling favorite
 * @param {boolean} isSelected - Whether the match is selected (for calculator)
 * @param {function} onToggleSelect - Callback function for toggling selection
 * @param {string} mode - 'suggested' (dashboard style), 'schedule' (schedule list style), 'calculator' (selectable style)
 * @param {boolean} showAction - Whether to show the action button (Plan Trip)
 * @param {string} conflictLabel - Optional label to show if there is a conflict
 */
const MatchCard = ({ 
    match, 
    isFavorite = false, 
    onToggleFavorite = null,
    isSelected = false,
    onToggleSelect = null,
    mode = 'schedule',
    showAction = false,
    conflictLabel = null 
}) => {
    const teamSupport = match.homeTeam; // Can be used for specific styling if needed

    const getFlagUrl = (team) => {
        const code = countryFlagMap[team.toLowerCase()];
        return code ? `/assets/Flags/${code}.png` : null;
    };

    const formatMatchDate = (dateStr) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    };

    const stadiumImages = {
        'Mexico City Stadium': 'Estadio_Azteca_desde_el_aire_1.webp',
        'Estadio Guadalajara': 'Estadio_Akron_02-07-2022_cabecera_sur_lado_derecho.webp',
        'Estadio Monterrey': 'Estadio_BBVA.webp',
        'Toronto Stadium': 'BMO_Field.webp',
        'BC Place Vancouver': 'BC_Place_Opening_Day_2011-09-30.webp',
        'Los Angeles Stadium': 'Levis_Stadium.webp',
        'New York New Jersey Stadium': 'Metlife_stadium.webp',
        'Dallas Stadium': 'Cowboys_stadium_inside_view_3.webp',
        'Atlanta Stadium': 'NRG_Stadium,_LEAGUES_CUP_2024_TIGRES_INTER_MIAMI.jnp.webp',
        'Houston Stadium': 'Nrgstadium0.webp',
        'Philadelphia Stadium': 'Lincoln_Financial_Field.webp',
        'Miami Stadium': 'Hard_Rock_Stadium_2017.webp',
        'Seattle Stadium': 'CenturyLink_Field_&_Safeco_Field.webp',
        'San Francisco Bay Area Stadium': 'Levis_Stadium.webp',
        'Boston Stadium': 'Gillette_Stadium_entrance_and_lighthouse.webp',
        'Kansas City Stadium': 'Arrowhead_Stadium_(October_27,_2019_-_2).webp'
    };

    const getStadiumBg = (venue) => {
        const img = stadiumImages[venue];
        return img ? `/assets/WC26_Stadia_HD_images/optimized_webP/${img}` : null;
    };

    const getVenueCity = (venue) => {
        // Extract city from venue name or return venue as-is
        if (!venue) return 'Unknown Venue';
        // Common venue to city mappings for WC2026
        const venueCityMap = {
            'Mexico City Stadium': 'Mexico City, Mexico',
            'Estadio Guadalajara': 'Guadalajara, Mexico',
            'Estadio Monterrey': 'Monterrey, Mexico',
            'Toronto Stadium': 'Toronto, Canada',
            'BC Place Vancouver': 'Vancouver, Canada',
            'Los Angeles Stadium': 'Los Angeles, USA',
            'New York New Jersey Stadium': 'East Rutherford, USA',
            'Dallas Stadium': 'Arlington, USA',
            'Atlanta Stadium': 'Atlanta, USA',
            'Houston Stadium': 'Houston, USA',
            'Philadelphia Stadium': 'Philadelphia, USA',
            'Miami Stadium': 'Miami Gardens, USA',
            'Seattle Stadium': 'Seattle, USA',
            'San Francisco Bay Area Stadium': 'Santa Clara, USA',
            'Boston Stadium': 'Foxborough, USA',
            'Kansas City Stadium': 'Kansas City, USA',
        };
        return venueCityMap[venue] || venue;
    };

    // Card style for 'suggested' mode (Dashboard style)
    if (mode === 'suggested') {
        return (
            <div className="suggested-match-card" style={{
                backgroundImage: getStadiumBg(match.venue) ? `url('${getStadiumBg(match.venue)}')` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}>
                <div className="match-card-stage">
                    {match.stage} {match.group ? `— Group ${match.group}` : ''} {match.matchday ? `· Matchday ${match.matchday}` : ''}
                </div>

                <div className="match-card-teams">
                    <div className="match-card-team">
                        {getFlagUrl(match.homeTeam) && (
                            <img src={getFlagUrl(match.homeTeam)} alt={match.homeTeam} />
                        )}
                        <span>{match.homeTeam}</span>
                    </div>
                    <span className="match-card-vs">VS</span>
                    <div className="match-card-team">
                        {getFlagUrl(match.awayTeam) && (
                            <img src={getFlagUrl(match.awayTeam)} alt={match.awayTeam} />
                        )}
                        <span>{match.awayTeam}</span>
                    </div>
                </div>

                <div className="match-card-meta">
                    <span><i className="fas fa-calendar-alt"></i> {formatMatchDate(match.date)}</span>
                    <span><i className="fas fa-clock"></i> {match.time} (Local)</span>
                    <span><i className="fas fa-map-marker-alt"></i> {getVenueCity(match.venue)}</span>
                </div>

                {showAction && (
                    <button 
                        className="btn-plan-trip"
                        onClick={() => router.visit(route('fan.budget-calculator') + `?match=${match.id}`)}
                    >
                        <i className="fas fa-plane"></i>
                        Plan Trip
                    </button>
                )}
            </div>
        );
    }

    // Default style for 'schedule' and 'calculator' modes
    const getCountryFlag = (country) => {
        return TEAM_FLAGS[country] || '🏟️';
    };

    // Extract country from venue for flag display
    const getVenueCountry = (venue) => {
        if (!venue) return '';
        const venueLower = venue.toLowerCase();
        if (venueLower.includes('mexico') || venueLower.includes('estadio')) return 'Mexico';
        if (venueLower.includes('canada') || venueLower.includes('toronto') || venueLower.includes('vancouver') || venueLower.includes('bmo') || venueLower.includes('bc place')) return 'Canada';
        return 'USA';
    };

    return (
        <div 
            className={`match-card ${isSelected ? 'selected' : ''} ${isFavorite ? 'favorited' : ''} ${mode === 'calculator' ? 'selectable' : ''}`}
            onClick={onToggleSelect ? () => onToggleSelect(match.id) : undefined}
            style={{
                backgroundImage: getStadiumBg(match.venue) ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.85)), url('${getStadiumBg(match.venue)}')` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative'
            }}
        >
            {onToggleFavorite && (
                <button 
                    className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(match.id);
                    }}
                    title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                    <i className={`${isFavorite ? 'fas' : 'far'} fa-star`}></i>
                </button>
            )}

            <div className="match-header d-flex justify-content-between align-items-center">
                <span className="match-venue">
                    {getCountryFlag(getVenueCountry(match.venue))} {match.venue}
                </span>
                <span className="match-time">{match.time}</span>
            </div>

            <div className="match-teams">
                <div className="team">
                    {getFlagUrl(match.homeTeam) ? (
                        <img src={getFlagUrl(match.homeTeam)} className="team-flag-sm" alt="" />
                    ) : (
                        <div className="team-avatar">{match.homeTeam.charAt(0)}</div>
                    )}
                    <div className="team-name">{match.homeTeam}</div>
                </div>
                <span className="vs-badge">VS</span>
                <div className="team">
                    {getFlagUrl(match.awayTeam) ? (
                        <img src={getFlagUrl(match.awayTeam)} className="team-flag-sm" alt="" />
                    ) : (
                        <div className="team-avatar">{match.awayTeam.charAt(0)}</div>
                    )}
                    <div className="team-name">{match.awayTeam}</div>
                </div>
            </div>

            <div className="match-footer">
                {conflictLabel && (
                    <span className="badge bg-danger me-2" title={conflictLabel}>
                        <i className="fas fa-exclamation-triangle me-1"></i> Conflict
                    </span>
                )}
                <div className="d-flex align-items-center gap-2">
                    {match.group && (
                        <span className="group-badge">Group {match.group}</span>
                    )}
                    <span className="stage-badge">{match.stage}</span>
                </div>
                {mode !== 'calculator' && (
                    <span className="capacity-badge">
                        <i className="fas fa-map-marker-alt"></i> {getVenueCity(match.venue).split(',')[0]}
                    </span>
                )}
            </div>
        </div>
    );
};

export default MatchCard;
