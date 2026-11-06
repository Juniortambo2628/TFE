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

    // Naoa's page toolbar: "find on this page" filters the page's cards. On
    // a phone it is an icon in a small pill that opens the field.
    if (testInfo.project.name === 'phone') {
        const pill = await page.locator('.tfe-dv2-toolbar').boundingBox();
        expect(pill.width).toBeLessThan(page.viewportSize().width / 2);
        // The page's own actions stay in its heading, not the bar.
        await expect(page.locator('.tfe-dv2-hero__actions')).toContainText('My tickets');
        await page.locator('.tfe-dv2-toolbar').getByRole('button', { name: 'Find on this page' }).click();
    }
    const find = page.locator('.tfe-dv2-toolbar__search input');
    await expect(find).toBeVisible();
    const cards = page.locator('.ticket-card');
    const total = await cards.count();
    await find.fill('zzzz-no-such-match');
    await expect(page.locator('.ticket-card:visible')).toHaveCount(0);
    if (testInfo.project.name !== 'phone') {
        await expect(page.locator('.tfe-dv2-toolbar__note')).toHaveText(`0 of ${total} shown`);
    }
    await find.fill('');
    await expect(page.locator('.ticket-card:visible')).toHaveCount(total);

    // Naoa's side panel, beside the content on wide screens: folded to a
    // rail under 1536px, and it opens.
    if (testInfo.project.name !== 'phone' && page.viewportSize().width >= 1280) {
        const panel = page.locator('.tfe-dv2-panel');
        await expect(panel).toBeVisible();
        if (await panel.evaluate((el) => el.classList.contains('is-rail'))) {
            await panel.getByRole('button', { name: 'Show activity' }).click();
        }
        await expect(page.locator('.tfe-dv2-panel__label', { hasText: 'In Plan & book' })).toBeVisible();
        await expect(page.locator('.tfe-dv2-panel__row[aria-current="true"]')).toContainText('Tickets');
        await page.getByRole('button', { name: 'Hide activity' }).click();
    }

    // It stays on as the fan moves around.
    await page.goto('/fan/itineraries');
    await expect(page.locator('.tfe-dv2-hero__crumbs')).toContainText('Itineraries');

    const tabs = page.locator('.tfe-tabbar--dashboard');
    if (testInfo.project.name === 'phone') {
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

        // Phones navigate like an app: the role's main places in a bottom
        // tab bar (picked from the sidebar menu), Menu for everything else.
        // The header carries no hamburger or quick links any more.
        await expect(tabs).toBeVisible();
        for (const label of ['Home', 'Plan', 'Trips', 'Tickets', 'Menu']) {
            await expect(tabs.getByText(label, { exact: true })).toBeVisible();
        }
        await expect(tabs.locator('[aria-current="page"]')).toHaveText('Trips');
        await expect(page.locator('.tfe-dv2-header .tfe-dv2-iconbtn')).toHaveCount(0);

        // The page's own toolbar sits above the bar, not under it.
        await page.goto('/fan/tickets');
        await expect(page.locator('.tfe-dv2-toolbar__bar')).toBeVisible();
        const bar = await tabs.boundingBox();
        const tools = await page.locator('.tfe-dv2-toolbar__bar').boundingBox();
        expect(tools.y + tools.height).toBeLessThanOrEqual(bar.y);

        await tabs.getByRole('button', { name: 'Menu' }).click();
        await expect(page.locator('.tfe-dv2-nav.is-active')).toBeVisible();
        // An activity count is a circle beside the label, not a bar across it.
        const badge = page.locator('.tfe-dv2-nav .tfe-activity-badge').first();
        if (await badge.count()) {
            const b = await badge.boundingBox();
            expect(b.width).toBeLessThanOrEqual(b.height * 2);
        }
        await expect(page.locator('.tfe-dv2-nav', { hasText: 'Predict' })).toBeVisible();
        await tabs.getByRole('link', { name: 'Trips' }).click();
        await expect(page).toHaveURL(/\/fan\/itineraries/);
    } else {
        await expect(tabs).toBeHidden();
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
