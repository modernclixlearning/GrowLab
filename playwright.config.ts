import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration — visual regression harness (Master Plan §3 F0, §7).
 *
 * - Chromium-only (no full kit) to keep CI/install footprint small.
 * - Mobile-first viewport 412×892 (Android del prototipo, §3 F0).
 * - `maxDiffPixelRatio: 0.001` — tolerancia 0.1% por pantalla (§9 métricas).
 * - `webServer` arranca solo el web (Vite) — `npm run dev:web` evita el
 *   backend (Hono + DB) que no aplica a goldens públicas como /login.
 * - `fullyParallel: false` — dev server único, evitamos contención.
 */
export default defineConfig({
  testDir: 'tests/visual',
  // NOTE: golden file names include the OS suffix by Playwright default
  // (`login-chromium-win32.png`). Goldens are generated locally on
  // Windows during F0; if/when CI runs on Linux, regenerate per-OS
  // goldens or pin a Linux-only baseline. Master Plan §7.3 covers the
  // update workflow.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list']],
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.001,
    },
  },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    viewport: { width: 412, height: 892 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 412, height: 892 } },
    },
  ],
  webServer: {
    command: 'npm run dev:web',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
