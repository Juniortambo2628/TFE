import { test, expect } from '@playwright/test';

// UX plan (Nov 2026): a first visit is not held up. The intro splash is
// short and shown once per device, and on a phone the cookie notice is a
// slim bar above the tab bar, not a card over half the screen.
test('the splash is short and does not come back', async ({ page }) => {
    const t0 = Date.now();
    await page.goto('/');
    await page.waitForFunction(() => window.tfeLoaderFinished === true);
    // Page load included; the splash itself is 400ms.
    expect(Date.now() - t0).toBeLessThan(4000);

    await page.reload();
    expect(await page.evaluate(() => window.tfeLoaderFinished === true)).toBe(true);
});

test('the cookie notice is a slim bar above the tab bar on a phone', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'phone', 'phone layout');
    await page.goto('/');
    const bar = page.locator('.tfe-consent');
    await expect(bar).toBeVisible();
    // It slides up into place; measure where it lands.
    await bar.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    const box = await bar.boundingBox();
    expect(box.height).toBeLessThan(100);
    const tabs = await page.locator('.tfe-tabbar').boundingBox();
    expect(box.y + box.height).toBeLessThanOrEqual(tabs.y);
    await bar.getByRole('button', { name: /Accept/ }).click();
    await expect(bar).toBeHidden();
});
