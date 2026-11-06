import test from 'node:test';
import assert from 'node:assert/strict';
import { statusLabel } from '../../resources/js/lib/utils.js';

test('statusLabel gives every pill one casing', () => {
    assert.equal(statusLabel('PENDING'), 'Pending');
    assert.equal(statusLabel('pending_payment'), 'Pending payment');
    assert.equal(statusLabel('approved'), 'Approved');
    assert.equal(statusLabel(''), '');
    assert.equal(statusLabel(null), '');
});
