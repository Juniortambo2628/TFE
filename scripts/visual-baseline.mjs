#!/usr/bin/env node
/**
 * Visual baseline for the Tailwind 4 move (docs/proposals/okjt-kit-migration.md,
 * phase 2). Signs in as each role and records every GET page that needs no
 * parameter, at 1440 and 390 px: a full-page screenshot and the computed
 * styles of every visible element (the OKJT kit's style-snapshot).
 *
 *   node scripts/visual-baseline.mjs <out-dir> [base-url]
 *
 * Run it before a change and after it, then compare:
 *
 *   node node_modules/@okjt/ui/tools/style-snapshot.mjs compare <before>/styles <after>/styles
 *
 * Needs the seeded demo (php artisan migrate:fresh --seed) on base-url
 * (default http://127.0.0.1:8000) and the routes list from
 * `php artisan route:list --method=GET --json`.
 */
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { captureStyles } from '@okjt/ui/tools/style-snapshot';

const OUT = process.argv[2];
const BASE = process.argv[3] || 'http://127.0.0.1:8000';
if (!OUT) {
    console.error('usage: node scripts/visual-baseline.mjs <out-dir> [base-url]');
    process.exit(1);
}

const SKIP = /^(api|_|sanctum|webauthn|storage|up$|client-errors|push|sandbox-bank|notifications|auth\/|v2|login|register|logout|forgot-password|reset-password|verify-email|confirm-password|two-factor)/;
const ROLE_OF = (uri) => (uri.startsWith('fan') ? 'fan'
    : uri.startsWith('partner') ? 'partner'
        : uri.startsWith('admin') ? 'admin'
            : uri.startsWith('institution') ? 'institution' : 'public');
const ACCOUNTS = {
    fan: 'fan@tfe.com',
    partner: 'partner@tfe.com',
    admin: 'admin@tfe.com',
    institution: 'games@nairobigirls.sc.ke',
};
const WIDTHS = [[1440, 900], [390, 844]];

const routes = JSON.parse(execFileSync('php', ['artisan', 'route:list', '--method=GET', '--json'], { encoding: 'utf8' }));
const byRole = {};
for (const r of routes) {
    if (r.uri.includes('{') || SKIP.test(r.uri)) continue;
    const mw = (r.middleware || []).join(' ');
    const role = ROLE_OF(r.uri);
    if (role === 'public' && /\bauth\b|Authenticate/.test(mw)) continue;
    (byRole[role] ||= []).push(r.uri === '/' ? '/' : `/${r.uri}`);
}

const slug = (path) => (path === '/' ? 'home' : path.slice(1).replace(/[^a-z0-9]+/gi, '_'));

// TFE pins its own Playwright; point it at the installed Chromium when told to.
const browser = await chromium.launch(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {});
let count = 0;
for (const [role, paths] of Object.entries(byRole)) {
    for (const [width, height] of WIDTHS) {
        const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
        await ctx.addInitScript(() => {
            try {
                localStorage.setItem('tfeIntroShown', '1');
                localStorage.setItem('fan_dashboard_tutorial', 'true');
                localStorage.setItem('tfe_consent', JSON.stringify({ necessary: true }));
            } catch { /* private mode */ }
        });
        const page = await ctx.newPage();
        if (role !== 'public') {
            await page.goto(`${BASE}/login`);
            await page.fill('input[type=email]', ACCOUNTS[role]);
            await page.fill('input[type=password]', 'password');
            await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login')), page.click('button[type=submit]')]);
        }
        for (const path of paths) {
            const dir = join(OUT, String(width), role);
            mkdirSync(join(dir, 'styles'), { recursive: true });
            try {
                await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 30000 });
                await page.waitForFunction(() => window.tfeLoaderFinished !== false, null, { timeout: 5000 }).catch(() => {});
                await page.waitForTimeout(400);
                await page.screenshot({ path: join(dir, `${slug(path)}.png`), fullPage: true });
                writeFileSync(join(dir, 'styles', `${slug(path)}.json`), JSON.stringify(await captureStyles(page)));
                count++;
            } catch (e) {
                console.warn(`skip ${role} ${width} ${path}: ${e.message.split('\n')[0]}`);
            }
        }
        await ctx.close();
    }
}
await browser.close();
console.log(`captured ${count} pages into ${OUT}`);
