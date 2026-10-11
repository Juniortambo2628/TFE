import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sheetOffset, shouldDismissSheet, SHEET_DISTANCE } from '../../resources/js/lib/sheetDrag.js';

test('the sheet only follows a downward drag', () => {
    assert.equal(sheetOffset(100, 160), 60);
    assert.equal(sheetOffset(100, 40), 0);
});

test('a long pull closes, a short slow one springs back', () => {
    assert.equal(shouldDismissSheet(SHEET_DISTANCE, 2000), true);
    assert.equal(shouldDismissSheet(60, 600), false);
});

test('a quick flick closes even when short', () => {
    assert.equal(shouldDismissSheet(60, 50), true);
});

test('a twitch is not a flick', () => {
    assert.equal(shouldDismissSheet(10, 5), false);
    assert.equal(shouldDismissSheet(0, 0), false);
});
