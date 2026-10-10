import test from 'node:test';
import assert from 'node:assert/strict';
import { bookingTimeline } from '../../resources/js/lib/tripTimeline.js';

const state = (steps, key) => steps.find((s) => s.key === key).state;

test('an unpaid booking is waiting on payment and claims nothing after it', () => {
    const t = bookingTimeline({ total: 1000, paid: 0, matchCount: 2 });
    assert.equal(state(t, 'paid'), 'current');
    assert.equal(state(t, 'arrangements'), 'todo');
    assert.equal(t.find((s) => s.key === 'paid').title, 'Payment due');
});

test('a paid booking moves to the partner, never to "confirmed flights"', () => {
    const t = bookingTimeline({ total: 1000, paid: 1000, status: 'confirmed', matchCount: 2, ticketsBought: 1 });
    assert.equal(state(t, 'paid'), 'done');
    assert.equal(state(t, 'arrangements'), 'current');
    assert.match(t.find((s) => s.key === 'arrangements').detail, /arranging/);
    assert.equal(t.find((s) => s.key === 'tickets').title, 'Tickets 1/2');
});

test('tickets complete only when every match has one', () => {
    assert.equal(state(bookingTimeline({ total: 1, paid: 1, matchCount: 2, ticketsBought: 2 }), 'tickets'), 'done');
});

test('after the first match the trip reads as travelled', () => {
    const t = bookingTimeline({ total: 1, paid: 1, firstMatchAt: '2020-01-01', now: new Date('2020-02-01') });
    assert.equal(state(t, 'travel'), 'done');
});

test('a cancelled booking shows nothing in progress', () => {
    const t = bookingTimeline({ status: 'cancelled', total: 100, paid: 0 });
    assert.ok(t.filter((s) => s.key !== 'booked').every((s) => s.state === 'todo'));
});
