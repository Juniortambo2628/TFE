import { test, expect } from '@playwright/test';
import { watchErrors, expectFooterVisible } from './helpers';

test('public planner reaches an estimate with its actions on screen', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/');
    await page.getByRole('button', { name: /Plan my trip/i }).first().click();

    const dialog = page.getByRole('dialog').filter({ has: page.locator('.tfe-modal__foot') });
    await expect(dialog).toBeVisible();
    await expectFooterVisible(page);

    await page.getByRole('button', { name: /^Next$/ }).click();
    await page.getByRole('button', { name: /See my estimate/ }).click();

    await expect(page.locator('.tfe-planner-total strong')).toHaveText(/\d/);
    await expectFooterVisible(page);

    // The body scrolls; the footer stays put.
    const body = page.locator('.tfe-modal__pane-body');
    await body.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    await expectFooterVisible(page);

    expect(errors).toEqual([]);
});
