import { test, expect } from '@playwright/test';
import { watchErrors } from './helpers';

// The v2 landing hero (the home page since the switch to v2, Nov 2026).

test('the home hero puts its message and both actions on the first screen', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/');
    await page.waitForFunction(() => window.tfeLoaderFinished === true, null, { timeout: 15000 }).catch(() => {});

    const vh = page.viewportSize().height;
    await expect(page.locator('.v2-hero__title')).toBeVisible();
    const ctas = page.locator('.v2-hero__ctas').first();
    const box = await ctas.boundingBox();
    expect(box.y + box.height).toBeLessThanOrEqual(vh);

    // The tab bar (phones) never covers them.
    const bar = page.locator('.tfe-tabbar');
    if (await bar.isVisible()) {
        expect(box.y + box.height).toBeLessThanOrEqual((await bar.boundingBox()).y);
    }

    // The stadium on screen is named, and Plan my trip opens the planner.
    await expect(page.locator('.v2-hero__venue')).toContainText(/\S/);
    await ctas.getByRole('button').first().click();
    await expect(page.locator('.tfe-modal')).toBeVisible();
    expect(errors).toEqual([]);
});

// The logo grew (UX review) without the header growing. Nothing a public page
// draws at the top may sit under it.
for (const [path, selector] of [['/', '.v2-hero__inner .v2-eyebrow'], ['/partners', '.v2-pagehero__copy > :first-child']]) {
    test(`logo clears the first content on ${path}`, async ({ page }) => {
        await page.goto(path);
        const logo = await page.locator('.tfe-header .tfe-logo-img').boundingBox();
        const first = await page.locator(selector).first().boundingBox();
        const overlapsX = first.x < logo.x + logo.width && logo.x < first.x + first.width;
        if (overlapsX) expect(first.y).toBeGreaterThanOrEqual(logo.y + logo.height);
        expect(logo.height).toBeGreaterThanOrEqual(80);
    });
}
