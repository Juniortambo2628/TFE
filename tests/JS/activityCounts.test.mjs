import test from 'node:test';
import assert from 'node:assert/strict';
import { messagesCount, sectionCounts } from '../../resources/js/lib/activityCounts.js';

test('the Messages row and the envelope count the same things', () => {
    const badges = { 'fan.communication': 1, 'fan.journey': 2 };
    const counts = sectionCounts(badges, 3);
    assert.equal(counts['fan.communication'], 4);
    assert.equal(counts['fan.journey'], 2);
    assert.equal(messagesCount(badges, 3, 'fan'), counts['fan.communication']);
});

test('nothing is added when there are no unread messages, and the input is not changed', () => {
    const badges = { 'fan.journey': 1 };
    assert.deepEqual(sectionCounts(badges, 0), { 'fan.journey': 1 });
    sectionCounts(badges, 5);
    assert.deepEqual(badges, { 'fan.journey': 1 });
    assert.equal(messagesCount({}, 2, 'partner'), 2);
});
