import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    getRateForCurrency,
    EXCHANGE_RATES,
    SUPPORTED_CURRENCIES,
} from '../../resources/js/Data/BudgetPricingData.js';

// Sprint 28 — the calculator computes budgets in USD and converts once
// at display using getRateForCurrency. These tests lock the shape of
// that adapter so a bad rate table or missing currency shows up in CI
// instead of on the fan's screen as a zeroed total.

test('USD is the base currency — rate is exactly 1', () => {
    assert.equal(getRateForCurrency({}, 'USD'), 1);
});

test('known currencies return their configured static rate', () => {
    assert.equal(getRateForCurrency({}, 'EUR'), EXCHANGE_RATES.EUR);
    assert.equal(getRateForCurrency({}, 'GBP'), EXCHANGE_RATES.GBP);
    assert.equal(getRateForCurrency({}, 'KES'), EXCHANGE_RATES.KES);
    assert.equal(getRateForCurrency({}, 'ZAR'), EXCHANGE_RATES.ZAR);
    assert.equal(getRateForCurrency({}, 'NGN'), EXCHANGE_RATES.NGN);
    assert.equal(getRateForCurrency({}, 'XOF'), EXCHANGE_RATES.XOF);
});

test('a tournament may override a currency rate via pricing.exchange_rates', () => {
    const pricing = { exchange_rates: { EUR: 0.95, KES: 145 } };
    assert.equal(getRateForCurrency(pricing, 'EUR'), 0.95);
    assert.equal(getRateForCurrency(pricing, 'KES'), 145);
    // Currencies not overridden fall back to the static table.
    assert.equal(getRateForCurrency(pricing, 'GBP'), EXCHANGE_RATES.GBP);
});

test('an unknown currency falls back to 1 so display never zeroes', () => {
    assert.equal(getRateForCurrency({}, 'XXX'), 1);
});

test('a bad override (non-numeric) falls back to the static table', () => {
    const pricing = { exchange_rates: { EUR: 'nope' } };
    assert.equal(getRateForCurrency(pricing, 'EUR'), EXCHANGE_RATES.EUR);
});

test('SUPPORTED_CURRENCIES lists every currency with a rate', () => {
    for (const c of SUPPORTED_CURRENCIES) {
        assert.ok(
            typeof EXCHANGE_RATES[c.code] === 'number' && EXCHANGE_RATES[c.code] > 0,
            `SUPPORTED_CURRENCIES entry ${c.code} must have a positive rate in EXCHANGE_RATES`,
        );
    }
});

test('round-trip through USD is lossless for a config-only tournament', () => {
    // usd = displayValue / rate, displayValue = usd * rate — same rate both ways.
    const usdAmount = 4200;
    for (const code of ['EUR', 'GBP', 'KES', 'ZAR', 'NGN', 'XOF']) {
        const rate = getRateForCurrency({}, code);
        const display = usdAmount * rate;
        const usdBack = display / rate;
        assert.equal(usdBack, usdAmount);
    }
});
