import { test, expect } from '@playwright/test';
import { watchErrors, signIn } from './helpers';

/*
 * Buying a match ticket, block and seats included.
 *
 * Drives the seat picker rather than the 3D map: it is the keyboard way to
 * the same seats and needs no WebGL, so the test holds on a headless box.
 * Places a real order, so it runs once (desktop), against a seeded app.
 */
test.describe('match tickets', () => {
    test.skip(({ isMobile }) => isMobile, 'places an order; one run is enough');

    test('Continue opens Payment and does not place the order', async ({ page }) => {
        await signIn(page);
        await page.goto('/fan/tickets');
        await page.getByText('Buy tickets').first().click();

        await page.getByRole('button', { name: 'Continue', exact: true }).click();

        // The bug this guards: one shared <button> flipped to "submit"
        // during the click, and the order went through on Continue.
        await expect(page.getByRole('button', { name: /Pay \$/ })).toBeVisible();
        await expect(page).toHaveURL(/\/fan\/tickets$/);
    });

    test('a fan picks a block and two seats, pays, and the receipt names them', async ({ page }) => {
        const errors = watchErrors(page);
        await signIn(page);
        await page.goto('/fan/tickets');
        await page.getByText('Buy tickets').first().click();

        await page.getByRole('button', { name: /Premium/ }).first().click();
        await page.getByRole('button', { name: /Choose block/ }).click();
        await expect(page.locator('.seat-picker')).toBeVisible();

        await page.getByRole('button', { name: 'Add seat' }).click();
        await page.getByRole('button', { name: 'Add seat' }).click();
        await expect(page.locator('.seat-picker__chips li')).toHaveCount(2);

        await page.getByRole('button', { name: 'Continue', exact: true }).click();
        await expect(page.locator('.ticket-modal__seats')).toContainText('2 seats in block');
        await page.getByRole('button', { name: /Pay \$/ }).click();

        await page.waitForURL(/\/fan\/tickets\/purchases/);
        await expect(page.locator('body')).toContainText(/Row \d+ · Seats? /);
        expect(errors).toEqual([]);
    });

    test('the upgrade offer moves the order to the next tier up at its real price', async ({ page }) => {
        await signIn(page);
        await page.goto('/fan/tickets');
        await page.getByText('Buy tickets').first().click();

        await page.getByRole('button', { name: /Premium/ }).first().click();
        const offer = page.getByRole('button', { name: /Upgrade to VIP · \+\$[\d,.]+ a seat/ });
        await expect(offer).toBeVisible();
        await offer.click();

        await expect(page.locator('.tfe-modal__foot-note')).toContainText(/^VIP/);
        // Nothing above VIP: no offer once there.
        await expect(page.getByRole('button', { name: /Upgrade to/ })).toHaveCount(0);
    });
});
