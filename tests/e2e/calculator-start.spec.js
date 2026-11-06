import { test, expect } from '@playwright/test';
import { signIn, watchErrors } from './helpers';

// UX plan (Nov 2026): the calculator's totals read "—" until something is
// priced, and a first plan starts from Quick plan with the wizard one tap away.

test('nothing is priced until something is picked', async ({ page }) => {
    const errors = watchErrors(page);
    await signIn(page, 'fan@tfe.com');
    await page.goto('/fan/budget-calculator');

    await expect(page.locator('.hero-stat-item .stat-value').first()).toHaveText('—');
    await expect(page.locator('.calc-stats-hint')).toBeVisible();
    // A fan with saved plans goes straight to the wizard.
    await expect(page.locator('.calc-start')).toHaveCount(0);
    expect(errors).toEqual([]);
});

test('a first plan starts from Quick plan, with step by step one tap away', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/register');
    const txt = page.locator('form input[type=text]');
    await txt.nth(0).fill('First');
    await txt.nth(1).fill('Planner');
    await page.fill('form input[type=email]', `e2e-start${Date.now()}@example.com`);
    const pw = page.locator('form input[type=password]');
    await pw.nth(0).fill('Sup3r-secret-pass');
    await pw.nth(1).fill('Sup3r-secret-pass');
    await page.getByRole('button', { name: /Next/ }).click();
    // The team step is optional: Next without picking one.
    await expect(page.getByText(/Which team will you be supporting/)).toBeVisible();
    await page.getByRole('button', { name: /Next/ }).click();
    await page.check('#terms');
    await page.getByRole('button', { name: 'Complete Registration' }).click();
    await page.waitForURL((u) => !/register/.test(u.pathname));

    await page.goto('/fan/budget-calculator');
    const start = page.locator('.calc-start');
    await expect(start).toBeVisible();
    await expect(page.locator('.calc-wizard')).toBeHidden();

    await start.getByRole('button', { name: /Quick plan/ }).click();
    await expect(page.locator('.tfe-modal')).toBeVisible();
    await page.keyboard.press('Escape');

    await start.getByRole('button', { name: /step by step/ }).click();
    await expect(page.locator('.calc-wizard')).toBeVisible();
    await expect(page.locator('.calc-start')).toHaveCount(0);
    expect(errors).toEqual([]);
});
