import test from 'node:test';
import assert from 'node:assert/strict';
import { keyToBytes, pushSupport, subscriptionPayload } from '../../resources/js/lib/webPush.js';

test('keyToBytes decodes base64url without padding', () => {
    assert.deepEqual([...keyToBytes('AQID_-8')], [1, 2, 3, 255, 239]);
});

test('subscriptionPayload keeps the endpoint and the two keys only', () => {
    const sub = { toJSON: () => ({ endpoint: 'https://x/y', expirationTime: null, keys: { p256dh: 'p', auth: 'a' } }) };
    assert.deepEqual(subscriptionPayload(sub), { endpoint: 'https://x/y', keys: { p256dh: 'p', auth: 'a' } });
});

const SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

test('pushSupport tells an iPhone in Safari to add to the Home Screen first', () => {
    const env = { navigator: { userAgent: SAFARI, serviceWorker: {} }, matchMedia: () => ({ matches: false }) };
    assert.equal(pushSupport(env), 'install-first');
});

test('pushSupport reads blocked and available from the permission', () => {
    const base = { navigator: { userAgent: 'Chrome', serviceWorker: {} }, PushManager: function () {} };
    assert.equal(pushSupport({ ...base, Notification: { permission: 'denied' } }), 'blocked');
    assert.equal(pushSupport({ ...base, Notification: { permission: 'default' } }), 'available');
    assert.equal(pushSupport({ navigator: { userAgent: 'Old' } }), 'unsupported');
});
