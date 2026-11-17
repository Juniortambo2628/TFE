import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { signIn, watchErrors } from './helpers';

// Kit migration phase 4 (docs/proposals/okjt-kit-migration.md): an
// institution's dashboard runs in the OKJT kit's shell, on its own pages AND
// on the fan pages it plans trips on. A fan keeps TFE's own shell.
const SCHOOL = 'games@nairobigirls.sc.ke';

async function ready(page) {
    await page.waitForFunction(() => window.tfeLoaderFinished === true, null, { timeout: 15000 });
    await page.locator('.tfe-kit-shell nav[aria-label="Main"]').waitFor();
}

test('an institution gets the kit shell, kept mounted across its pages', async ({ page }, testInfo) => {
    const errors = watchErrors(page);
    await signIn(page, SCHOOL);
    await ready(page);
    await expect(page).toHaveURL(/\/institution\/dashboard/);
    await expect(page.locator('html')).toHaveClass(/admin-theme/);

    // The shell survives a move to a fan page and back: Inertia visits, not reloads.
    await page.evaluate(() => { window.__kept = true; });
    const phone = testInfo.project.name === 'phone';
    const go = async (label, url) => {
        if (phone) {
            await page.locator('nav[aria-label="Institution tabs"]').getByText(label, { exact: true }).click();
        } else {
            await page.locator('nav[aria-label="Main"]').getByText(label, { exact: true }).click();
        }
        await page.waitForURL(url);
        await expect(page.locator('.tfe-kit-shell')).toHaveCount(1);
    };
    await go(phone ? 'Plan' : 'Plan a Trip', /\/fan\/budget-calculator/);
    await go(phone ? 'Group Trips' : 'Group Trips', /\/fan\/itineraries/);
    await go(phone ? 'Home' : 'Group Dashboard', /\/institution\/dashboard/);
    expect(await page.evaluate(() => window.__kept)).toBe(true);

    if (!phone) {
        // The current page is marked by the pill, with no red dot beside it.
        const current = page.locator('nav[aria-label="Main"] a[aria-current="page"]');
        await expect(current).toHaveText(/Group Dashboard/);
        await expect(current.locator('div[style*="--color-accent"]')).toBeHidden();
    }
    expect(errors).toEqual([]);
});

test('Back on an inner page returns to the dashboard', async ({ page }) => {
    await signIn(page, SCHOOL);
    await ready(page);
    await page.goto('/fan/itineraries');
    await ready(page);
    await page.locator('.tfe-backnav-header').click();
    await page.waitForURL(/\/institution\/dashboard/);
});

test('the institution pages have no serious accessibility findings', async ({ page }) => {
    await signIn(page, SCHOOL);
    const found = {};
    for (const path of ['/institution/dashboard', '/institution/profile']) {
        await page.goto(path);
        await ready(page);
        await page.waitForTimeout(800);
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
        const serious = results.violations
            .filter((v) => v.impact === 'serious' || v.impact === 'critical')
            .map((v) => `${v.id} (${v.nodes.length}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
        if (serious.length) found[path] = serious;
    }
    expect(found).toEqual({});
});

test('a fan keeps TFE\'s own shell and never loads the kit\'s', async ({ page }) => {
    const kitChunks = [];
    page.on('request', (r) => { if (/KitShell|InstitutionKitShell/.test(r.url())) kitChunks.push(r.url()); });
    await signIn(page, 'fan@tfe.com');
    await page.goto('/fan/budget-calculator');
    await page.waitForFunction(() => window.tfeLoaderFinished === true, null, { timeout: 15000 });
    await expect(page.locator('.tfe-dv2:not(.tfe-kit-page)')).toHaveCount(1);
    await expect(page.locator('.tfe-kit-shell')).toHaveCount(0);
    expect(kitChunks).toEqual([]);
});
