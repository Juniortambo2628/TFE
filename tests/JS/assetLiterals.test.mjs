import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { assetPath } from '../../resources/js/lib/assets.js';

/*
 * Guards every stored image path in the client against the Sprint 49 trap.
 *
 * A bare `assets/img/x.jpg` is resolved by the browser against the CURRENT
 * directory, so it loads on `/` and 404s on every nested route — it asks for
 * `/fan/assets/img/x.jpg`. `assetPath()` corrects a relative value at render
 * time, but only where a component actually runs its src through it; a value
 * handed straight to an `<img src>` or a background is not covered.
 *
 * So the constants themselves must be root-relative. Four landing components
 * and Home.jsx had drifted from `config/site_sections.php`, which was fixed in
 * Sprint 49 while the JS defaults beside it were not — they only render when
 * no `cards` prop is passed, which is why it survived unnoticed.
 */

const ROOT = new URL('../../resources/js', import.meta.url).pathname;

function walk(dir) {
    return readdirSync(dir).flatMap((entry) => {
        const full = join(dir, entry);

        if (statSync(full).isDirectory()) return walk(full);

        return /\.(jsx?|mjs)$/.test(entry) ? [full] : [];
    });
}

/**
 * Quoted literals that START with a known public directory and no slash.
 *
 * Deliberately anchored on the opening quote: a substring test such as
 * `rawAvatar.includes('assets/img/avatars/default-avatar')` is a comparison,
 * not a stored path, and must keep matching a value with or without a leading
 * slash — so it is matched here too and listed as an allowed exception rather
 * than silently skipped by a looser pattern.
 */
const BARE = /(['"])(assets\/|stadiums\/|storage\/|tournament-organizers-card-visuals\/)/g;

// Comparisons, not paths. Each needs a reason to be here.
const ALLOWED = new Map([
    ['Pages/Fan/Profile.jsx', 'substring test for the default-avatar marker, not a src'],
]);

test('no client file stores an image path without a leading slash', () => {
    const offenders = [];

    for (const file of walk(ROOT)) {
        const rel = file.slice(ROOT.length + 1);
        const source = readFileSync(file, 'utf8');
        const hits = [...source.matchAll(BARE)];

        if (hits.length === 0) continue;
        if (ALLOWED.has(rel)) continue;

        hits.forEach((m) => {
            const line = source.slice(0, m.index).split('\n').length;
            offenders.push(`${rel}:${line} → ${m[2]}…`);
        });
    }

    assert.deepEqual(
        offenders,
        [],
        `These resolve against the current directory and 404 on nested routes:\n  ${offenders.join('\n  ')}`,
    );
});

test('every allowed exception still exists, so the list cannot go stale', () => {
    for (const rel of ALLOWED.keys()) {
        const source = readFileSync(join(ROOT, rel), 'utf8');

        assert.ok(
            BARE.test(source),
            `${rel} no longer has a bare literal — drop it from ALLOWED.`,
        );
        BARE.lastIndex = 0;
    }
});

/*
 * Second guard: a correctly-shaped path that names a file which is not there.
 *
 * `/assets/img/fan/backgrounds/payments_hero.png` was referenced by the Wallet
 * and Savings Goals heroes and had never been committed — DashboardHero lands
 * its `bgImage` as a CSS `background-image`, so a 404 draws no broken-image
 * icon and the hero simply loses its backdrop. Invisible without devtools.
 *
 * `/storage/` is excluded on purpose: it is a gitignored symlink to runtime
 * uploads, so nothing under it is expected on a fresh checkout.
 */
const PUBLIC_DIR = new URL('../../public', import.meta.url).pathname;
const COMMITTED_ASSET = /['"](\/(?:assets|stadiums|tournament-organizers-card-visuals)\/[^'"`]+\.(?:png|jpe?g|webp|svg|gif|avif))['"]/gi;

test('every committed image path in the client exists on disk', () => {
    const missing = [];

    for (const file of walk(ROOT)) {
        const rel = file.slice(ROOT.length + 1);
        const source = readFileSync(file, 'utf8');

        for (const m of source.matchAll(COMMITTED_ASSET)) {
            const path = m[1];

            // A literal carrying an interpolation is a template, not a path.
            if (path.includes('${')) continue;

            if (!existsSync(join(PUBLIC_DIR, path))) {
                const line = source.slice(0, m.index).split('\n').length;
                missing.push(`${rel}:${line} → ${path}`);
            }
        }
    }

    assert.deepEqual(
        missing,
        [],
        `Referenced but not committed — a CSS background fails silently:\n  ${missing.join('\n  ')}`,
    );
});

test('assetPath leaves a root-relative path alone', () => {
    // The constants are now already correct, so the render-time normaliser
    // must be a no-op on them rather than doubling the slash.
    assert.equal(assetPath('/assets/img/IMG-15.jpg'), '/assets/img/IMG-15.jpg');
    assert.equal(assetPath('assets/img/IMG-15.jpg'), '/assets/img/IMG-15.jpg');
    assert.equal(assetPath('./assets/img/IMG-15.jpg'), '/assets/img/IMG-15.jpg');
});

test('assetPath does not touch absolute or data URIs', () => {
    assert.equal(assetPath('https://cdn.example/x.jpg'), 'https://cdn.example/x.jpg');
    assert.equal(assetPath('//cdn.example/x.jpg'), '//cdn.example/x.jpg');
    assert.equal(assetPath('data:image/png;base64,AAA'), 'data:image/png;base64,AAA');
    assert.equal(assetPath('blob:http://x/y'), 'blob:http://x/y');
});
