import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatMoney, titleCase } from '../../resources/js/lib/utils.js';

// Sprint 24 — regression guard for Sprint 23. formatMoney's default
// currency was 'KES' with an en-KE locale for months (Sprints 3–22);
// 74 downstream callers depended on the default without noticing.
// This test locks the default to USD so any future currency flip
// happens deliberately, not by accident.

test('formatMoney defaults to USD (en-US) formatting', () => {
    const formatted = formatMoney(4200);
    assert.equal(formatted, '$4,200.00',
        'Default currency must be USD — check resources/js/lib/utils.js');
});

test('formatMoney with USD explicit produces the same output as the default', () => {
    assert.equal(formatMoney(4200), formatMoney(4200, 'USD'));
});

test('formatMoney still honours an explicit non-USD currency', () => {
    const kes = formatMoney(4200, 'KES');
    assert.match(kes, /KES|Ksh/, 'Explicit KES caller (e.g. Fan/Payments) must still format as KES');
});

test('formatMoney treats null / undefined / falsy amounts as 0', () => {
    assert.equal(formatMoney(null), '$0.00');
    assert.equal(formatMoney(undefined), '$0.00');
    assert.equal(formatMoney(0), '$0.00');
});

test('formatMoney does NOT return a KES / Ksh string by default', () => {
    const formatted = formatMoney(1);
    assert.doesNotMatch(formatted, /KES|Ksh|₦/,
        'Default output must not contain KES, Ksh or the Naira sign — those were pre-Sprint 23 regressions');
});

test('titleCase sentence-cases a slug without touching a written label', () => {
    // It replaced `text-transform: capitalize` on the AccentCard status,
    // which re-cased every multi-word label it was handed.
    assert.equal(titleCase('upcoming'), 'Upcoming');
    assert.equal(titleCase('school_community'), 'School community');
    assert.equal(titleCase('Running a club'), 'Running a club');
    assert.equal(titleCase('Health & wellbeing'), 'Health & wellbeing');
});

test('titleCase passes through anything that is not a filled string', () => {
    assert.equal(titleCase(''), '');
    assert.equal(titleCase(null), null);
    assert.equal(titleCase(undefined), undefined);
});

import { formatNumber, formatDateTime } from '../../resources/js/lib/utils.js';

test('formatNumber is pinned to en-US grouping', () => {
    assert.equal(formatNumber(1234567), '1,234,567');
    assert.equal(formatNumber('42000'), '42,000');
    assert.equal(formatNumber(1234.567, 1), '1,234.6');
});

test('formatNumber renders junk as 0 rather than NaN', () => {
    assert.equal(formatNumber(undefined), '0');
    assert.equal(formatNumber('abc'), '0');
});

test('formatDateTime is blank for a missing or invalid date', () => {
    assert.equal(formatDateTime(null), '');
    assert.equal(formatDateTime('not a date'), '');
    assert.match(formatDateTime('2027-06-14T19:00:00Z', { timeZone: 'UTC' }), /^Jun 14, 2027, 7:00\s?PM$/);
});
