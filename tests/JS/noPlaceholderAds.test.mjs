import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// UX plan (Nov 2026): a striped "Advertisement Space" box on a live page
// tells a visitor the slot is unsold. Real ads come from Admin -> Ads
// (AdPostCard); no page draws a stand-in for one.
function files(dir) {
    return readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        return statSync(path).isDirectory() ? files(path) : /\.(jsx?|mjs)$/.test(name) ? [path] : [];
    });
}

test('no page renders a placeholder ad', () => {
    const offenders = files('resources/js').filter((f) => /Advertisement Space|AdPlaceholder/.test(readFileSync(f, 'utf8')));
    assert.deepEqual(offenders, []);
});
