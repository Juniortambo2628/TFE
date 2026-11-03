import { test, expect } from '@playwright/test';
import { watchErrors } from './helpers';

// Plan item B4 (UX review, 2 Nov 2026): labelled shortcuts at the bottom of
// every public page on phones/tablets, because first-time visitors did not
// think to open the hamburger.
test('public tab bar: labelled, working, and nothing hides under it', async ({ page }, testInfo) => {
    const errors = watchErrors(page);
    await page.goto('/');
    const bar = page.locator('.tfe-tabbar');

    if (testInfo.project.name !== 'phone') {
        await expect(bar).toBeHidden();
        return;
    }

    await expect(bar).toBeVisible();
    for (const label of ['Plan a trip', 'My trips', 'Partners', 'Menu']) {
        await expect(bar.getByText(label, { exact: true })).toBeVisible();
    }

    // The hero (and its pinned tournament card) ends where the bar begins.
    const barBox = await bar.boundingBox();
    const hero = await page.locator('#hero').boundingBox();
    expect(hero.y + hero.height).toBeLessThanOrEqual(barBox.y + 2);

    // Menu opens the site menu; Plan a trip opens the planner over the bar.
    // Located by what it controls: its label flips to "Close" when open.
    const menu = bar.locator('button[aria-controls="tfe-mobile-nav"]');
    await expect(menu).toHaveText('Menu');
    await menu.click();
    await expect(page.locator('#tfe-mobile-nav')).toBeVisible();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await expect(menu).toHaveText('Close');
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');

    await bar.getByRole('button', { name: 'Plan a trip' }).click();
    await expect(page.locator('.tfe-modal')).toBeVisible();
    await page.keyboard.press('Escape');

    // Partners is a real page, and the tab marks itself current there.
    await bar.getByRole('link', { name: 'Partners' }).click();
    await page.waitForURL('**/partners');
    await expect(page.locator('.tfe-tabbar a[aria-current="page"]')).toHaveText('Partners');

    expect(errors).toEqual([]);
});
