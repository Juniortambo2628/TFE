import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activeSectionId, factRows, parseAction } from '../../resources/js/lib/landingV2.js';

test('config actions parse into what the page does', () => {
    assert.deepEqual(parseAction('planner'), { kind: 'planner' });
    assert.deepEqual(parseAction('section:trips'), { kind: 'section', target: 'trips' });
    assert.deepEqual(parseAction('link:/tribes'), { kind: 'link', target: '/tribes' });
    assert.deepEqual(parseAction('route:register.institution'), { kind: 'route', target: 'register.institution' });
});

test('an action can never become an off-site link', () => {
    for (const bad of ['link:https://evil.example', 'link://evil.example', 'link:javascript:alert(1)', 'section:a b', 'route:', 'nonsense', '', null]) {
        assert.deepEqual(parseAction(bad), { kind: 'planner' }, String(bad));
    }
});

test('the current section is the last one whose top has passed the line', () => {
    const sections = [{ id: 'journey', top: 900 }, { id: 'inside', top: 1600 }, { id: 'faq', top: 3000 }];
    assert.equal(activeSectionId(sections, 0, 140), null);          // still in the hero
    assert.equal(activeSectionId(sections, 760, 140), 'journey');   // journey's top reached the line
    assert.equal(activeSectionId(sections, 1500, 140), 'inside');
    assert.equal(activeSectionId(sections, 9999, 140), 'faq');
});

test('a section that is not on the page is skipped, not counted', () => {
    // e.g. "Trips" when the tournament has no packages.
    const sections = [{ id: 'journey', top: 900 }, { id: 'trips', top: undefined }, { id: 'faq', top: 2000 }];
    assert.equal(activeSectionId(sections, 1000, 0), 'journey');
    assert.equal(activeSectionId(sections, 2100, 0), 'faq');
});

test('facts keep the label order and drop what the server left out', () => {
    const labels = { tournaments: 'open', cities: 'cities', matches: 'matches', partners: 'partners' };
    assert.deepEqual(factRows({ matches: 52, tournaments: 1, partners: 0 }, labels), [
        { key: 'tournaments', value: 1, label: 'open' },
        { key: 'matches', value: 52, label: 'matches' },
    ]);
    assert.deepEqual(factRows(undefined, labels), []);
});

test('a fact label agrees with its count', () => {
    const labels = { tournaments: 'tournament open|tournaments open', cities: 'host cities' };
    assert.equal(factRows({ tournaments: 1 }, labels)[0].label, 'tournament open');
    assert.equal(factRows({ tournaments: 3 }, labels)[0].label, 'tournaments open');
    assert.equal(factRows({ cities: 1 }, labels)[0].label, 'host cities'); // no plural form given
});
