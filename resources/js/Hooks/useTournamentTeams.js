import { useMemo } from 'react';
import { useTournament } from '@/Context/TournamentContext';
import { TEAM_CODES, SPECIAL_MAPPINGS } from '@/Data/countryFlags';
import { countries } from '@/Data/countries';
import { filterTeamNames } from '@/lib/teamOptions';

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
 *
 * Two fixes to the list itself (Sprint 56), both visible on the fan profile's
 * team picker:
 *
 *  - **Layer 1 is sanitised.** Wikipedia's "Qualified teams" section is a
 *    table, and every wikilink in it used to become an option — AFCON 2027
 *    offered `1962`, `2004`, `WR`, `FIFA ranking` and `Legit.ng` alongside
 *    the nations. `isLikelyTeamName()` (mirrored server-side in
 *    `WikipediaService`) drops them.
 *  - **Layer 2 resolves every code.** The reverse lookup only searched
 *    `TEAM_CODES`, a hand-written map of ~50 nations, so 14 of AFCON's 27
 *    configured `team_flag_codes` (`bf`, `zm`, `ml`, `ga`, …) matched nothing
 *    and were dropped — that is why half the field was missing from the grid.
 *    It falls back to `countries.js`, which carries an ISO code for all 235.
 */
export function useTournamentTeams({ assetUrl = '' } = {}) {
    const { tournament } = useTournament();

    return useMemo(function () {
        var options = [];
        var seenName = {};
        var seenIso = {};

        var push = function (name) {
            var key = name.toLowerCase();
            if (seenName[key]) return;
            var option = buildOption(name, assetUrl);
            // "Cote d'Ivoire" (TEAM_CODES) and "Côte d'Ivoire" (countries.js)
            // are one nation with one flag — keep whichever arrived first.
            if (option.iso && seenIso[option.iso.toLowerCase()]) return;
            seenName[key] = true;
            if (option.iso) seenIso[option.iso.toLowerCase()] = true;
            options.push(option);
        };

        // Layer 1 — Wikipedia team names (proper display names).
        var wikiTeams = filterTeamNames((tournament && tournament.teams) || []);
        wikiTeams.forEach(function (t) {
            push(String(t.name || t).trim());
        });

        // Layer 2 — Fill missing entries by reverse-looking-up team_flag_codes.
        var codes = (tournament && tournament.team_flag_codes) || [];
        codes.forEach(function (code) {
            var name = nameForCode(code);
            if (!name) return;
            push(name);
        });

        options.sort(function (a, b) { return a.label.localeCompare(b.label); });
        return options;
    }, [tournament, assetUrl]);
}

/**
 * ISO code → display name. `TEAM_CODES` wins (it carries the football-style
 * spellings: "Korea Republic", "IR Iran"), then the full country catalogue.
 */
function nameForCode(code) {
    if (!code) return null;
    var lower = String(code).toLowerCase();

    var fromTeams = Object.keys(TEAM_CODES).find(function (k) {
        return TEAM_CODES[k].toLowerCase() === lower;
    });
    if (fromTeams) return fromTeams;

    var country = countries.find(function (c) {
        return c.iso && c.iso.toLowerCase() === lower;
    });
    return country ? country.value : null;
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
