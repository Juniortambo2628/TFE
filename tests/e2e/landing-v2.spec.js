import { test, expect } from '@playwright/test';
import { watchErrors } from './helpers';

// Landing page v2 + audience walkthroughs (UX review, 2 Nov 2026, Track C).

test('the v2 landing page is the home page, indexable, and its parts work', async ({ page }, testInfo) => {
    const errors = watchErrors(page);
    // The comparison-period address still lands here.
    await page.goto('/v2');
    await expect(page).toHaveURL(/\/$/);

    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    await expect(page.locator('.v2-hero__title')).toBeVisible();
    await expect(page.locator('.v2-audience')).toHaveCount(3);
    await expect(page.locator('.v2-facts__item').first()).toBeVisible();

    // A journey step opens its area in the explorer.
    await page.locator('.v2-journey__step').nth(2).getByRole('button').click();
    await expect(page.getByRole('tab', { name: /Book a trip/ })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.v2-screens__laptop img')).toHaveAttribute('src', /book-desktop\.webp/);

    // Arrow keys move between areas (ARIA tablist).
    await page.getByRole('tab', { name: /Book a trip/ }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: /Tickets/ })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.v2-screens__laptop img')).toHaveAttribute('src', /tickets-desktop\.webp/);

    // The section bar sticks under the header and its chips scroll the page.
    const nav = page.locator('.v2-sectionnav');
    await page.getByRole('link', { name: 'Questions' }).click();
    await expect(page.locator('#faq')).toBeInViewport();
    const navTop = (await nav.boundingBox()).y;
    const headerBottom = await page.evaluate(() => document.querySelector('.tfe-header').getBoundingClientRect().bottom);
    expect(Math.abs(navTop - headerBottom)).toBeLessThan(4);
    await expect(nav.locator('[aria-current]')).toHaveText('Questions');

    // FAQ answers open.
    const first = page.locator('.v2-faq__item').first();
    await first.locator('summary').click();
    await expect(first.locator('.v2-faq__a')).toBeVisible();

    // The hero's main CTA opens the trip planner.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('.v2-hero__ctas .tfe-btn--filled').click();
    await expect(page.locator('.tfe-modal')).toBeVisible();

    if (testInfo.project.name === 'phone') {
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    expect(errors).toEqual([]);
});

for (const [audience, cta, href] of [
    ['fans', 'Plan my trip', null],
    ['partners', 'Become a partner', '/contact'],
    ['schools', 'Create an institution account', '/register/institution'],
]) {
    test(`/for-${audience} walks through the steps and ends on its own call to action`, async ({ page }) => {
        const errors = watchErrors(page);
        await page.goto(`/for-${audience}`);

        await expect(page.locator('.tfe-backnav')).toBeVisible();
        expect(await page.locator('.v2-chapter').count()).toBeGreaterThanOrEqual(3);
        const action = page.locator('.v2-closing .tfe-btn--filled');
        await expect(action).toContainText(cta);
        if (href) {
            await expect(action).toHaveAttribute('href', new RegExp(`${href}$`));
        }
        expect(errors).toEqual([]);
    });
}
