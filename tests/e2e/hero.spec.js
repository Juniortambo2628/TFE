import { test, expect } from '@playwright/test';
import { watchErrors } from './helpers';

// UX review, 2 Nov 2026: on a phone the tournament card covered the stadium
// carousel. Below md it is now a compact card pinned to the bottom of the
// hero, with the dropped details (tagline, dials, hosts) behind its ⓘ.
test('phone hero leaves the stadium photo visible, details one tap away', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'phone', 'compact card is phone/tablet only');
    const errors = watchErrors(page);

    await page.goto('/');
    const card = page.locator('.tfe-acard--hero');
    await expect(card).toBeVisible();

    const vh = page.viewportSize().height;
    const box = await card.boundingBox();
    // At least half the first screen is the photo, not the card.
    expect(box.height).toBeLessThan(vh * 0.5);

    // Both CTAs on screen, side by side.
    const [matches, plan] = await card.locator('.hero-cta-buttons .btn-glass-pill').all();
    const a = await matches.boundingBox();
    const b = await plan.boundingBox();
    expect(Math.abs(a.y - b.y)).toBeLessThan(2);
    expect(b.y + b.height).toBeLessThanOrEqual(vh);

    // The ⓘ opens the tournament details with the full countdown.
    await card.locator('.tfe-acard__corner-btn').click();
    await expect(page.locator('.tfe-modal .hero-countdown-row')).toBeVisible();

    expect(errors).toEqual([]);
});

// The logo grew (UX review) without the header growing. Nothing a public page
// draws at the top may sit under it — the phone hero's stadium badge and the
// partners directory's eyebrow both did.
for (const [path, selector] of [['/', '.hero-stadium-badge'], ['/partners', '.partners-index-hero__eyebrow']]) {
    test(`logo clears the first content on ${path}`, async ({ page }) => {
        await page.goto(path);
        const logo = await page.locator('.tfe-header .tfe-logo-img').boundingBox();
        const first = await page.locator(selector).first().boundingBox();
        const overlapsX = first.x < logo.x + logo.width && logo.x < first.x + first.width;
        if (overlapsX) expect(first.y).toBeGreaterThanOrEqual(logo.y + logo.height);
        expect(logo.height).toBeGreaterThanOrEqual(80);
    });
}
