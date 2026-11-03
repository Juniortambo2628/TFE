import { test, expect } from '@playwright/test';
import { watchErrors } from './helpers';

// Plan item B6 (UX review, 2 Nov 2026): planner → sign-up → booking → pay on a
// phone. Each assertion below is a bug the pass found.
test('planner to paid booking works on a phone', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'phone', 'phone layout');
    const errors = watchErrors(page);
    const vh = page.viewportSize().height;
    const onScreen = async (locator) => {
        const box = await locator.boundingBox();
        expect(box).not.toBeNull();
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.y + box.height).toBeLessThanOrEqual(vh + 1);
    };

    await page.goto('/');
    await page.locator('.tfe-tabbar__item--primary').click();
    await page.getByRole('button', { name: /^Next$/ }).click();
    await page.getByRole('button', { name: /See my estimate/ }).click();
    // Pick a partner's package, so the estimate books at its published price.
    await page.locator('.tfe-planner-packages [role=radio]').first().click();
    await expect(page.locator('.tfe-planner-footer .tfe-btn--filled')).toContainText('Finalize details & pay');

    // The step's main action leads the footer, full width.
    const finalize = page.locator('.tfe-planner-footer .tfe-btn--filled');
    await onScreen(finalize);
    // Visually first (CSS `order`, not DOM order): above Back / Explore.
    const finalizeBox = await finalize.boundingBox();
    for (const other of await page.locator('.tfe-planner-footer .tfe-btn:not(.tfe-btn--filled)').all()) {
        expect(finalizeBox.y + finalizeBox.height).toBeLessThanOrEqual((await other.boundingBox()).y + 1);
    }
    await finalize.click();

    // Register: the fields are on the page, and Next stays on screen.
    await page.waitForURL(/register/);
    await expect(page.locator('form input[type=text]').first()).toBeVisible();
    await onScreen(page.getByRole('button', { name: /Next/ }));
    const txt = page.locator('form input[type=text]');
    await txt.nth(0).fill('Wanjiru');
    await txt.nth(1).fill('Kamau');
    await page.fill('form input[type=email]', `e2e${Date.now()}@example.com`);
    const pw = page.locator('form input[type=password]');
    await pw.nth(0).fill('Sup3r-secret-pass');
    await pw.nth(1).fill('Sup3r-secret-pass');
    await page.getByRole('button', { name: /Next/ }).click();

    // Arriving on the consent step must not submit the form by itself.
    await expect(page.getByText('Consent & Terms')).toBeVisible();
    await expect(page.getByText(/You must agree to the terms/)).toHaveCount(0);
    await onScreen(page.getByRole('button', { name: 'Complete Registration' }));
    await page.check('#terms');
    await page.getByRole('button', { name: 'Complete Registration' }).click();

    // Booking: "Pay now" is pinned and nothing sits on top of it.
    await page.waitForURL(/\/fan\/bookings\//);
    const pay = page.locator('.tfe-mobile-actionbar').getByRole('button', { name: /Pay now/ });
    await onScreen(pay);
    const box = await pay.boundingBox();
    for (const x of [box.x + 8, box.x + box.width / 2, box.x + box.width - 8]) {
        const hit = await page.evaluate(([px, py]) => {
            const el = document.elementFromPoint(px, py);
            return !!el?.closest('.tfe-mobile-actionbar');
        }, [x, box.y + box.height / 2]);
        expect(hit).toBe(true);
    }

    expect(errors).toEqual([]);
});
