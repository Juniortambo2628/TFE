/**
 * Heavy libraries stay behind their boundaries (Sprint 69).
 *
 * Every one of these was fine the day it landed and is one careless import
 * away from shipping on every page. Source-level, so it runs without a build.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('../../resources/js/', import.meta.url).pathname;

function files(dir = ROOT) {
    return readdirSync(dir).flatMap((name) => {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) return files(p);
        return /\.(jsx?|mjs)$/.test(name) ? [p] : [];
    });
}

const SOURCES = files().map((p) => ({ path: relative(ROOT, p), src: readFileSync(p, 'utf8') }));

const importers = (re) => SOURCES.filter((f) => re.test(f.src)).map((f) => f.path).sort();

// A static `import … from 'x'` — a lazy `import('x')` is the point of a boundary.
const staticImport = (mod) => new RegExp(`^\\s*import[^;]*?from\\s+['"]${mod}['"]`, 'm');

test('@tremor/react is admin-only (~200KB gzip)', () => {
    for (const f of importers(staticImport('@tremor/react'))) {
        assert.match(f, /^(Pages|Components)\/Admin\//, `${f} pulls Tremor outside the admin`);
    }
});

test('recharts is only reached through the lazily loaded calculator results', () => {
    assert.deepEqual(importers(staticImport('recharts')), ['Components/Fan/CostScenarioChart.jsx']);
    assert.deepEqual(
        importers(staticImport('@/Components/Fan/CostScenarioChart')),
        ['Components/Fan/Calculator/CalculatorResults.jsx'],
    );
    assert.deepEqual(importers(staticImport('@/Components/Fan/Calculator/CalculatorResults')), [],
        'CalculatorResults must be imported with lazy(() => import(…)), never statically');
});

test('three stays inside the seat-map canvas chunk (Sprint 57)', () => {
    for (const f of importers(staticImport('three'))) {
        assert.ok(
            ['lib/stadiumBowlGeometry.js', 'lib/stadiumBowlScene.js', 'Components/Common/StadiumBowlCanvas.jsx'].includes(f),
            `${f} imports three directly`,
        );
    }
    assert.deepEqual(importers(staticImport('@/Components/Common/StadiumBowlCanvas')), [],
        'import StadiumBowl, which owns the lazy boundary — never the canvas');
});
