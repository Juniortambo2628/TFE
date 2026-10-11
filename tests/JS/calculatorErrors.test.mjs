import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saveErrorStep, saveErrorMessage } from '../../resources/js/lib/calculatorErrors.js';

test('a match error sends the fan back to the match step', () => {
    assert.equal(saveErrorStep({ match_ids: 'The match ids field must be present.' }), 2);
});

test('travel fields map to the travel step', () => {
    assert.equal(saveErrorStep({ nights: 'x' }), 3);
    assert.equal(saveErrorStep({ flight_class: 'x' }), 3);
});

test('an error no step owns stays put', () => {
    assert.equal(saveErrorStep({ total_cost: 'x' }), null);
    assert.equal(saveErrorStep({}), null);
    assert.equal(saveErrorStep(undefined), null);
});

test('the message names the field in words and carries the server text', () => {
    assert.equal(
        saveErrorMessage({ match_ids: ['Pick at least one.'] }),
        "Couldn't save — matches: Pick at least one.",
    );
});

test('an empty bag still produces a sentence', () => {
    assert.match(saveErrorMessage({}), /try again/);
});
