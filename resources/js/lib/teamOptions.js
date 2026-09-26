/**
 * teamOptions — sanitation for the "supported team" option list.
 *
 * `tournament.teams` is parsed out of a Wikipedia "Qualified teams" section,
 * which is a table, not a list of nations. Every wikilink in that section came
 * through, so the fan's team picker offered — verbatim, on AFCON 2027 —
 * `1962`, `1972`, `2004`, `2025` (the previous-appearances column), `WR` and
 * `FIFA ranking` (column headers) and `Legit.ng` (a reference). None of them
 * has a flag, so they rendered as a generic football icon in the grid, which
 * is what "some team flags are missing" actually was.
 *
 * This is the client half of the guard. `WikipediaService::isLikelyTeamName()`
 * is the server half and applies the same rules at parse time — keep the two
 * in step; `tests/JS/teamOptions.test.mjs` and
 * `tests/Unit/TeamNameSanitationTest.php` assert the same fixtures against
 * each side.
 *
 * The rules are deliberately shape-based rather than an allowlist of nations:
 * a new country, or a name spelled differently by an editor, must still get
 * through. Everything rejected here is something no national team is called.
 */

/** Words that only ever appear in table furniture, never in a nation's name. */
const NON_TEAM_WORDS = [
    'ranking', 'rankings', 'fifa', 'caf', 'uefa', 'conmebol', 'concacaf',
    'afc', 'ofc', 'qualification', 'qualified', 'qualifier', 'qualifiers',
    'group', 'seeding', 'seeded', 'draw', 'appearance', 'appearances',
    'champions', 'runners', 'statistics', 'squad', 'squads', 'venue',
    'venues', 'stadium', 'confederation', 'federation', 'tournament',
    'finals', 'debut', 'total', 'best', 'performance', 'ref', 'references',
];

/**
 * Is this string plausibly the name of a national team?
 *
 * @param {string} name
 * @returns {boolean}
 */
export function isLikelyTeamName(name) {
    if (typeof name !== 'string') return false;

    const trimmed = name.trim();
    if (trimmed === '') return false;

    // No nation's name carries a digit — years, ranking numbers and
    // "Under-20" style entries all do.
    if (/\d/.test(trimmed)) return false;

    // Domains and file-ish references: "Legit.ng", "bbc.co.uk", "x/y".
    if (/[./\\@|]/.test(trimmed)) return false;

    // The shortest nations are four letters (Chad, Cuba, Iran, Mali, Togo),
    // so anything below that is an abbreviation — "WR", "ALG", "Pos".
    if (trimmed.length < 4) return false;

    // An all-caps token of any length is a code, not a display name.
    if (trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) return false;

    // Table furniture.
    const words = trimmed.toLowerCase().split(/[\s–—-]+/);
    if (words.some((w) => NON_TEAM_WORDS.includes(w))) return false;

    // A name needs letters; "—", "(a)" and friends do not qualify.
    if (!/\p{L}{3}/u.test(trimmed)) return false;

    return true;
}

/**
 * Filter a list of `{ name }` rows (or bare strings) down to plausible teams.
 *
 * @param {Array<{name?: string}|string>} teams
 * @returns {Array} the same rows, minus the junk
 */
export function filterTeamNames(teams) {
    if (!Array.isArray(teams)) return [];
    return teams.filter((t) => isLikelyTeamName(typeof t === 'string' ? t : (t && t.name)));
}
