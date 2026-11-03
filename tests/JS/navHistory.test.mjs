import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createNavStack, normalizeUrl } from '../../resources/js/lib/navHistory.js';

test('a page opened from outside has nothing of ours behind it', () => {
    const s = createNavStack();
    s.record('/partners/serengeti-sports-travel');
    assert.equal(s.canGoBack(), false);
});

test('visits inside the site can be gone back through, and no further', () => {
    const s = createNavStack();
    s.record('/');
    s.record('/partners');
    s.record('/partners/serengeti-sports-travel');
    assert.equal(s.canGoBack(), true);

    s.record('/partners'); // browser/back button: the entry below the top
    assert.deepEqual(s.snapshot(), ['/', '/partners']);
    s.record('/');
    assert.equal(s.canGoBack(), false); // next Back must not leave the site
});

test('going forward again after going back is a new visit', () => {
    const s = createNavStack();
    s.record('/');
    s.record('/tribes');
    s.record('/');
    s.record('/tribes');
    assert.deepEqual(s.snapshot(), ['/', '/tribes']);
});

test('repeats of the current URL (partial reloads) are ignored', () => {
    const s = createNavStack();
    s.record('/partners');
    s.record('/partners');
    s.record('');
    s.record(undefined);
    assert.deepEqual(s.snapshot(), ['/partners']);
});

test('the stack is bounded', () => {
    const s = createNavStack(3);
    ['/a', '/b', '/c', '/d'].forEach((u) => s.record(u));
    assert.deepEqual(s.snapshot(), ['/b', '/c', '/d']);
});

test('URLs are compared as path + query, without origin or hash', () => {
    assert.equal(normalizeUrl('https://tfe.okjtech.co.ke/partners?type=airline#top'), '/partners?type=airline');
    assert.equal(normalizeUrl('/tribes'), '/tribes');
    assert.equal(normalizeUrl('http://127.0.0.1:8000'), '/');
    assert.equal(normalizeUrl(null), '');
});

test('going up to a parent replaces the page, so Back keeps climbing', () => {
    const s = createNavStack();
    s.record('/partners/serengeti-sports-travel'); // opened from a shared link
    assert.equal(s.canGoBack(), false);            // → BackNav goes to the parent…
    s.replaceTop('/partners');
    s.record('/partners');                         // …whose navigate event is a repeat
    assert.deepEqual(s.snapshot(), ['/partners']);
    assert.equal(s.canGoBack(), false);            // next Back: Home, not the partner again
});
