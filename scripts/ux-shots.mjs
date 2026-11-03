// UX review screenshots (Nov 2026 UX round, plan item A5).
//
// Captures the surfaces the tester group will walk through, at a phone, a
// tablet and a desktop width, so each round can be compared before/after.
//
//   php artisan migrate:fresh --seed && php artisan serve --port=8000
//   node scripts/ux-shots.mjs before          # → docs/meetings/shots/before/
//   node scripts/ux-shots.mjs after           # → docs/meetings/shots/after/
//
// Env: E2E_BASE_URL (default http://127.0.0.1:8000), PW_CHROMIUM_PATH,
// DEMO_ACCOUNT_PASSWORD. Uses the seeded demo data, so shots are reproducible.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const label = process.argv[2] || 'before';
const base = process.env.E2E_BASE_URL || 'http://127.0.0.1:8000';
const out = join('docs/meetings/shots', label);
mkdirSync(out, { recursive: true });

const VIEWPORTS = [
    { name: 'phone', width: 390, height: 760, isMobile: true, hasTouch: true },
    { name: 'tablet', width: 768, height: 1024, isMobile: true, hasTouch: true },
    { name: 'desktop', width: 1280, height: 800 },
];

/** Public surfaces. `ready` is a selector to wait for; `act` runs before the shot. */
const PUBLIC = [
    { slug: 'home', path: '/', ready: '#hero', fullPage: true },
    { slug: 'home-hero', path: '/', ready: '#hero' },
    {
        slug: 'home-menu', path: '/', ready: '#hero', only: ['phone', 'tablet'],
        act: async (page) => { await page.click('.tfe-nav-toggler'); await page.waitForTimeout(400); },
    },
    {
        slug: 'planner', path: '/', ready: '#hero',
        act: async (page) => {
            await page.evaluate(() => window.dispatchEvent(new CustomEvent('tfe:plan-trip', { detail: {} })));
            await page.waitForSelector('.tfe-modal', { timeout: 8000 }).catch(() => {});
            await page.waitForTimeout(600);
        },
    },
    { slug: 'partners', path: '/partners', fullPage: true },
    { slug: 'partner-hub', path: '/partners/serengeti-sports-travel', fullPage: true },
    { slug: 'tribes', path: '/tribes', fullPage: true },
];

/** Signed-in fan surfaces. */
const FAN = [
    { slug: 'fan-dashboard', path: '/fan/dashboard', fullPage: true },
    { slug: 'fan-itineraries', path: '/fan/itineraries', fullPage: true },
    { slug: 'fan-calculator', path: '/fan/budget-calculator', fullPage: true },
];

async function settle(page, ready) {
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    if (ready) await page.waitForSelector(ready, { timeout: 10000 }).catch(() => {});
    // Let entrance animations and the hero image land.
    await page.waitForTimeout(1200);
}

async function shoot(context, vp, item) {
    if (item.only && !item.only.includes(vp.name)) return;
    const page = await context.newPage();
    try {
        await page.goto(base + item.path, { waitUntil: 'domcontentloaded' });
        await settle(page, item.ready);
        if (item.act) await item.act(page);
        const file = join(out, `${item.slug}--${vp.name}.jpg`);
        await page.screenshot({ path: file, type: 'jpeg', quality: 78, fullPage: !!item.fullPage });
        console.log('  ✓', file);
    } catch (e) {
        console.log('  ✗', item.slug, vp.name, e.message.split('\n')[0]);
    } finally {
        await page.close();
    }
}

const browser = await chromium.launch(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {});
for (const vp of VIEWPORTS) {
    console.log(`${vp.name} ${vp.width}x${vp.height}`);
    const opts = { viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch };

    const guest = await browser.newContext(opts);
    // Keep the cookie banner out of the shots; it is not what is being reviewed.
    await guest.addInitScript(() => { try { localStorage.setItem('privacy_consent', 'true'); } catch {} });
    for (const item of PUBLIC) await shoot(guest, vp, item);
    await guest.close();

    const fan = await browser.newContext(opts);
    await fan.addInitScript(() => { try { localStorage.setItem('privacy_consent', 'true'); } catch {} });
    const login = await fan.newPage();
    await login.goto(base + '/login');
    await login.fill('input[type=email]', 'fan@tfe.com');
    await login.fill('input[type=password]', process.env.DEMO_ACCOUNT_PASSWORD || 'password');
    await login.press('input[type=password]', 'Enter');
    await login.waitForURL((u) => !/\/login/.test(u.pathname), { timeout: 15000 }).catch(() => {});
    await login.close();
    for (const item of FAN) await shoot(fan, vp, item);
    await fan.close();
}
await browser.close();
