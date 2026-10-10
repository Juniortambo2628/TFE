import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldReport, MAX_PER_PAGE } from '../../resources/js/lib/errorReporter.js';

const base = { origin: 'https://tfe.okjtech.co.ke', page: '/fan/budget-calculator' };

test('a real error from our own bundle is reported once', () => {
    const seen = new Set();
    const e = { ...base, message: 'x is undefined', source: 'https://tfe.okjtech.co.ke/build/assets/app.js' };
    assert.equal(shouldReport(e, seen), true);
    assert.equal(shouldReport(e, seen), false, 'duplicate on the same page');
});

test('extension and browser noise is dropped', () => {
    assert.equal(shouldReport({ ...base, message: 'Could not establish connection. Receiving end does not exist.' }), false);
    assert.equal(shouldReport({ ...base, message: 'boom', source: 'chrome-extension://abc/serpBadge.js' }), false);
    assert.equal(shouldReport({ ...base, message: 'Script error.' }), false);
    assert.equal(shouldReport({ ...base, message: 'ResizeObserver loop completed with undelivered notifications.' }), false);
});

test('third-party scripts are not ours to fix', () => {
    assert.equal(shouldReport({ ...base, message: 'boom', source: 'https://ads.example.com/x.js' }), false);
});

test('nothing is reported from the bank-savings pages', () => {
    assert.equal(shouldReport({ ...base, page: '/fan/bank-savings/3', message: 'boom' }), false);
    assert.equal(shouldReport({ ...base, page: '/sandbox-bank/onboard', message: 'boom' }), false);
});

test('a page reports at most MAX_PER_PAGE distinct errors', () => {
    const seen = new Set();
    for (let i = 0; i < MAX_PER_PAGE; i++) assert.equal(shouldReport({ ...base, message: `e${i}` }, seen), true);
    assert.equal(shouldReport({ ...base, message: 'one more' }, seen), false);
});
