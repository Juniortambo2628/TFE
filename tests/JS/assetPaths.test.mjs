import { test } from 'node:test';
import assert from 'node:assert/strict';
import assetPath from '../../resources/js/lib/assets.js';

// Sprint guard for the image-path 404s. A stored value without a leading
// slash (`assets/img/IMG-15.jpg`) is resolved by the browser against the
// CURRENT directory, so it 404s the moment it renders on a nested route
// (`/fan/assets/img/IMG-15.jpg`). assetPath is the single corrector every
// shared image primitive runs its src through; these lock its behaviour so a
// future edit can't quietly reintroduce a relative fallback.

test('a bare relative path gains a leading slash', () => {
    assert.equal(assetPath('assets/img/IMG-15.jpg'), '/assets/img/IMG-15.jpg');
});

test('a dot-relative path is normalised to root-relative', () => {
    assert.equal(assetPath('./assets/img/x.jpg'), '/assets/img/x.jpg');
});

test('an already root-relative path is left untouched', () => {
    assert.equal(assetPath('/assets/img/x.jpg'), '/assets/img/x.jpg');
});

test('absolute http(s) URLs are left untouched', () => {
    assert.equal(assetPath('https://cdn.example/x.jpg'), 'https://cdn.example/x.jpg');
    assert.equal(assetPath('http://cdn.example/x.jpg'), 'http://cdn.example/x.jpg');
});

test('protocol-relative URLs are left untouched', () => {
    assert.equal(assetPath('//cdn.example/x.jpg'), '//cdn.example/x.jpg');
});

test('data: and blob: URIs (ImageUpload previews) are left untouched', () => {
    assert.equal(assetPath('data:image/png;base64,AAAA'), 'data:image/png;base64,AAAA');
    assert.equal(assetPath('blob:http://localhost/abc'), 'blob:http://localhost/abc');
});

test('empty, null and non-string values pass through unchanged', () => {
    assert.equal(assetPath(''), '');
    assert.equal(assetPath(null), null);
    assert.equal(assetPath(undefined), undefined);
});
