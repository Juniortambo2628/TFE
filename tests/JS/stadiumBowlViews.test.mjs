import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    EYE_HEIGHT,
    PARTIAL_TERRACE_K,
    VIEWPOINTS,
    inMainStand,
    nearestAngle,
    nextViewpoint,
    orbitFromEye,
    resolveTiers,
    seatView,
    standView,
    tierBaseHeights,
    viewpoint,
} from '../../resources/js/lib/stadiumBowl.js';

/*
 * Guards the camera half of the seat map: where "View from seat" puts the
 * eye, and that the orbit maths used to fly there round-trips. The geometry
 * stacks tiers with the same TIER_STEP these read, so an eye that lands
 * inside a mesh here would land inside it on screen.
 */

const PAYLOAD_TIERS = [
    { key: 'vip', name: 'VIP' },
    { key: 'premium', name: 'Premium' },
    { key: 'standard', name: 'Standard' },
    { key: 'upper', name: 'Upper' },
];
const tiers = resolveTiers(PAYLOAD_TIERS, 60000);
const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

test('tiers stack: each base is above the last, the first at ground level', () => {
    const bases = tierBaseHeights(tiers);

    assert.equal(bases[0], 0);
    bases.slice(1).forEach((b, i) => assert.ok(b > bases[i]));
});

test('the eye sits on top of its tier, at eye height', () => {
    const bases = tierBaseHeights(tiers);

    tiers.forEach((tier, i) => {
        const { eye } = seatView(tiers, tier.key, 'halfway');
        assert.ok(close(eye[1], bases[i] + tier.height + EYE_HEIGHT), tier.key);
    });
});

test('a higher tier sees from higher and further back', () => {
    const views = tiers.map((t) => seatView(tiers, t.key, 'halfway').eye);

    views.slice(1).forEach((eye, i) => {
        assert.ok(eye[1] > views[i][1], 'higher');
        assert.ok(Math.hypot(eye[0], eye[2]) > Math.hypot(views[i][0], views[i][2]), 'further');
    });
});

test('the eye is inside its own ring, not in the tier in front or behind', () => {
    tiers.forEach((tier) => {
        VIEWPOINTS.forEach((v) => {
            const { eye } = seatView(tiers, tier.key, v.key);
            const d = Math.hypot(eye[0], eye[2]);
            // Outline distance >= R (corners stretch it); bound by the
            // footprint's long and short axes either side.
            assert.ok(d > tier.innerR * 0.85 && d < tier.outerR * 1.32, `${tier.key}/${v.key}: ${d}`);
        });
    });
});

test('every seat looks at the centre spot', () => {
    assert.deepEqual(seatView(tiers, 'upper', 'corner').look, [0, 0, 0]);
});

test('halfway is on the main stand side, behind the goal on the pitch axis', () => {
    const half = seatView(tiers, 'standard', 'halfway').eye;
    const goal = seatView(tiers, 'standard', 'goal').eye;

    // World z is the negated outline z (rotateX(-PI/2)), so the main stand
    // at PI/2 is on the negative z side.
    assert.ok(close(half[0], 0, 1e-6) && half[2] < 0);
    assert.ok(goal[0] > 0 && close(goal[2], 0, 1e-6));
});

test('an unknown tier has no view rather than a guessed one', () => {
    assert.equal(seatView(tiers, 'skybox', 'halfway'), null);
    assert.equal(standView(tiers, 'skybox', 'halfway'), null);
});

test('a partial bowl drops the top tier to terracing outside the main stand', () => {
    const top = tiers[tiers.length - 1];
    const base = tierBaseHeights(tiers)[tiers.length - 1];

    const covered = seatView(tiers, 'upper', 'halfway', { partial: true }).eye[1];
    const open = seatView(tiers, 'upper', 'goal', { partial: true }).eye[1];

    assert.ok(close(covered, base + top.height + EYE_HEIGHT));
    assert.ok(close(open, base + top.height * PARTIAL_TERRACE_K + EYE_HEIGHT));
    // Only the top tier is cut down.
    assert.equal(
        seatView(tiers, 'vip', 'goal', { partial: true }).eye[1],
        seatView(tiers, 'vip', 'goal').eye[1],
    );
});

test('the main stand arc wraps correctly', () => {
    assert.ok(inMainStand(Math.PI / 2));
    assert.ok(inMainStand(Math.PI / 4));
    assert.ok(!inMainStand(0));
    assert.ok(!inMainStand(-Math.PI / 2));
    assert.ok(inMainStand(Math.PI / 2 + Math.PI * 4));
});

test('orbitFromEye round-trips to the same eye', () => {
    const { eye, look } = seatView(tiers, 'premium', 'corner');
    const o = orbitFromEye(eye, look);
    const back = [
        o.target[0] + o.radius * Math.sin(o.polar) * Math.sin(o.azimuth),
        o.target[1] + o.radius * Math.cos(o.polar),
        o.target[2] + o.radius * Math.sin(o.polar) * Math.cos(o.azimuth),
    ];

    back.forEach((v, i) => assert.ok(close(v, eye[i], 1e-9)));
});

test('the stand view looks from the pitch side, back at the tier', () => {
    const v = standView(tiers, 'standard', 'halfway');
    const camX = v.target[0] + v.radius * Math.sin(v.polar) * Math.sin(v.azimuth);
    const camZ = v.target[2] + v.radius * Math.sin(v.polar) * Math.cos(v.azimuth);

    // Camera nearer the centre than the stand it is looking at.
    assert.ok(Math.hypot(camX, camZ) < Math.hypot(v.target[0], v.target[2]));
});

test('nearestAngle takes the short way round', () => {
    const from = 0.1;
    const to = nearestAngle(from, Math.PI * 2 - 0.1);

    assert.ok(close(to, -0.1));
    assert.ok(close(nearestAngle(Math.PI * 6, 0.2), Math.PI * 6 + 0.2));
});

test('"Another view" cycles every viewpoint and wraps', () => {
    let key = VIEWPOINTS[0].key;
    const seen = [key];

    for (let i = 1; i < VIEWPOINTS.length; i += 1) {
        key = nextViewpoint(key).key;
        seen.push(key);
    }

    assert.deepEqual(seen, VIEWPOINTS.map((v) => v.key));
    assert.equal(nextViewpoint(key).key, VIEWPOINTS[0].key);
    assert.equal(viewpoint('nope').key, VIEWPOINTS[0].key);
});
