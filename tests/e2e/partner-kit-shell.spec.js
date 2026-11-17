import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { signIn, watchErrors } from './helpers';

// Kit migration phase 4: the partner dashboard runs in the OKJT kit's shell.
async function ready(page) {
    await page.waitForFunction(() => window.tfeLoaderFinished === true, null, { timeout: 15000 });
    await page.locator('.tfe-kit-shell[data-role="partner"] nav[aria-label="Main"]').waitFor({ state: 'attached' });
}

test('a partner gets the kit shell, kept mounted across its pages', async ({ page }, testInfo) => {
    const errors = watchErrors(page);
    await signIn(page, 'partner@tfe.com');
    await ready(page);
    await expect(page).toHaveURL(/\/partner\/dashboard/);
    await expect(page.locator('.tfe-kit-badge')).toHaveText(/Travel Partner/);

    await page.evaluate(() => { window.__kept = true; });
    const phone = testInfo.project.name === 'phone';
    const nav = phone ? page.locator('nav[aria-label="Travel Partner tabs"]') : page.locator('nav[aria-label="Main"]');
    for (const [label, url] of [['Publish', /\/partner\/listings/], ['Convert', /\/partner\/requests/], ['Dashboard', /\/partner\/dashboard/]]) {
        await nav.getByText(label, { exact: true }).click();
        await page.waitForURL(url);
        await expect(page.locator('.tfe-kit-shell')).toHaveCount(1);
    }
    expect(await page.evaluate(() => window.__kept)).toBe(true);
    expect(errors).toEqual([]);
});

test('a ticketing partner sees Tickets and Sales instead of Publish and Convert', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'phone', 'the menu is the same at every width');
    await signIn(page, 'ticketing@tfe.com');
    await ready(page);
    const nav = page.locator('nav[aria-label="Main"]');
    await expect(nav.getByText('Tickets', { exact: true })).toBeVisible();
    await expect(nav.getByText('Sales', { exact: true })).toBeVisible();
    await expect(nav.getByText('Publish', { exact: true })).toHaveCount(0);
    await expect(page.locator('.tfe-kit-badge')).toHaveText(/Ticketing Partner/);
});

test('the partner pages have no serious accessibility findings', async ({ page }) => {
    await signIn(page, 'partner@tfe.com');
    const found = {};
    for (const path of ['/partner/dashboard', '/partner/listings', '/partner/requests', '/partner/analytics', '/partner/profile']) {
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
