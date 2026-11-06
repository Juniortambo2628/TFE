import { test, expect } from '@playwright/test';

// The installable website (docs/proposals/mobile-app.md, phase 0).

test('the service worker installs and an offline visit gets the offline page', async ({ page }) => {
    await page.goto('/');
    const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
    expect(scope).toMatch(/\/$/);

    const manifest = await page.evaluate(async () => (await fetch('/manifest.webmanifest')).json());
    expect(manifest.short_name).toBe('TFE');

    // The offline page is stored on install, so a page load with no network
    // has something to show. (Playwright's offline switch does not reach a
    // service worker's own requests, so the fallback itself is checked by
    // hand: stop the server, reload, see this page.)
    const offline = await page.evaluate(async () => {
        const hit = await caches.match('/offline.html');
        return hit ? hit.text() : null;
    });
    expect(offline).toContain("You're offline");
});

test('?plan=1 (the app shortcut) opens the trip planner', async ({ page }) => {
    await page.goto('/?plan=1');
    await expect(page.locator('.tfe-modal')).toBeVisible();
});
