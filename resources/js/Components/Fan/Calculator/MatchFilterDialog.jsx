import React from 'react';
import TfeModal from '@/Components/Common/TfeModal';
import MatchCard from '@/Components/Fan/MatchCard';

/**
 * "Choose filters" for the Budget Calculator's match step.
 *
 * Was a hand-rolled overlay inside BudgetCalculator.jsx with its own tab
 * strip, close button and body scroll lock — the last private dialog on a
 * fan page. It now rides on TfeModal's tab rail (the sections are freely
 * navigable, so a rail rather than StepFlow), which brings focus trap,
 * Escape and the mobile bottom-sheet behaviour with it.
 */
const STADIUM_FALLBACK = '/assets/img/backdrops/stadium-sideview.jpg';

function stageIcon(stage) {
    if (stage.includes('Final')) return 'fa-medal';
    if (stage.includes('Round')) return 'fa-futbol';
    if (stage.includes('Group')) return 'fa-users';
    return 'fa-trophy';
}

export default function MatchFilterDialog({
    open, onClose, tab, onTabChange,
    hosts, flagFor, venues, venueImageFor, stages, teams, favoriteMatches,
    selectedCountries, selectedStadiums, selectedStages, selectedTeams, selectedMatchIds,
    onToggleCountry, onToggleStadium, onToggleStage, onToggleTeam, onToggleMatch,
    onApply, onUseFavorites,
}) {
    const tabs = [
        { id: 'country', label: 'Countries', icon: 'fas fa-flag', badge: selectedCountries.length || null },
        { id: 'stadium', label: 'Stadiums', icon: 'fas fa-landmark', badge: selectedStadiums.length || null },
        { id: 'stage', label: 'Stages', icon: 'fas fa-trophy', badge: selectedStages.length || null },
        { id: 'group', label: 'Teams', icon: 'fas fa-users', badge: selectedTeams.length || null },
        { id: 'favorites', label: 'Favorites', icon: 'fas fa-star', badge: favoriteMatches.length || null },
    ];

    const isFavorites = tab === 'favorites';

    return (
        <TfeModal
            open={open}
            onClose={onClose}
            label="Budget Calculator"
            title="Filter matches"
            tabs={tabs}
            activeTab={tab}
            onTabChange={onTabChange}
            size="xl"
            footer={
                <>
                    <button type="button" className="tfe-btn" onClick={onClose}>Cancel</button>
                    <button
                        type="button"
                        className="tfe-btn tfe-btn--filled"
                        onClick={isFavorites ? onUseFavorites : onApply}
                        disabled={isFavorites && favoriteMatches.length === 0}
                    >
                        <i className="fas fa-check" aria-hidden="true"></i>
                        {isFavorites ? 'Use favorite matches' : 'Show matches'}
                    </button>
                </>
            }
        >
            {(active) => (
                <>
                    {active === 'country' && (
                        <div className="selection-grid country-grid">
                            {hosts.map((country) => {
                                const flag = flagFor(country);
                                const on = selectedCountries.includes(country);
                                return (
                                    <button
                                        type="button"
                                        key={country}
                                        aria-pressed={on}
                                        className={`selection-card country-card ${on ? 'selected' : ''}`}
                                        onClick={() => onToggleCountry(country)}
                                    >
                                        {flag
                                            ? <img src={flag} alt="" className="country-card__flag" />
                                            : <span className="country-card__initial">{country.charAt(0)}</span>}
                                        <span className="card-label country-card__label">{country}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {active === 'stadium' && (
                        <div className="selection-grid stadium-grid">
                            {venues.map((venue) => {
                                const on = selectedStadiums.includes(venue);
                                return (
                                    <button
                                        type="button"
                                        key={venue}
                                        aria-pressed={on}
                                        className={`selection-card stadium-card ${on ? 'selected' : ''}`}
                                        onClick={() => onToggleStadium(venue)}
                                    >
                                        <img
                                            src={venueImageFor(venue) || STADIUM_FALLBACK}
                                            className="card-image"
                                            alt=""
                                            loading="lazy"
                                            decoding="async"
                                            onError={(e) => { e.currentTarget.src = STADIUM_FALLBACK; }}
                                        />
                                        <span className="card-label">{venue}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {active === 'stage' && (
                        <div className="selection-grid stage-grid">
                            {stages.map((stage) => {
                                const on = selectedStages.includes(stage);
                                return (
                                    <button
                                        type="button"
                                        key={stage}
                                        aria-pressed={on}
                                        className={`selection-card ${on ? 'selected' : ''}`}
                                        onClick={() => onToggleStage(stage)}
                                    >
                                        <span className="card-icon"><i className={`fas ${stageIcon(stage)}`} aria-hidden="true"></i></span>
                                        <span className="card-label">{stage}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {active === 'group' && (
                        <div className="tfe-chip-grid">
                            {teams.map((team) => {
                                const on = selectedTeams.includes(team);
                                return (
                                    <button
                                        type="button"
                                        key={team}
                                        aria-pressed={on}
                                        className={`tfe-btn tfe-btn--sm ${on ? 'is-active' : ''}`}
                                        onClick={() => onToggleTeam(team)}
                                    >
                                        {team}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {active === 'favorites' && (
                        favoriteMatches.length > 0 ? (
                            <div className="selection-grid favorites-grid">
                                {favoriteMatches.map((match) => (
                                    <MatchCard
                                        key={match.id}
                                        match={match}
                                        isSelected={selectedMatchIds.includes(match.id)}
                                        onToggleSelect={() => onToggleMatch(match.id)}
                                        mode="calculator"
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="tfe-empty tfe-empty--inline">
                                <div className="tfe-empty__icon"><i className="fas fa-star" aria-hidden="true"></i></div>
                                <p className="tfe-empty__body">
                                    You haven&apos;t added any favorite matches yet. Mark favorites on the Match Schedule page.
                                </p>
                            </div>
                        )
                    )}
                </>
            )}
        </TfeModal>
    );
}
