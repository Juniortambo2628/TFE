import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Nov 2026, from the owner: cards never carry a coloured border — no red,
// amber or blue edge, no accent stripe down one side. Resting borders are
// the neutral hairline; hover and selected states may lighten it with
// white, never tint it. This scans every stylesheet for a rule whose
// selector names a card-like block and whose border is drawn in a colour.
function files(dir) {
    return readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        return statSync(path).isDirectory() ? files(path) : name.endsWith('.css') ? [path] : [];
    });
}

const CARD = /(card|tile|slab|panel|box|-hero\b|hero-|summary|banner|section|bubble|item)\b/i;
const NOT_CARD = /(btn|button|pill|chip|badge|input|select|textarea|tab|switch|dot|avatar|ring|icon|swatch|check|toggle|scrollbar|thumb|progress|step)/i;
// A border declaration (not radius/width/style/collapse/spacing/image).
const BORDER = /\bborder(?:-(?:left|right|top|bottom|color|inline-start|block-start))?\s*:\s*([^;]+);/g;
const COLOURED = /(#(?:dc143c|e31b23|ff4b52|f59e0b|0072ce|3b82f6|dc2626|d97706|10b981|ef4444)\b|rgba?\(\s*(?:220,\s*20,\s*60|227,\s*27,\s*35|245,\s*158,\s*11|59,\s*130,\s*246|0,\s*114,\s*206|239,\s*68,\s*68|220,\s*38,\s*38|16,\s*185,\s*129)|var\(--(?:partner-accent|partner-amber|accent|acard-accent|vcard-accent|dash-hero-accent|dv2-accent)\)|color-mix\([^)]*accent)/i;

test('no card draws a coloured border', () => {
    const offenders = [];
    for (const file of files('resources/css')) {
        const css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
        for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
            const sel = selector.trim();
            if (!CARD.test(sel) || NOT_CARD.test(sel) || sel.startsWith('@')) continue;
            for (const [decl, value] of body.matchAll(BORDER)) {
                if (COLOURED.test(value)) offenders.push(`${file}: ${sel.split('\n').pop().trim()} → ${decl.trim()}`);
            }
        }
    }
    assert.deepEqual(offenders, [], 'use the neutral hairline (var(--border-divider)); lighten with white on hover/selected');
});
