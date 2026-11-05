// Screenshots for landing page v2's "Inside TFE" explorer and the audience
// walkthrough pages (UX review, 2 Nov 2026, Track C).
//
// Taken from the seeded demo, so they show real screens and can be retaken
// whenever those screens change (the Sprint 59 rule: no invented imagery):
//
//   php artisan migrate:fresh --seed && php artisan serve --port=8000
//   node scripts/landing-v2-screens.mjs            # every shot
//   node scripts/landing-v2-screens.mjs plan book  # just these
//
// Writes WebP to public/assets/img/landing-v2/{name}.webp, encoded by the
// browser itself (canvas.toDataURL), so no image library is needed.
// Env: E2E_BASE_URL (default http://127.0.0.1:8000), PW_CHROMIUM_PATH,
// DEMO_ACCOUNT_PASSWORD.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const base = (process.env.E2E_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const password = process.env.DEMO_ACCOUNT_PASSWORD || 'password';
const out = 'public/assets/img/landing-v2';
mkdirSync(out, { recursive: true });

const DESKTOP = { width: 1280, height: 800, deviceScaleFactor: 1 };
const PHONE = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

/**
 * name → who is signed in, where, and how to get the screen into shape.
 * Each area gets `-desktop` and (where listed) `-phone`.
 */
const SHOTS = [
    {
        name: 'plan', as: 'fan@tfe.com', path: '/fan/budget-calculator', phone: true,
        act: async (p) => {
            await p.getByRole('button', { name: /Saved Itineraries/ }).click();
            await p.locator('.saved-budgets-dropdown .dropdown-item').first().click();
            await p.locator('.result-card').first().waitFor({ timeout: 15000 });
            await p.waitForTimeout(1200);
            await p.locator('.result-card').first().scrollIntoViewIfNeeded();
            await p.evaluate(() => window.scrollBy(0, -90));
        },
    },
    {
        name: 'book', as: null, path: '/listings/13', phone: true,
        // The price panel and Book now. Scrolled so the panel's top sits just
        // under the fixed header — scrolling to the button instead left the
        // breadcrumb half under the header on a laptop.
        act: async (p) => {
            const top = await p.getByText('per person', { exact: true }).first().evaluate((el) => {
                let card = el;
                while (card.parentElement && card.getBoundingClientRect().height < 220) card = card.parentElement;
                return card.getBoundingClientRect().top + window.scrollY;
            });
            const header = await p.evaluate(() => document.querySelector('.tfe-header')?.getBoundingClientRect().bottom || 0);
            await p.evaluate((y) => window.scrollTo(0, y), Math.max(0, top - header - 16));
            await p.waitForTimeout(500);
        },
    },
    { name: 'finance', as: 'fan@tfe.com', path: '/fan/loan-applications', phone: true },
    {
        name: 'community', as: 'fan@tfe.com', path: '/fan/tribes', phone: true,
        // Past the hero, the ad slot and the counts, to the tribes themselves.
        act: async (p) => {
            // scrollIntoView, not …IfNeeded: the heading is already partly
            // on screen, so "if needed" would not scroll at all.
            await p.getByText('Available Tribes', { exact: true }).evaluate((el) => el.scrollIntoView({ block: 'start' }));
            await p.evaluate(() => window.scrollBy(0, -80));
            await p.waitForTimeout(500);
        },
    },
    {
        // The public planner's first step, opened from the landing page.
        name: 'planner', as: null, path: '/', phone: true,
        act: async (p) => {
            await p.evaluate(() => window.dispatchEvent(new CustomEvent('tfe:plan-trip', { detail: {} })));
            await p.locator('.tfe-modal').waitFor();
            await p.getByRole('button', { name: 'Pick matches' }).click().catch(() => {});
            await p.waitForTimeout(1200);
        },
    },
    { name: 'partner-hub', as: null, path: '/partners/serengeti-sports-travel' },
    { name: 'partner-requests', as: 'partner@tfe.com', path: '/partner/requests' },
    { name: 'register-institution', as: null, path: '/register/institution' },
    { name: 'partner-listings', as: 'partner@tfe.com', path: '/partner/listings' },
    { name: 'partner-dashboard', as: 'partner@tfe.com', path: '/partner/dashboard' },
    { name: 'school-dashboard', as: 'games@nairobigirls.sc.ke', path: '/institution/dashboard' },
    { name: 'learn', as: null, path: '/learn' },
];

const only = process.argv.slice(2);
const browser = await chromium.launch(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {});

// One context per (signed-in user, viewport), reused across shots.
const contexts = new Map();
async function contextFor(as, viewport) {
    const key = `${as || 'guest'}|${viewport.width}`;
    if (contexts.has(key)) return contexts.get(key);
    const { width, height, ...rest } = viewport;
    const ctx = await browser.newContext({ viewport: { width, height }, ...rest });
    await ctx.addInitScript(() => {
        try {
            localStorage.setItem('privacy_consent', 'true');
            sessionStorage.setItem('tfeIntroShown', '1');
            // Dashboard tours would otherwise sit over the first screen.
            for (const k of Object.keys(localStorage)) if (/tour/i.test(k)) localStorage.setItem(k, 'done');
        } catch {}
    });
    if (as) {
        const p = await ctx.newPage();
        await p.goto(`${base}/login`);
        await p.fill('input[type=email]', as);
        await p.fill('input[type=password]', password);
        await p.press('input[type=password]', 'Enter');
        await p.waitForURL((u) => !/\/login/.test(u.pathname), { timeout: 20000 });
        await p.close();
    }
    contexts.set(key, ctx);
    return ctx;
}

async function toWebp(page, png, quality = 0.8) {
    const dataUrl = await page.evaluate(async ({ b64, q }) => {
        const img = new Image();
        img.src = `data:image/png;base64,${b64}`;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        return c.toDataURL('image/webp', q);
    }, { b64: png.toString('base64'), q: quality });
    return Buffer.from(dataUrl.split(',')[1], 'base64');
}

async function shoot(shot, viewport, suffix) {
    const ctx = await contextFor(shot.as, viewport);
    const p = await ctx.newPage();
    try {
        await p.goto(base + shot.path, { waitUntil: 'domcontentloaded' });
        await p.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
        await p.waitForTimeout(1200);
        // Dashboard tour popovers, if one opened anyway.
        await p.locator('button:has-text("Skip")').first().click({ timeout: 1000 }).catch(() => {});
        if (shot.act) await shot.act(p);
        const png = await p.screenshot({ type: 'png' });
        const webp = await toWebp(p, png);
        const file = join(out, `${shot.name}-${suffix}.webp`);
        writeFileSync(file, webp);
        console.log(`  ✓ ${file} (${Math.round(webp.length / 1024)} KB)`);
    } catch (e) {
        console.log(`  ✗ ${shot.name}-${suffix}: ${e.message.split('\n')[0]}`);
    } finally {
        await p.close();
    }
}

for (const shot of SHOTS) {
    if (only.length && !only.includes(shot.name)) continue;
    await shoot(shot, DESKTOP, 'desktop');
    if (shot.phone) await shoot(shot, PHONE, 'phone');
}

for (const ctx of contexts.values()) await ctx.close();
await browser.close();
