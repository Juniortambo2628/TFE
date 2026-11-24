import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    BASE_TIERS,
    bestBlock,
    blockAt,
    blockLayout,
    resolveTiers,
    standLayout,
    viewpoint,
} from '../../resources/js/lib/stadiumBowl.js';

/*
 * Guards the stands-and-blocks layout. tests/fixtures/stadium-blocks.json is
 * the contract with App\Support\StadiumLayout (tests/Unit/StadiumLayoutTest.php
 * reads the same file): a block code is what a fan's ticket is sold against,
 * so the two sides must name the same block at the same place.
 */

const fixture = JSON.parse(
    readFileSync(new URL('../fixtures/stadium-blocks.json', import.meta.url), 'utf8'),
);
const close = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

test('every tier matches the shared fixture, code for code', () => {
    fixture.tiers.forEach((expected, i) => {
        const actual = blockLayout(i + 1);

        assert.equal(actual.length, expected.length, `tier ${i + 1} block count`);
        actual.forEach((b, j) => {
            assert.equal(b.code, expected[j].code);
            assert.equal(b.stand, expected[j].stand);
            assert.ok(close(b.start, expected[j].start), `${b.code} start`);
            assert.ok(close(b.end, expected[j].end), `${b.code} end`);
        });
    });
});

test('the stands tile the whole ground with no gaps or overlaps', () => {
    const stands = standLayout();

    stands.slice(1).forEach((s, i) => assert.ok(close(s.start, stands[i].end), `${s.key} start`));
    assert.ok(close(stands[stands.length - 1].end - stands[0].start, Math.PI * 2));
});

test('codes lead with the tier number and are unique', () => {
    const codes = [1, 2, 3, 4].flatMap((n) => blockLayout(n).map((b) => b.code));

    assert.equal(new Set(codes).size, codes.length);
    assert.equal(blockLayout(3)[6].code, '307');
});

test('the halfway line is in the West Stand, the main stand', () => {
    const tiers = resolveTiers(BASE_TIERS.map((t) => ({ key: t.key })), 60000);

    assert.equal(blockAt(tiers[0], viewpoint('halfway').angle).stand, 'west');
    assert.equal(blockAt(tiers[0], viewpoint('goal').angle).stand, 'north');
    assert.equal(blockAt(tiers[0], viewpoint('corner').angle).stand, 'north_west');
});

test('blockAt finds a block for any angle, wrapping round', () => {
    const tiers = resolveTiers([{ key: 'vip' }], 60000);
    // Inside a block: PI/2 itself is a boundary (the West Stand has an even
    // number of blocks), where rounding may pick either neighbour.
    const a = Math.PI / 2 + 0.05;
    const b = blockAt(tiers[0], a);

    assert.equal(blockAt(tiers[0], a + Math.PI * 4).code, b.code);
    assert.equal(blockAt(tiers[0], a - Math.PI * 2).code, b.code);
});

test('block codes follow the tier FIXED position, even when one is missing', () => {
    // No VIP row in the payload: Premium is still tier 2, block 2xx.
    const tiers = resolveTiers([{ key: 'premium' }], 60000);

    assert.equal(tiers[0].blocks[0].code, '201');
});

test('a block with its own row carries its own figures and id', () => {
    const tiers = resolveTiers([{
        key: 'vip',
        sold_pct: 50,
        blocks: [{ id: 9, code: '107', capacity: 100, sold: 90, remaining: 10, sold_pct: 90, is_sold_out: false }],
    }], 60000);
    const own = tiers[0].blocks.find((b) => b.code === '107');
    const other = tiers[0].blocks.find((b) => b.code === '108');

    assert.equal(own.blockId, 9);
    assert.equal(own.booked, 0.9);
    assert.equal(own.inherited, false);
    // Without a row: the tier's figure, flagged, and nothing to buy.
    assert.equal(other.blockId, null);
    assert.equal(other.booked, 0.5);
    assert.equal(other.inherited, true);
});

test('an unknown tier occupancy stays unknown on every block', () => {
    const tiers = resolveTiers([{ key: 'vip', sold_pct: null }], 60000);

    assert.ok(tiers[0].blocks.every((b) => b.booked === null));
});

test('bestBlock picks the most room among real, open blocks', () => {
    const tiers = resolveTiers([{
        key: 'vip',
        blocks: [
            { id: 1, code: '101', remaining: 5, sold_pct: 90 },
            { id: 2, code: '102', remaining: 40, sold_pct: 20 },
            { id: 3, code: '103', remaining: 0, sold_pct: 100, is_sold_out: true },
        ],
    }], 60000);

    assert.equal(bestBlock(tiers[0]).code, '102');
    assert.equal(bestBlock(resolveTiers([{ key: 'vip' }], 60000)[0]), null);
});
