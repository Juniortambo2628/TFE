import { test } from 'node:test';
import assert from 'node:assert/strict';
import { skeletonVariantFor, DEFAULT_SKELETON_VARIANT } from '../../resources/js/lib/pageSkeleton.js';

// Sprint 53 — the global loading skeleton.
//
// An Inertia visit only knows the URL it is heading to, so PageTransition
// picks the placeholder's shape from the path. This guards the mapping: a
// route that resolves to the wrong shape makes the real content visibly jump
// when it lands, which is the whole thing the skeleton exists to avoid.

test('account + edit surfaces get the split-editor shape', () => {
    for (const path of [
        '/fan/profile',
        '/partner/profile',
        '/admin/profile',
        '/fan/security',
        '/partner/security',
        '/admin/security',
        '/admin/settings',
        '/admin/tournaments/afcon_2027',
        '/admin/partners/12',
    ]) {
        assert.equal(skeletonVariantFor(path), 'split', path);
    }
});

test('directory + moderation surfaces get the table shape', () => {
    for (const path of [
        '/admin/users',
        '/admin/messages',
        '/admin/listing-approvals',
        '/partner/requests',
        '/fan/loan-applications',
    ]) {
        assert.equal(skeletonVariantFor(path), 'table', path);
    }
});

test('browse surfaces get the card-grid shape', () => {
    for (const path of ['/partner/listings', '/fan/tribes', '/admin/media', '/fan/events']) {
        assert.equal(skeletonVariantFor(path), 'cards', path);
    }
});

test('number-led surfaces get the dashboard shape', () => {
    for (const path of ['/admin/dashboard', '/fan/dashboard', '/partner/analytics', '/fan/journey']) {
        assert.equal(skeletonVariantFor(path), 'dashboard', path);
    }
});

test('an unmatched path falls back to the dashboard shape', () => {
    assert.equal(skeletonVariantFor('/something/entirely/new'), DEFAULT_SKELETON_VARIANT);
});

test('a full href resolves the same as its path', () => {
    assert.equal(
        skeletonVariantFor('https://tfe.okjtech.co.ke/admin/users?page=2'),
        skeletonVariantFor('/admin/users'),
    );
});

test('a query string does not change the match', () => {
    assert.equal(skeletonVariantFor('/fan/profile?tab=bio'), 'split');
});

test('a URL object is accepted', () => {
    assert.equal(skeletonVariantFor(new URL('http://localhost/admin/media')), 'cards');
});

test('a missing url is safe', () => {
    assert.equal(skeletonVariantFor(undefined), DEFAULT_SKELETON_VARIANT);
    assert.equal(skeletonVariantFor(null), DEFAULT_SKELETON_VARIANT);
    assert.equal(skeletonVariantFor(''), DEFAULT_SKELETON_VARIANT);
});

test('an item route and the list it sits under get different shapes', () => {
    // /admin/partners is the ListingGrid directory; /admin/partners/7 is the
    // split editor. The item pattern is listed first, so it wins.
    assert.equal(skeletonVariantFor('/admin/partners'), 'cards');
    assert.equal(skeletonVariantFor('/admin/partners/7'), 'split');
});
