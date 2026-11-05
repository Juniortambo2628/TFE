import { test, expect } from '@playwright/test';
import { watchErrors, expectFooterVisible } from './helpers';

test('public planner reaches an estimate with its actions on screen', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/');
    // Whichever general "plan a trip" entry point is on screen: the header's
    // on desktop, the tab bar's on phones. (The hero's now names its stadium,
    // and the closed mobile menu holds a hidden copy.)
    await page.getByRole('button', { name: /^Plan (my|a) trip$/i }).filter({ visible: true }).first().click();

    const dialog = page.getByRole('dialog').filter({ has: page.locator('.tfe-modal__foot') });
    await expect(dialog).toBeVisible();
    await expectFooterVisible(page);

    // One size from the first step to the last: the dialog does not grow and
    // shrink with its content, so its buttons never move (Nov 2026).
    const panel = page.locator('.tfe-modal');
    const height = async () => Math.round((await panel.boundingBox()).height);
    const first = await height();

    await page.getByRole('button', { name: /^Next$/ }).click();
    expect(await height()).toBe(first);
    await page.getByRole('button', { name: /See my estimate/ }).click();

    await expect(page.locator('.tfe-planner-total strong')).toHaveText(/\d/);
    expect(await height()).toBe(first);
    await expectFooterVisible(page);

    // The body scrolls; the footer stays put.
    const body = page.locator('.tfe-modal__pane-body');
    await body.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    await expectFooterVisible(page);

    expect(errors).toEqual([]);
});
