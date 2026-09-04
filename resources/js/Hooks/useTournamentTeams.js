import { useMemo } from 'react';
import { useTournament } from '@/Context/TournamentContext';
import { TEAM_CODES, SPECIAL_MAPPINGS } from '@/Data/countryFlags';
import { countries } from '@/Data/countries';

/**
 * useTournamentTeams — Returns the qualifying-team option list for the
 * currently active tournament as a shape ready for SearchableSelect and
 * similar dropdowns:
 *   [{ value: 'Argentina', label: 'Argentina', iso: 'ar', flag: '/…/ar.png' }, …]
 *
 * Source of truth (in order):
 *   1. Wikipedia teams parsed for the tournament (`tournament.teams`)
 *   2. Config `team_flag_codes` (Wikipedia may be down or empty)
 *
 * This removes the WorldCup2026Data.js dependency from every profile /
 * register / auth page and makes the "supported team" dropdown reflect the
 * tournament the fan is planning for.
 */
export function useTournamentTeams({ assetUrl = '' } = {}) {
    const { tournament } = useTournament();

    return useMemo(function () {
        var options = [];
        var seen = {};

        // Layer 1 — Wikipedia team names (proper display names).
        var wikiTeams = (tournament && tournament.teams) || [];
        wikiTeams.forEach(function (t) {
            var name = t && (t.name || t);
            if (!name || seen[name.toLowerCase()]) return;
            seen[name.toLowerCase()] = true;
            options.push(buildOption(name, assetUrl));
        });

        // Layer 2 — Fill missing entries by reverse-looking-up team_flag_codes.
        var codes = (tournament && tournament.team_flag_codes) || [];
        codes.forEach(function (code) {
            // Find a display name that maps to this code — first match wins.
            var name = Object.keys(TEAM_CODES).find(function (k) {
                return TEAM_CODES[k].toLowerCase() === code.toLowerCase();
            });
            if (!name || seen[name.toLowerCase()]) return;
            seen[name.toLowerCase()] = true;
            options.push(buildOption(name, assetUrl));
        });

        options.sort(function (a, b) { return a.label.localeCompare(b.label); });
        return options;
    }, [tournament, assetUrl]);
}

function buildOption(teamName, assetUrl) {
    var iso = SPECIAL_MAPPINGS[teamName] || TEAM_CODES[teamName] || null;
    if (!iso) {
        var country = countries.find(function (c) {
            return c.value && c.value.toLowerCase() === teamName.toLowerCase();
        });
        if (country) iso = country.iso;
    }
    var flag = iso ? `${assetUrl}assets/Flags/${iso.toLowerCase()}.png` : null;
    return {
        value: teamName,
        label: teamName,
        iso: iso,
        flag: flag,
    };
}
