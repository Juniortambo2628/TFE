import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { signIn } from './helpers';

// UX plan (Nov 2026): an axe pass over the main public and fan pages.
// Serious and critical WCAG 2 A/AA findings fail the run.
const PUBLIC = ['/', '/about', '/partners', '/learn', '/tribes', '/contact'];
const FAN = ['/fan/dashboard', '/fan/budget-calculator', '/fan/tickets', '/fan/itineraries', '/fan/tribes'];

async function scan(page) {
    await page.waitForFunction(() => window.tfeLoaderFinished === true, null, { timeout: 15000 });
    await page.waitForTimeout(800);
    const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
        .exclude('iframe')
        .analyze();
    return results.violations
        .filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map((v) => `${v.id} (${v.nodes.length}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
}

test('public pages have no serious accessibility findings', async ({ page }) => {
    const found = {};
    for (const path of PUBLIC) {
        await page.goto(path);
        const v = await scan(page);
        if (v.length) found[path] = v;
    }
    expect(found).toEqual({});
});

test('fan pages have no serious accessibility findings', async ({ page }, testInfo) => {
    await signIn(page, testInfo.project.name === 'phone' ? 'samir@tfe.com' : 'grace@tfe.com');
    const found = {};
    for (const path of FAN) {
        await page.goto(path);
        const v = await scan(page);
        if (v.length) found[path] = v;
    }
    expect(found).toEqual({});
});
