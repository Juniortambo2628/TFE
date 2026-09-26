import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assetPath } from '../../resources/js/lib/assets.js';

// Sprint 49 — regression guard for the admin 404s.
//
// Stored image paths (config/tournaments.php hero_image, the section card
// arrays, page_hero_*_background) were written without a leading slash. A
// browser resolves a relative src against the CURRENT directory, so on
// /admin/content the hero backdrop was requested from
// /admin/assets/img/backdrops/ball-on-field.jpg and 404'd. The shared image
// primitives run every src through assetPath so a relative value is corrected
// no matter which call site passes it.

test('a bare relative path becomes root-relative', () => {
    assert.equal(
        assetPath('assets/img/backdrops/ball-on-field.jpg'),
        '/assets/img/backdrops/ball-on-field.jpg',
    );
});

test('a leading ./ is normalised away', () => {
    assert.equal(assetPath('./assets/img/x.jpg'), '/assets/img/x.jpg');
});

test('an already root-relative path is left alone', () => {
    assert.equal(assetPath('/storage/uploads/x.jpg'), '/storage/uploads/x.jpg');
});

test('absolute URLs are left alone', () => {
    assert.equal(assetPath('https://cdn.example/x.jpg'), 'https://cdn.example/x.jpg');
    assert.equal(assetPath('http://cdn.example/x.jpg'), 'http://cdn.example/x.jpg');
    assert.equal(assetPath('//cdn.example/x.jpg'), '//cdn.example/x.jpg');
});

test('data and blob URIs are left alone (ImageUpload previews)', () => {
    assert.equal(assetPath('data:image/png;base64,AAAA'), 'data:image/png;base64,AAAA');
    assert.equal(assetPath('blob:http://localhost/abc-123'), 'blob:http://localhost/abc-123');
});

test('empty and non-string values pass through untouched', () => {
    assert.equal(assetPath(''), '');
    assert.equal(assetPath(null), null);
    assert.equal(assetPath(undefined), undefined);
});

test('surrounding whitespace is trimmed', () => {
    assert.equal(assetPath('  assets/img/x.jpg  '), '/assets/img/x.jpg');
});
