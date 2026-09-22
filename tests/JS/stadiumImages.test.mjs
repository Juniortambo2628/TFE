import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    normalizeVenueName,
    venueNamesMatch,
    resolveStadiumImage,
} from '../../resources/js/Data/stadiumImages.js';

/*
 * Guards the client half of stadium image resolution.
 *
 * normalizeVenueName() and venueNamesMatch() are deliberate mirrors of
 * StadiumImageService::normalize() and ::matches(). The fixtures below are the
 * shared contract between them — if you change one side, these fail until you
 * change the other. tests/Feature/StadiumImageResolutionTest.php asserts the
 * same strings against the PHP implementation.
 */

test('normalizeVenueName strips punctuation, case and generic nouns', () => {
    assert.equal(normalizeVenueName('Benjamin Mkapa Stadium'), 'benjamin mkapa');
    assert.equal(normalizeVenueName('Akii-Bua Olympic Stadium'), 'akii bua olympic');
    assert.equal(normalizeVenueName('Moi International Sports Centre, Kasarani'),
        'moi international sports centre kasarani');
    assert.equal(normalizeVenueName('  AMAAN   STADIUM  '), 'amaan');
});

test('normalizeVenueName is null-safe and tolerates non-strings', () => {
    assert.equal(normalizeVenueName(null), '');
    assert.equal(normalizeVenueName(undefined), '');
    assert.equal(normalizeVenueName(''), '');
    assert.equal(normalizeVenueName(42), '');
});

test('venueNamesMatch accepts an exact hit and a multi-word containment', () => {
    assert.ok(venueNamesMatch('benjamin mkapa', 'benjamin mkapa'));
    // "Benjamin Mkapa Stadium, Dar es Salaam" carries a trailing locality.
    assert.ok(venueNamesMatch('benjamin mkapa dar es salaam', 'benjamin mkapa'));
});

test('venueNamesMatch refuses a single-token overlap', () => {
    // The regression this guard exists for: Zanzibar Fumba Stadium and Amaan
    // Stadium are different grounds in the same city. A one-word overlap used
    // to resolve Fumba to Amaan's photo — showing the wrong stadium, which is
    // worse than showing none.
    assert.equal(venueNamesMatch('zanzibar fumba', 'zanzibar'), false);
    assert.equal(venueNamesMatch('nairobi', 'nairobi national'), false);
});

test('resolveStadiumImage prefers an exact hit over a longer containment', () => {
    const map = {
        'dodoma': '/stadiums/AFCON/dodoma_hero.webp',
        'benjamin mkapa': '/stadiums/AFCON/benjamin-mkapa_hero.webp',
    };

    assert.equal(resolveStadiumImage('Dodoma Stadium', map),
        '/stadiums/AFCON/dodoma_hero.webp');
    assert.equal(resolveStadiumImage('Benjamin Mkapa Stadium, Dar es Salaam', map),
        '/stadiums/AFCON/benjamin-mkapa_hero.webp');
});

test('resolveStadiumImage returns null rather than guessing', () => {
    const map = { 'amaan': '/stadiums/AFCON/amaan_hero.webp' };

    // Unknown ground -> null, so the caller keeps its own placeholder.
    assert.equal(resolveStadiumImage('Nakivubo Stadium', map), null);
    // Same-city different ground -> null, NOT Amaan's photo.
    assert.equal(resolveStadiumImage('Zanzibar Fumba Stadium', map), null);
});

test('resolveStadiumImage survives a missing or empty map', () => {
    // The shared Inertia prop can legitimately be undefined on a page that
    // renders before props resolve; this must not throw.
    assert.equal(resolveStadiumImage('Amaan Stadium', undefined), null);
    assert.equal(resolveStadiumImage('Amaan Stadium', null), null);
    assert.equal(resolveStadiumImage('Amaan Stadium', {}), null);
    assert.equal(resolveStadiumImage(null, { amaan: '/x.webp' }), null);
});
