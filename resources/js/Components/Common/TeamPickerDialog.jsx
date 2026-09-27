import React, { useMemo, useState, useEffect } from 'react';
import TfeModal from '@/Components/Common/TfeModal';

/**
 * TeamPickerDialog — choose the nation you support, in a dialog.
 *
 * The fan profile used to render this as a bare flag grid in the middle of
 * the edit form: ~28 tiles between "Personal details" and "Cover image", each
 * one a 9px caption, pushing the form's Save button into the middle of the
 * page. One field does not deserve a third of the page, so the field itself
 * is now a one-line trigger (`.tfe-team-field`) and the grid lives here.
 *
 * Deliberately not a `<select>`: the flag is the point — it is what frames the
 * fan's avatar (`TeamAvatar`), so picking one should show you the artwork.
 *
 * Props:
 *   open, onClose      — dialog state, owned by the caller
 *   teams              — [{ name, flag, icon }] (see `useTournamentTeams`)
 *   value              — the currently selected team name
 *   onSelect(name)     — called with the picked name; the dialog closes itself
 *   title, tournament  — copy for the header
 */
export default function TeamPickerDialog({
    open,
    onClose,
    teams = [],
    value = '',
    onSelect,
    title = 'Choose your team',
    tournament = '',
}) {
    const [query, setQuery] = useState('');

    // A stale search term from the last time it was opened is just noise.
    useEffect(() => { if (open) setQuery(''); }, [open]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return teams;
        return teams.filter((t) => t.name.toLowerCase().includes(q));
    }, [teams, query]);

    const pick = (name) => {
        onSelect(name);
        onClose();
    };

    return (
        <TfeModal open={open} title={title} onClose={onClose} size="lg">
            <div className="tfe-form-field">
                <input
                    type="search"
                    className="tfe-input"
                    placeholder="Search teams…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                />
                <p className="tfe-form-help">
                    {tournament ? `${tournament} · ` : ''}
                    {teams.length} {teams.length === 1 ? 'team' : 'teams'} to choose from.
                </p>
            </div>

            {filtered.length > 0 ? (
                <div className="tfe-team-grid">
                    {filtered.map((team) => (
                        <button
                            type="button"
                            key={team.name}
                            className={`tfe-team-card ${value === team.name ? 'is-selected' : ''}`}
                            onClick={() => pick(team.name)}
                            aria-pressed={value === team.name}
                        >
                            <span className="tfe-team-card__flag">
                                {team.flag
                                    ? <img src={team.flag} alt="" loading="lazy" />
                                    : <i className={team.icon || 'fas fa-futbol'} aria-hidden="true" />}
                            </span>
                            <span className="tfe-team-card__name">{team.name}</span>
                            {value === team.name && (
                                <i className="fas fa-check tfe-team-card__check" aria-hidden="true" />
                            )}
                        </button>
                    ))}
                </div>
            ) : (
                <div className="tfe-empty tfe-empty--inline">
                    <div className="tfe-empty__icon"><i className="fas fa-search" /></div>
                    <div className="tfe-empty__body">No team matches “{query}”.</div>
                </div>
            )}
        </TfeModal>
    );
}
