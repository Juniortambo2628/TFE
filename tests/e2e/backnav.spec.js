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

test('Back stays within reach after the page scrolls', async ({ page }) => {
    await page.goto('/partners/serengeti-sports-travel');
    // The first-visit intro splash holds the page still until it ends.
    await page.waitForFunction(() => window.tfeLoaderFinished === true);
    const float = page.locator('.tfe-backnav-float');
    await expect(float).toHaveCount(0);

    await page.evaluate(() => window.scrollTo(0, 1600));
    await expect(float).toBeVisible();
    await expect(float).toBeInViewport();
    await float.click();
    await page.waitForURL((u) => u.pathname === '/partners');

    // Gone again with the trail back on screen.
    await expect(page.locator('.tfe-backnav__back')).toBeVisible();
    await expect(float).toHaveCount(0);
});
