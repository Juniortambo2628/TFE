import { test, expect } from '@playwright/test';
import { watchErrors, signIn } from './helpers';

test.describe('signed-in fan', () => {
    test.skip(({ isMobile }) => isMobile, 'desktop flows; the phone project covers the public dialog');

    test('a saved plan opens on its results, chart included', async ({ page }) => {
        const errors = watchErrors(page);
        await signIn(page);
        await page.goto('/fan/budget-calculator');
        // Open the first saved itinerary from the hero menu.
        await page.getByRole('button', { name: /Saved Itineraries/ }).click();
        await page.locator('.saved-budgets-dropdown .dropdown-item').first().click();

        await expect(page.locator('.result-card')).toBeVisible();
        await expect(page.locator('.recharts-wrapper')).toBeVisible();
        expect(errors).toEqual([]);
    });

    test('pricing a match opens the planner with that match picked', async ({ page }) => {
        await signIn(page);
        await page.goto('/fan/match-schedule');
        const card = page.locator('.match-card').filter({ has: page.locator('.match-card__plan') }).first();
        const teams = await card.locator('.team-name').allInnerTexts();
        await card.locator('.match-card__plan').click();

        const picked = page.locator('.tfe-planner-match:has(input:checked)');
        await expect(picked).toHaveCount(1);
        await expect(picked).toContainText(`${teams[0]} v ${teams[1]}`);
    });
});
