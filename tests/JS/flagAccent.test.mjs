import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickAccentFromPixels, ensureReadable, toHex } from '../../resources/js/lib/flagAccent.js';

// Sprint 54 — team-framed avatars.
//
// The ring colour is read from the flag artwork rather than a hand-written
// national-colour table, so this guards the reduction that turns pixels into
// one colour. The failure it exists to catch is a flag whose ring comes out
// white (the field, not the colour) or black (the outline) — which would make
// every nation look the same on a dark canvas.

/** Build RGBA pixel data from a list of [r,g,b,count] runs. */
function pixels(...runs) {
    const out = [];
    for (const [r, g, b, count] of runs) {
        for (let i = 0; i < count; i += 1) out.push(r, g, b, 255);
    }
    return out;
}

test('a single solid colour comes back as itself', () => {
    assert.equal(pickAccentFromPixels(pixels([220, 20, 60, 50])), '#dc143c');
});

test('the vivid stripe beats a larger white field', () => {
    // Japan-shaped: mostly white, one red disc. The red is the answer.
    const accent = pickAccentFromPixels(pixels([255, 255, 255, 400], [188, 0, 45, 60]));
    assert.equal(accent, '#bc002d');
});

test('the vivid stripe beats a larger black field', () => {
    const accent = pickAccentFromPixels(pixels([0, 0, 0, 400], [0, 155, 72, 80]));
    assert.equal(accent, '#009b48');
});

test('a tri-colour picks the band with the most vivid coverage', () => {
    // Equal thirds green / white / red — a white ring would be the bug.
    const accent = pickAccentFromPixels(pixels(
        [0, 146, 70, 100],
        [255, 255, 255, 100],
        [206, 43, 55, 100],
    ));
    assert.notEqual(accent, '#ffffff');
    assert.ok(['#009246', '#ce2b37'].includes(accent), `got ${accent}`);
});

test('a one-pixel detail does not outvote a whole stripe', () => {
    // A vivid crest speck must not beat the field it sits on.
    const accent = pickAccentFromPixels(pixels([0, 90, 160, 500], [255, 0, 255, 1]));
    assert.equal(accent, '#005aa0');
});

test('an all-greyscale flag still yields a colour rather than null', () => {
    const accent = pickAccentFromPixels(pixels([255, 255, 255, 100], [20, 20, 20, 100]));
    assert.ok(/^#[0-9a-f]{6}$/.test(accent), `got ${accent}`);
});

test('fully transparent pixels are ignored', () => {
    const data = [255, 0, 0, 0, 255, 0, 0, 0, 0, 200, 0, 255];
    assert.equal(pickAccentFromPixels(data), '#00c800');
});

test('empty or unusable input is null, not a crash', () => {
    assert.equal(pickAccentFromPixels([]), null);
    assert.equal(pickAccentFromPixels(null), null);
    assert.equal(pickAccentFromPixels(undefined), null);
    // Every pixel transparent — nothing to pick.
    assert.equal(pickAccentFromPixels([10, 20, 30, 0]), null);
});

test('near-identical shades collapse into one bucket', () => {
    // Anti-aliasing and compression noise must not split a stripe in two.
    const accent = pickAccentFromPixels(pixels([200, 16, 46, 50], [202, 18, 48, 50]));
    assert.equal(accent, '#c9112f');
});

// ── Readability lift ────────────────────────────────────────────────────

test('a dark colour is lifted until it reads on the dark canvas', () => {
    const lifted = ensureReadable('#000d2b');
    assert.notEqual(lifted, '#000d2b');
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(lifted.slice(i, i + 2), 16));
    const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    assert.ok(luma >= 0.31, `luma ${luma} should clear the floor`);
});

test('an already-bright colour is left alone', () => {
    assert.equal(ensureReadable('#ffcc00'), '#ffcc00');
});

test('the lift keeps the hue', () => {
    // Pure dark blue must stay blue-dominant, not wash to grey.
    const lifted = ensureReadable('#001133');
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(lifted.slice(i, i + 2), 16));
    assert.ok(b > r && b > g, `expected blue-dominant, got ${lifted}`);
});

test('pure black lifts to a visible neutral rather than dividing by zero', () => {
    const lifted = ensureReadable('#000000');
    assert.ok(/^#[0-9a-f]{6}$/.test(lifted));
    assert.notEqual(lifted, '#000000');
});

test('a malformed value passes through untouched', () => {
    assert.equal(ensureReadable('not-a-colour'), 'not-a-colour');
    assert.equal(ensureReadable(null), null);
});

test('toHex clamps out-of-range channels', () => {
    assert.equal(toHex(-20, 300, 128), '#00ff80');
});
