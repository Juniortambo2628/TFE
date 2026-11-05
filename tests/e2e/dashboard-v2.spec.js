import { test, expect } from '@playwright/test';
import { signIn, watchErrors } from './helpers';

// The Naoa-style dashboard (UX review, Nov 2026): a per-person switch on the
// same pages. Each project signs in as its own demo fan, so the desktop and
// phone runs never flip each other's dashboard mid-test.
const FAN = { desktop: 'grace@tfe.com', phone: 'samir@tfe.com' };

async function flip(page) {
    const wasV2 = await page.locator('.tfe-dv2').count();
    await page.locator('.dashboard-user-profile:visible').first().click();
    const item = page.locator('#dashboard-version-switch');
    await expect(item).toBeVisible();
    // The menu animates in; click it once it is there rather than waiting
    // for Playwright's "stable" check against the animation.
    await item.evaluate((el) => el.click());
    await expect(page.locator('.tfe-dv2')).toHaveCount(wasV2 ? 0 : 1);
}

test('the account menu switches a fan to the new dashboard and back', async ({ page }, testInfo) => {
    const errors = watchErrors(page);
    await signIn(page, FAN[testInfo.project.name] || FAN.desktop);
    await page.goto('/fan/tickets');

    // Start from the current dashboard whatever an earlier run left behind.
    if (await page.locator('.tfe-dv2').count()) await flip(page);
    await expect(page.locator('.tfe-dv2')).toHaveCount(0);

    await flip(page);
    await expect(page.locator('.tfe-dv2')).toBeVisible();
    await expect(page.locator('#dashboard-version-switch')).toHaveCount(0);

    // Same page, Naoa's shape: breadcrumbs + the clicked item's icon + title,
    // the current item as the light pill, and the page's actions in the
    // floating toolbar.
    await expect(page.locator('.tfe-dv2-hero__crumbs')).toContainText('Tickets');
    await expect(page.locator('.tfe-dv2-hero__title')).toBeVisible();
    await expect(page.locator('.tfe-dv2-toolbar__bar')).toBeVisible();
    if (testInfo.project.name !== 'phone') {
        await expect(page.locator('.tfe-dv2-nav.is-active')).toContainText('Tickets');
    }

    // It stays on as the fan moves around.
    await page.goto('/fan/itineraries');
    await expect(page.locator('.tfe-dv2-hero__crumbs')).toContainText('Itineraries');

    if (testInfo.project.name === 'phone') {
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        await page.locator('.tfe-dv2-header__menu').click();
        await expect(page.locator('.tfe-dv2-nav.is-active')).toBeVisible();
        await page.keyboard.press('Escape');
        await page.mouse.click(350, 400);
    }

    await flip(page);
    await expect(page.locator('.tfe-dv2')).toHaveCount(0);
    await expect(page.locator('.dashboard-hero').first()).toBeVisible();
    expect(errors).toEqual([]);
});

test('a v2 public page keeps the visitor in v2 as they click on', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/v2/about');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.locator('.v2-hero--page')).toBeVisible();

    // A plain /partners link in a v2 page body goes to its twin.
    await page.goto('/v2/partners');
    await expect(page.locator('.v2-cardgrid a').first()).toBeVisible();
    await page.locator('.v2-cardgrid a').first().click();
    await expect(page).toHaveURL(/\/v2\/partners\/[a-z0-9-]+$/);

    // The reused v1 piece (the listing panel) is in v2 too, and its
    // partner link goes back to the v2 hub.
    const listing = page.locator('a[href*="/listings/"]').first();
    if (await listing.count()) {
        await listing.click();
        await expect(page).toHaveURL(/\/v2\/listings\/\d+$/);
        await expect(page.locator('.listing-page__aside')).toBeVisible();
    }
    expect(errors).toEqual([]);
});
