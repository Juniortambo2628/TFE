import test from 'node:test';
import assert from 'node:assert/strict';
import { savingsProgress } from '../../resources/js/lib/savings.js';

test('progress counts only the goal currency', () => {
    const p = savingsProgress({ balances: { USD: 250, KES: 99999 }, goal: { target_amount: 1000, currency: 'USD' } });
    assert.equal(p.saved, 250);
    assert.equal(p.pct, 25);
});

test('monthly pace spreads the remainder over the months left', () => {
    const p = savingsProgress({
        balances: { KES: 20000 },
        goal: { target_amount: 140000, currency: 'KES', target_date: '2027-07-01' },
        now: new Date('2027-01-15'),
    });
    assert.equal(p.perMonth, 20000); // 120000 over 6 months
});

test('no goal or no target means no progress bar', () => {
    assert.equal(savingsProgress({ balances: { USD: 1 } }), null);
    assert.equal(savingsProgress({ goal: { target_amount: 0 } }), null);
});

test('a goal already met caps at 100% and asks for nothing more', () => {
    const p = savingsProgress({ balances: { USD: 1500 }, goal: { target_amount: 1000, currency: 'USD', target_date: '2030-01-01' } });
    assert.equal(p.pct, 100);
    assert.equal(p.perMonth, null);
});
