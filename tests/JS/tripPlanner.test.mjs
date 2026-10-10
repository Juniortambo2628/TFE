import test from 'node:test';
import assert from 'node:assert/strict';

import { estimateTrip } from '../../resources/js/lib/tripEstimate.js';
import { packageTotal, rankPackages } from '../../resources/js/lib/tripPlanner.js';

test('estimateTrip prices selected matches and sums the breakdown to the total', () => {
    const r = estimateTrip({}, {
        matches: [{ venue: 'X', stage: 'Group Stage' }, { venue: 'X', stage: 'Final' }],
        nights: 5,
    });
    assert.equal(r.matchCount, 2);
    assert.equal(r.breakdown.match_tickets, 150 + 1500);
    const sum = Object.values(r.breakdown).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - r.total) < 1e-6);
});

test('estimateTrip scales per-person costs by group size but not the visa', () => {
    const one = estimateTrip({}, { quickEstimate: true, quickMatches: 3, includeVisa: false });
    const two = estimateTrip({}, { quickEstimate: true, quickMatches: 3, includeVisa: false, groupSize: 2 });
    assert.equal(two.breakdown.match_tickets, one.breakdown.match_tickets * 2);
    assert.equal(two.breakdown.flights, one.breakdown.flights * 2);
});

test('estimateTrip honours the merchandise toggle', () => {
    const r = estimateTrip({}, { quickEstimate: true, quickMatches: 2, includeMerchandise: false });
    assert.equal(r.breakdown.merchandise, 0);
});

test('rankPackages puts the closest night count first and sold-out last', () => {
    const ranked = rankPackages([
        { id: 1, nights: 14, base_price: 100 },
        { id: 2, nights: 7, base_price: 900, is_sold_out: true },
        { id: 3, nights: 6, base_price: 500 },
    ], { nights: 7 });
    assert.deepEqual(ranked.map((p) => p.id), [3, 1, 2]);
});

test('packageTotal is per traveller', () => {
    assert.equal(packageTotal({ base_price: 250 }, 3), 750);
    assert.equal(packageTotal({ base_price: 250 }, 0), 250);
});
