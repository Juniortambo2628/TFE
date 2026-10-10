// Browser smoke tests (Sprint 69). Run against a seeded app:
//   php artisan migrate:fresh --seed && php artisan serve --port=8000
//   npm run test:e2e
// They cover what the PHP suite cannot see — dialogs that clip or render
// off-screen, a chart that never draws, a save that 422s in the browser.
import { defineConfig, devices } from '@playwright/test';

const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 60_000,
    expect: { timeout: 10_000 },
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
    use: {
        baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:8000',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        launchOptions: executablePath ? { executablePath } : {},
    },
    projects: [
        { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
        { name: 'phone', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 760 } } },
    ],
});
