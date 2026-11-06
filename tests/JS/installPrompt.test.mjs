import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installMode, recordVisit, shouldOffer, DISMISS_DAYS } from '../../resources/js/lib/installPrompt.js';

const IPHONE_SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const IPHONE_CHROME = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1';
const IPHONE_INSTAGRAM = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22A3354 Instagram 350.0';
const DESKTOP = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

test('the browser decides how we can offer it', () => {
    assert.equal(installMode({ userAgent: DESKTOP, hasNativePrompt: true }), 'native');
    assert.equal(installMode({ userAgent: IPHONE_SAFARI }), 'ios');
    assert.equal(installMode({ userAgent: IPHONE_CHROME }), null, 'only Safari can add to the iOS home screen');
    assert.equal(installMode({ userAgent: IPHONE_INSTAGRAM }), null, 'nor can an in-app browser');
    assert.equal(installMode({ userAgent: DESKTOP }), null);
});

test('never once installed', () => {
    assert.equal(installMode({ userAgent: IPHONE_SAFARI, standalone: true }), null);
    assert.equal(installMode({ hasNativePrompt: true, standalone: true }), null);
});

test('not on a first visit, and not again for a while after "Not now"', () => {
    const now = Date.UTC(2026, 10, 6);
    assert.equal(shouldOffer({ mode: 'ios', visitDays: 1, now }), false);
    assert.equal(shouldOffer({ mode: 'ios', visitDays: 2, now }), true);
    assert.equal(shouldOffer({ mode: 'ios', visitDays: 5, dismissedAt: now - 86400000, now }), false);
    assert.equal(shouldOffer({ mode: 'ios', visitDays: 5, dismissedAt: now - (DISMISS_DAYS + 1) * 86400000, now }), true);
    assert.equal(shouldOffer({ mode: null, visitDays: 9, now }), false);
});

test('visits are counted in days, and the list stays short', () => {
    assert.deepEqual(recordVisit([], '2026-11-06'), ['2026-11-06']);
    assert.deepEqual(recordVisit(['2026-11-06'], '2026-11-06'), ['2026-11-06'], 'same day twice is one visit');
    assert.deepEqual(recordVisit(['2026-11-05'], '2026-11-06'), ['2026-11-05', '2026-11-06']);
    assert.equal(recordVisit(Array.from({ length: 12 }, (_, i) => `2026-10-${10 + i}`), '2026-11-06').length, 10);
    assert.deepEqual(recordVisit('garbage', '2026-11-06'), ['2026-11-06']);
});
