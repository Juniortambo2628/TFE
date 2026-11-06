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
    // A visitor (6 Nov 2026): Home, Partners, Plan a trip (centre, accent),
    // Contact, Sign in — in that order.
    await expect(bar.locator('.tfe-tabbar__item span')).toHaveText(['Home', 'Partners', 'Plan a trip', 'Contact', 'Sign in']);
    await expect(bar.locator('.tfe-tabbar__item--primary')).toHaveText('Plan a trip');
    await expect(bar.locator('a[aria-current="page"]')).toHaveText('Home');
    await expect(bar.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', /\/login$/);

    // The hero's actions sit above the bar, never under it.
    const barBox = await bar.boundingBox();
    const ctas = await page.locator('.v2-hero__ctas').first().boundingBox();
    expect(ctas.y + ctas.height).toBeLessThanOrEqual(barBox.y + 2);

    // Plan a trip opens the planner over the bar.
    await bar.getByRole('button', { name: 'Plan a trip' }).click();
    await expect(page.locator('.tfe-modal')).toBeVisible();
    await page.keyboard.press('Escape');

    // Partners is a real page, and the tab marks itself current there.
    await bar.getByRole('link', { name: 'Partners' }).click();
    await page.waitForURL('**/partners');
    await expect(page.locator('.tfe-tabbar a[aria-current="page"]')).toHaveText('Partners');

    // It condenses to icons while scrolling down, and comes back on the way up.
    await page.waitForFunction(() => window.tfeLoaderFinished === true);
    for (const y of [300, 600, 900]) await page.evaluate((to) => window.scrollTo(0, to), y);
    await expect(bar).toHaveClass(/is-compact/);
    for (const y of [700, 500]) await page.evaluate((to) => window.scrollTo(0, to), y);
    await expect(bar).not.toHaveClass(/is-compact/);

    expect(errors).toEqual([]);
});
