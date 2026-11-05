import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchesQuery, normalizeText, shownLabel } from '../../resources/js/lib/pageFind.js';

test('every word must match, in any order, ignoring case and accents', () => {
    assert.ok(matchesQuery('REQ-0003 Demo Fan Nairobi group stage pending', 'nairobi PENDING'));
    assert.ok(!matchesQuery('REQ-0003 Demo Fan Nairobi group stage approved', 'nairobi pending'));
    assert.ok(matchesQuery('Côte d’Ivoire vs Mali', 'cote'));
    assert.equal(normalizeText('Ñandú'), 'nandu');
});

test('an empty or blank query matches everything', () => {
    assert.ok(matchesQuery('anything', ''));
    assert.ok(matchesQuery('anything', '   '));
});

test('the count line says what is hidden', () => {
    assert.equal(shownLabel(12, 12), '12 shown');
    assert.equal(shownLabel(4, 12), '4 of 12 shown');
});
