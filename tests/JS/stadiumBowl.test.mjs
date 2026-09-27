import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    BASE_TIERS,
    LEN_K,
    REFERENCE_CAPACITY,
    WID_K,
    discoRadius,
    resolveTiers,
    seedForSlug,
    seededRandom,
    stadiumXZ,
    tierAreaShares,
    tiersForCapacity,
} from '../../resources/js/lib/stadiumBowl.js';

/*
 * Guards the pure geometry behind the 3D seat map.
 *
 * The important contract here is the one with PHP: `tierAreaShares()` is where
 * `App\Models\TicketTier::BLUEPRINT`'s seat shares come from, so a tier that
 * covers half the bowl holds half the seats. tests/Unit/TicketTierBlueprintTest.php
 * asserts the SAME numbers against the PHP side — change the radii in
 * BASE_TIERS and both fail until the blueprint moves with them.
 */

const PHP_BLUEPRINT_SHARES = {
    vip: 0.0650,
    premium: 0.1518,
    standard: 0.3035,
    upper: 0.4797,
};

test('tier keys and order match the PHP tier keys', () => {
    assert.deepEqual(BASE_TIERS.map((t) => t.key), ['vip', 'premium', 'standard', 'upper']);
});

test('tier area shares sum to exactly 1', () => {
    const sum = Object.values(tierAreaShares()).reduce((a, b) => a + b, 0);

    assert.ok(Math.abs(sum - 1) < 1e-12, `shares summed to ${sum}`);
});

test('tier area shares match TicketTier::BLUEPRINT', () => {
    const shares = tierAreaShares();

    Object.entries(PHP_BLUEPRINT_SHARES).forEach(([key, expected]) => {
        assert.ok(
            Math.abs(shares[key] - expected) < 0.0001,
            `${key}: geometry says ${shares[key]}, TicketTier::BLUEPRINT says ${expected}`,
        );
    });
});

test('tiers are contiguous — each ring starts where the last ended', () => {
    BASE_TIERS.slice(1).forEach((tier, i) => {
        assert.equal(tier.innerR, BASE_TIERS[i].outerR, `${tier.key} leaves a gap`);
    });
});

test('radius scales as sqrt(capacity) so seats scale with area', () => {
    // Four times the capacity must double the radius, not quadruple it.
    const small = tiersForCapacity(REFERENCE_CAPACITY / 4);
    const big = tiersForCapacity(REFERENCE_CAPACITY);

    assert.ok(Math.abs(big[3].outerR / small[3].outerR - 2) < 1e-9);
});

test('tiersForCapacity falls back to the reference for junk capacity', () => {
    const reference = tiersForCapacity(REFERENCE_CAPACITY);

    [0, -1, null, undefined, 'x'].forEach((bad) => {
        assert.deepEqual(tiersForCapacity(bad), reference, `capacity ${bad} did not fall back`);
    });
});

test('discoRadius returns the half-length on the long axis', () => {
    // Straight down +x: the outline is at exactly halfLen.
    assert.ok(Math.abs(discoRadius(0, 100, 60, null) - 100) < 1e-9);
});

test('discoRadius returns the half-width across the short axis', () => {
    assert.ok(Math.abs(discoRadius(Math.PI / 2, 100, 60, null) - 60) < 1e-9);
});

test('discoRadius never leaves the bounding box, at any angle or corner ratio', () => {
    const halfLen = 100;
    const halfWid = 60;

    [null, 1, 0.8, 0.55, 0.42, 0.1].forEach((ratio) => {
        for (let i = 0; i < 720; i += 1) {
            const a = (i / 720) * Math.PI * 2;
            const t = discoRadius(a, halfLen, halfWid, ratio);

            assert.ok(Number.isFinite(t) && t > 0, `ratio ${ratio} angle ${a}: got ${t}`);
            assert.ok(Math.abs(Math.cos(a) * t) <= halfLen + 1e-6, `ratio ${ratio}: escaped x`);
            assert.ok(Math.abs(Math.sin(a) * t) <= halfWid + 1e-6, `ratio ${ratio}: escaped z`);
        }
    });
});

test('a smaller corner ratio gives a boxier footprint, axes unchanged', () => {
    // cornerRatio is the CORNER RADIUS as a fraction of the half-width, so
    // smaller means less rounding and a squarer ground — a football-only bowl.
    // null/1 is the full discorectangle an athletics track forces, which has
    // the MOST rounding and therefore the smallest enclosed area. Getting this
    // backwards would give every track venue a football footprint.
    const enclosedArea = (ratio) => {
        const N = 4000;
        let sum = 0;

        for (let i = 0; i < N; i += 1) {
            const t = discoRadius((i / N) * Math.PI * 2, 100, 60, ratio);
            sum += 0.5 * t * t * ((Math.PI * 2) / N);
        }

        return sum;
    };

    const track = enclosedArea(null);
    const football = enclosedArea(0.42);
    const nearlySquare = enclosedArea(0.05);

    assert.ok(track < football, 'a discorectangle should enclose less than a boxier bowl');
    assert.ok(football < nearlySquare, 'a smaller ratio should be boxier still');
    // Never exceeds the bounding rectangle it is inscribed in.
    assert.ok(nearlySquare <= 4 * 100 * 60 + 1e-6);

    // The straight sides are pinned whatever the corner ratio does.
    [null, 1, 0.42, 0.05].forEach((ratio) => {
        assert.ok(Math.abs(discoRadius(0, 100, 60, ratio) - 100) < 1e-9);
        assert.ok(Math.abs(discoRadius(Math.PI / 2, 100, 60, ratio) - 60) < 1e-9);
    });
});

test('undefined and null corner ratios both mean a full discorectangle', () => {
    const a = Math.PI / 3;

    assert.equal(discoRadius(a, 100, 60, undefined), discoRadius(a, 100, 60, null));
    assert.equal(discoRadius(a, 100, 60, null), discoRadius(a, 100, 60, 1));
});

test('stadiumXZ applies the footprint proportions', () => {
    const [x] = stadiumXZ(0, 68, null);
    const [, z] = stadiumXZ(Math.PI / 2, 68, null);

    assert.ok(Math.abs(x - 68 * LEN_K) < 1e-9);
    assert.ok(Math.abs(z - 68 * WID_K) < 1e-9);
});

test('seededRandom is deterministic and stays in [0,1)', () => {
    const a = seededRandom(1337);
    const b = seededRandom(1337);

    for (let i = 0; i < 200; i += 1) {
        const v = a();

        assert.equal(v, b());
        assert.ok(v >= 0 && v < 1, `out of range: ${v}`);
    }
});

test('seedForSlug is stable per slug and differs between venues', () => {
    assert.equal(seedForSlug('moi-kasarani'), seedForSlug('moi-kasarani'));
    assert.notEqual(seedForSlug('moi-kasarani'), seedForSlug('benjamin-mkapa'));
    // Must not throw on a missing slug — an uncatalogued venue has none.
    assert.ok(Number.isFinite(seedForSlug(null)));
});

test('resolveTiers joins payload rows onto the geometry', () => {
    const tiers = resolveTiers([
        { key: 'vip', name: 'VIP Box', tier_id: 7, price: 240, capacity: 2600, sold: 1300, remaining: 1300, sold_pct: 50 },
        { key: 'upper', name: 'Upper', tier_id: 9, price: 36, capacity: 19200, sold: 0, remaining: 19200, sold_pct: 0 },
    ], 60000);

    assert.equal(tiers.length, 2, 'a tier the payload omits must be dropped, not drawn empty');
    // Geometry order wins, not payload order.
    assert.deepEqual(tiers.map((t) => t.key), ['vip', 'upper']);
    assert.equal(tiers[0].name, 'VIP Box', 'payload name must win over the default');
    assert.equal(tiers[0].tierId, 7);
    assert.equal(tiers[0].booked, 0.5);
    assert.equal(tiers[1].booked, 0);
});

test('resolveTiers keeps unknown occupancy as null, never as empty', () => {
    // This is the whole point of the flag: a ground with no ticket rows must
    // not shade as if every seat were unsold.
    const [tier] = resolveTiers([
        { key: 'vip', name: 'VIP', tier_id: null, price: null, capacity: 2600, sold: null, sold_pct: null },
    ], 60000);

    assert.equal(tier.booked, null);
    assert.equal(tier.sold, null);
    assert.equal(tier.tierId, null);
});

test('resolveTiers clamps a nonsense percentage into 0..1', () => {
    const rows = [
        { key: 'vip', name: 'VIP', sold_pct: 140 },
        { key: 'premium', name: 'Premium', sold_pct: -20 },
    ];
    const [vip, premium] = resolveTiers(rows, 60000);

    assert.equal(vip.booked, 1);
    assert.equal(premium.booked, 0);
});

test('resolveTiers tolerates a missing tier list', () => {
    assert.deepEqual(resolveTiers(null, 60000), []);
    assert.deepEqual(resolveTiers([], 60000), []);
});
