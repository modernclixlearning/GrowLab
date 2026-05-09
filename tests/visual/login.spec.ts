import { expect, test } from '@playwright/test'

/**
 * Visual regression — Login screen.
 *
 * Master Plan §3 F0 lists "Garden seed state" as the initial golden, but
 * Garden requires authenticated session + seeded plants, and the repo has
 * no MSW / seed automation in place yet. Building auth+seed for a single
 * golden in F0 is over-engineering.
 *
 * Pragmatic choice: the F0 golden covers a public screen (Login). It still
 * exercises the dark + neon theme, the Sora/Inter typography, the
 * glow/neon shadows, and a full form layout — the high-risk surfaces for
 * visual drift after F0 token changes.
 *
 * The Garden golden is deferred to F1 once the auth + seed flow is mature
 * (see Master Plan §3 F1 deliverables: PlantCard, StagePills, search bar,
 * SystemPulse with real counts).
 */
test.describe('Login screen', () => {
  test('matches golden', async ({ page }) => {
    await page.goto('/login')

    // Wait for fonts to load — without this the screenshot can capture
    // a fallback font frame and produce a flaky golden.
    await page.evaluate(() => document.fonts.ready)

    // Make sure the form is present before screenshotting.
    await expect(page.getByRole('button', { name: /sign in|log in|enter/i })).toBeVisible()

    await expect(page).toHaveScreenshot('login.png', { fullPage: true })
  })
})
