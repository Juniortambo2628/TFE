import { expect } from '@playwright/test';

/** Collect page errors and same-origin failed requests for a test. */
export function watchErrors(page) {
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
        if (m.type() === 'error' && /width\(-1\)|is not defined|Cannot read/.test(m.text())) errors.push(`console: ${m.text()}`);
    });
    page.on('response', (r) => {
        const url = new URL(r.url());
        if (r.status() === 404 && url.origin === new URL(page.url() || 'http://x').origin) errors.push(`404: ${url.pathname}`);
    });
    return errors;
}

export async function signIn(page, email = 'fan@tfe.com', password = process.env.DEMO_ACCOUNT_PASSWORD || 'password') {
    await page.goto('/login');
    await page.fill('input[type=email]', email);
    await page.fill('input[type=password]', password);
    await page.press('input[type=password]', 'Enter');
    await page.waitForURL((u) => !/\/login/.test(u.pathname));
}

/** The dialog's footer must be inside the viewport — the Sprint 69 clipping bug. */
export async function expectFooterVisible(page) {
    const box = await page.locator('.tfe-modal__foot').boundingBox();
    expect(box).not.toBeNull();
    const vh = page.viewportSize().height;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(vh + 1);
}
