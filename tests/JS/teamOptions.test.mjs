import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isLikelyTeamName, filterTeamNames } from '../../resources/js/lib/teamOptions.js';

// Sprint 56 — the fan profile's team picker was fed every wikilink in
// Wikipedia's "Qualified teams" table. On AFCON 2027 that meant previous
// appearance years, two column headers and a news site sat in the grid
// alongside the nations, each drawn with a generic football icon because
// none of them has a flag.
//
// These fixtures are shared with tests/Unit/TeamNameSanitationTest.php —
// the server applies the same rules at parse time. Change one side and the
// other must change in the same commit.

const REAL_TEAMS = [
    'Algeria', 'Cabo Verde', 'Cameroon', "Cote d'Ivoire", "Côte d'Ivoire",
    'Egypt', 'Ghana', 'Morocco', 'Nigeria', 'Senegal', 'South Africa',
    'Tanzania', 'Tunisia', 'Uganda', 'Burkina Faso', 'Guinea-Bissau',
    'DR Congo', 'Korea Republic', 'IR Iran', 'Chad', 'Mali', 'Togo',
];

const JUNK = [
    '1962', '1972', '1978', '2004', '2019', '2025',
    'WR', 'FIFA ranking', 'Legit.ng', 'Pos', '—', '', '   ',
    'Qualification', 'Group A', 'Venues', '2026 FIFA World Cup qualification',
];

test('every real nation survives the filter', () => {
    for (const name of REAL_TEAMS) {
        assert.equal(isLikelyTeamName(name), true, `${name} must be kept`);
    }
});

test('table furniture, years and references are rejected', () => {
    for (const name of JUNK) {
        assert.equal(isLikelyTeamName(name), false, `${name} must be dropped`);
    }
});

test('short names of four letters are kept — Chad and Mali are nations', () => {
    assert.equal(isLikelyTeamName('Chad'), true);
    assert.equal(isLikelyTeamName('Cuba'), true);
    // …but three-letter codes are not.
    assert.equal(isLikelyTeamName('ALG'), false);
});

test('non-strings never pass', () => {
    for (const value of [null, undefined, 42, {}, []]) {
        assert.equal(isLikelyTeamName(value), false);
    }
});

test('filterTeamNames handles both row objects and bare strings', () => {
    const rows = [{ name: 'Ghana' }, { name: '1962' }, 'Senegal', 'WR'];
    assert.deepEqual(filterTeamNames(rows), [{ name: 'Ghana' }, 'Senegal']);
    assert.deepEqual(filterTeamNames(null), []);
});
