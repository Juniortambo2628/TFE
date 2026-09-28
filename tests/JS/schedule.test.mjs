import test from 'node:test';
import assert from 'node:assert/strict';

import {
    formatDateRange,
    formatSchedule,
    hasEnded,
    toLocalInput,
} from '../../resources/js/lib/schedule.js';

test('toLocalInput produces the exact shape datetime-local accepts', () => {
    // Anything else leaves the input blank with no error shown.
    assert.match(toLocalInput(new Date(2026, 5, 12, 9, 5)), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    assert.equal(toLocalInput(new Date(2026, 5, 12, 9, 5)), '2026-06-12T09:05');
});

test('toLocalInput uses LOCAL parts, never UTC', () => {
    // toISOString() would shift the time the partner typed by the host's
    // offset — the bug this helper exists to prevent.
    const d = new Date(2026, 0, 1, 0, 30);

    assert.equal(toLocalInput(d), '2026-01-01T00:30');
});

test('toLocalInput round-trips its own output', () => {
    const once = toLocalInput(new Date(2026, 5, 12, 14, 0));

    assert.equal(toLocalInput(once), once);
});

test('toLocalInput is empty for null, undefined and rubbish', () => {
    assert.equal(toLocalInput(null), '');
    assert.equal(toLocalInput(undefined), '');
    assert.equal(toLocalInput(''), '');
    assert.equal(toLocalInput('not a date'), '');
});

test('formatDateRange collapses a same-day range to one date', () => {
    const d = new Date(2026, 5, 12, 9, 0);

    assert.equal(formatDateRange(d, new Date(2026, 5, 12, 17, 0)), '12 Jun 2026');
});

test('formatDateRange keeps one month name when the range is inside it', () => {
    assert.equal(
        formatDateRange(new Date(2026, 5, 12), new Date(2026, 5, 15)),
        '12–15 Jun 2026',
    );
});

test('formatDateRange spans two months in one year', () => {
    assert.equal(
        formatDateRange(new Date(2026, 5, 28), new Date(2026, 6, 3)),
        '28 Jun – 3 Jul 2026',
    );
});

test('formatDateRange spans a year boundary with both years', () => {
    assert.equal(
        formatDateRange(new Date(2026, 11, 28), new Date(2027, 0, 3)),
        '28 Dec 2026 – 3 Jan 2027',
    );
});

test('formatDateRange handles one open end', () => {
    assert.equal(formatDateRange(new Date(2026, 5, 12), null), 'From 12 Jun 2026');
    assert.equal(formatDateRange(null, new Date(2026, 5, 15)), 'Until 15 Jun 2026');
});

test('formatDateRange is null when there is no date at all', () => {
    // A listing with no schedule is legitimate — a grant open all season.
    assert.equal(formatDateRange(null, null), null);
});

test('formatSchedule joins the range and the place', () => {
    assert.equal(
        formatSchedule(new Date(2026, 5, 12), new Date(2026, 5, 15), 'Kasarani, Nairobi'),
        '12–15 Jun 2026 · Kasarani, Nairobi',
    );
});

test('formatSchedule falls back to whichever half exists', () => {
    assert.equal(formatSchedule(null, null, 'Nationwide'), 'Nationwide');
    assert.equal(formatSchedule(new Date(2026, 5, 12), null, null), 'From 12 Jun 2026');
});

test('formatSchedule is null when it has nothing to say', () => {
    // The caller must not render an empty chip.
    assert.equal(formatSchedule(null, null, null), null);
    assert.equal(formatSchedule(null, null, '   '), null);
});

test('hasEnded compares against a supplied now, and is false without an end', () => {
    const now = new Date(2026, 5, 20);

    assert.equal(hasEnded(new Date(2026, 5, 15), now), true);
    assert.equal(hasEnded(new Date(2026, 5, 25), now), false);
    // No end date is not the same as "finished".
    assert.equal(hasEnded(null, now), false);
});
