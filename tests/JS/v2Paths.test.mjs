import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isV2Path, toV2, v2PathFor } from '../../resources/js/lib/v2Paths.js';

const O = 'https://tfe.example';

test('the public pages map onto their /v2 twins', () => {
    for (const p of ['/about', '/features', '/services', '/news', '/contact', '/partners', '/learn', '/tribes']) {
        assert.equal(v2PathFor(p), `/v2${p}`);
    }
    assert.equal(v2PathFor('/partners/simba-air'), '/v2/partners/simba-air');
    assert.equal(v2PathFor('/tournaments/afcon-2027'), '/v2/tournaments/afcon-2027');
    assert.equal(v2PathFor('/listings/12'), '/v2/listings/12');
    assert.equal(v2PathFor('/'), '/v2');
});

test('a path that only shares a prefix is not mapped', () => {
    assert.equal(v2PathFor('/partnership'), '/partnership');
    assert.equal(v2PathFor('/learning'), '/learning');
});

test('pages with no twin stay where they are', () => {
    for (const p of ['/login', '/register', '/fan/dashboard', '/partner/requests', '/tribes/lions/join', '/news/transfers', '/api/news']) {
        assert.equal(v2PathFor(p), p);
    }
});

test('v2 pages are left alone, walkthroughs included', () => {
    assert.equal(v2PathFor('/v2/about'), '/v2/about');
    assert.equal(v2PathFor('/for-fans'), '/for-fans');
    assert.ok(isV2Path('/v2'));
    assert.ok(isV2Path('/v2/partners?type=airline'));
    assert.ok(isV2Path('/for-schools'));
    assert.ok(!isV2Path('/v2x'));
    assert.ok(!isV2Path('/about'));
    assert.ok(!isV2Path('/for-nobody'));
});

test('toV2 keeps the query, the hash and the shape of the link', () => {
    assert.equal(toV2('/partners?type=airline#list', O), '/v2/partners?type=airline#list');
    assert.equal(toV2(`${O}/listings/4`, O), `${O}/v2/listings/4`);
    assert.equal(toV2('https://elsewhere.example/about', O), 'https://elsewhere.example/about');
    assert.equal(toV2('mailto:hi@tfe.example', O), 'mailto:hi@tfe.example');
    assert.equal(toV2('#faq', O), '#faq');
    assert.equal(toV2('/login', O), '/login');
    assert.equal(toV2(undefined, O), undefined);
});
