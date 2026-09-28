import test from 'node:test';
import assert from 'node:assert/strict';

import {
    completionPct,
    hasProgress,
    normalizeSteps,
    primaryStep,
    stepsWithCursor,
} from '../../resources/js/lib/stepFlow.js';

test('normalizeSteps accepts bare strings and numbers them by position', () => {
    const out = normalizeSteps(['Fan brief', 'Partner quote', 'Payment']);

    assert.deepEqual(
        out.map((s) => [s.n, s.title]),
        [[1, 'Fan brief'], [2, 'Partner quote'], [3, 'Payment']],
    );
});

test('normalizeSteps accepts objects and carries icon + hint', () => {
    const out = normalizeSteps([{ title: 'Seat picked', icon: 'fas fa-couch', hint: 'Choose a tier' }]);

    assert.equal(out[0].icon, 'fas fa-couch');
    assert.equal(out[0].hint, 'Choose a tier');
});

test('normalizeSteps derives n from position, ignoring a payload n that disagrees', () => {
    const out = normalizeSteps([
        { n: 9, title: 'First' },
        { n: 3, title: 'Second' },
    ]);

    assert.deepEqual(out.map((s) => s.n), [1, 2]);
});

test('normalizeSteps defaults state to unstated, not done', () => {
    // The public partner hub renders an explanatory flow with no instance
    // behind it. Defaulting to anything else would claim progress.
    assert.equal(normalizeSteps(['Brief'])[0].state, 'unstated');
});

test('normalizeSteps keeps a valid state and rejects an unknown one', () => {
    assert.equal(normalizeSteps([{ title: 'A', state: 'current' }])[0].state, 'current');
    assert.equal(normalizeSteps([{ title: 'A', state: 'banana' }])[0].state, 'unstated');
});

test('normalizeSteps drops empty entries rather than rendering a blank chip', () => {
    assert.equal(normalizeSteps(['A', '', null, undefined, { title: '   ' }, 'B']).length, 2);
});

test('normalizeSteps tolerates a non-array', () => {
    assert.deepEqual(normalizeSteps(null), []);
    assert.deepEqual(normalizeSteps(undefined), []);
    assert.deepEqual(normalizeSteps('nope'), []);
});

test('stepsWithCursor splits the list into done / current / todo', () => {
    const out = stepsWithCursor(['A', 'B', 'C', 'D'], 3);

    assert.deepEqual(out.map((s) => s.state), ['done', 'done', 'current', 'todo']);
});

test('stepsWithCursor with cursor 0 marks everything todo, not done', () => {
    // "Not started" is a real state and must not read as complete.
    const out = stepsWithCursor(['A', 'B'], 0);

    assert.deepEqual(out.map((s) => s.state), ['todo', 'todo']);
});

test('stepsWithCursor past the end marks every step done', () => {
    const out = stepsWithCursor(['A', 'B'], 3);

    assert.deepEqual(out.map((s) => s.state), ['done', 'done']);
});

test('stepsWithCursor leaves states alone when no cursor is given', () => {
    const out = stepsWithCursor([{ title: 'A', state: 'done' }, 'B'], null);

    assert.deepEqual(out.map((s) => s.state), ['done', 'unstated']);
});

test('primaryStep prefers the current step', () => {
    const steps = stepsWithCursor(['A', 'B', 'C'], 2);

    assert.equal(primaryStep(steps).title, 'B');
});

test('primaryStep falls back to the first outstanding step', () => {
    const steps = [{ title: 'A', state: 'done' }, { title: 'B', state: 'todo' }];

    assert.equal(primaryStep(steps).title, 'B');
});

test('primaryStep on a finished flow returns the last step, not the first', () => {
    const steps = stepsWithCursor(['A', 'B', 'C'], 4);

    assert.equal(primaryStep(steps).title, 'C');
});

test('primaryStep on an unstated flow returns the first step', () => {
    assert.equal(primaryStep(['A', 'B']).title, 'A');
});

test('primaryStep on an empty list is null', () => {
    assert.equal(primaryStep([]), null);
});

test('completionPct counts a current step as half', () => {
    // 1 done + 1 current of 4 => (1 + 0.5) / 4 = 37.5 => 38
    assert.equal(completionPct(stepsWithCursor(['A', 'B', 'C', 'D'], 2)), 38);
});

test('completionPct is 0 for an unstated flow and 100 for a finished one', () => {
    assert.equal(completionPct(['A', 'B']), 0);
    assert.equal(completionPct(stepsWithCursor(['A', 'B'], 3)), 100);
});

test('completionPct on an empty list is 0, not NaN', () => {
    assert.equal(completionPct([]), 0);
});

test('hasProgress separates an explanatory bar from a tracking one', () => {
    assert.equal(hasProgress(['A', 'B']), false);
    assert.equal(hasProgress(stepsWithCursor(['A', 'B'], 1)), true);
    assert.equal(hasProgress([{ title: 'A', state: 'done' }]), true);
});
