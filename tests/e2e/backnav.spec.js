import { test, expect } from '@playwright/test';
import { watchErrors } from './helpers';

// Plan item B5 (UX review, 2 Nov 2026): a Back button and breadcrumb on every
// public page. Back retraces this visit, but never leaves the site: a page
// opened from a shared link goes up to its parent instead, and keeps climbing.
// Waits for the destination itself: the click starts an async visit, so a
// load-state wait can resolve before the URL has changed.
const backTo = async (page, expected) => {
    await page.locator('.tfe-backnav__back').click();
    await page.waitForURL((u) => u.pathname === expected);
};

test('Back retraces a visit inside the site', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/partners');
    await page.locator('a[href*="/partners/serengeti-sports-travel"]').first().click();
    await page.waitForURL('**/partners/serengeti-sports-travel');

    await expect(page.locator('.tfe-backnav__crumb--parent a')).toHaveText('Partners');
    await backTo(page, '/partners');
    expect(errors).toEqual([]);
});

test('a page opened from outside goes up to its parent, then Home', async ({ page }) => {
    await page.goto('/partners/serengeti-sports-travel');
    await backTo(page, '/partners');
    await backTo(page, '/');
});

test('the Home crumb is always there and goes home', async ({ page }) => {
    await page.goto('/tribes');
    await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Home' }).click();
    await page.waitForURL((u) => u.pathname === '/');
});

test('Back moves into the header once the page scrolls', async ({ page }) => {
    await page.goto('/partners/serengeti-sports-travel');
    // The first-visit intro splash holds the page still until it ends.
    await page.waitForFunction(() => window.tfeLoaderFinished === true);
    const back = page.locator('.tfe-header .tfe-backnav-header');
    await expect(back).toHaveCount(0);

    await page.evaluate(() => window.scrollTo(0, 1600));
    await expect(back).toBeVisible();
    await expect(back).toBeInViewport();
    // In the header, not floating over the page (it used to sit on top of
    // the sticky section tabs).
    await expect(page.locator('.tfe-backnav-float')).toHaveCount(0);
    const header = await page.locator('.tfe-header').boundingBox();
    const box = await back.boundingBox();
    expect(box.y + box.height).toBeLessThanOrEqual(header.y + header.height);

    // Nothing in the section tabs is covered by it.
    const tabs = page.locator('.v2-sectionnav');
    if (await tabs.count()) {
        const strip = await tabs.first().boundingBox();
        expect(box.y + box.height).toBeLessThanOrEqual(strip.y + 1);
    }

    await back.click();
    await page.waitForURL((u) => u.pathname === '/partners');

    // Gone again with the trail back on screen.
    await expect(page.locator('.tfe-backnav__back')).toBeVisible();
    await expect(back).toHaveCount(0);
});

test('on a phone the logo centres while Back is in the header', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/partners/serengeti-sports-travel');
    await page.waitForFunction(() => window.tfeLoaderFinished === true);
    await page.evaluate(() => window.scrollTo(0, 1600));
    await expect(page.locator('.tfe-header .tfe-backnav-header')).toBeVisible();

    const logo = await page.locator('.tfe-header .tfe-logo-img').boundingBox();
    // Centred in the header bar (not the window: with a desktop browser's
    // scrollbar the fixed header is a little narrower than the page).
    const bar = await page.locator('.tfe-header .header-wrapper').boundingBox();
    const centre = logo.x + logo.width / 2;
    expect(Math.abs(centre - (bar.x + bar.width / 2))).toBeLessThan(2);
});
