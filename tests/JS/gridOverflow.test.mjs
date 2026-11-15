import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Nov 2026: plan cards on My trips ran off the right of the screen. Their
// grid was `repeat(auto-fit, minmax(320px, 1fr))` in a 288px-wide panel: a
// column can never be narrower than its minimum, so on a phone the cards
// overflowed. 56 grids had the same pattern. Write the minimum as
// `min(320px, 100%)` so a column shrinks to its container instead.
function files(dir) {
    return readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        return statSync(path).isDirectory() ? files(path) : /\.(jsx?|css)$/.test(name) ? [path] : [];
    });
}

test('no auto-fill / auto-fit grid has a fixed minimum wider than its container can be', () => {
    const bare = /repeat\(\s*auto-(?:fill|fit)\s*,\s*minmax\(\s*\d+(?:px|rem|em)\s*,/;
    const offenders = [...files('resources/js'), ...files('resources/css')]
        .filter((f) => bare.test(readFileSync(f, 'utf8')));
    assert.deepEqual(offenders, [], 'use minmax(min(NNNpx, 100%), 1fr)');
});
