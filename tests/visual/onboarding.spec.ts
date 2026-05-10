import { expect, test } from '@playwright/test'
import { FIXED_USER, gardenSeedPlants, mockGrowlabApi, waitForFonts } from './fixtures'

/**
 * Visual regression — StageMode onboarding overlay (F2).
 *
 * Canonical state: authenticated user with `hasOnboarded === false`.
 * The AppShell mounts the overlay over Garden (or any Shelled route);
 * we land on /garden so the fallback chrome is also captured behind
 * the dimmed backdrop.
 */
test.describe('Onboarding overlay', () => {
  test('matches golden — pre-selection', async ({ page }) => {
    await mockGrowlabApi(page, {
      user: { ...FIXED_USER, hasOnboarded: false },
      plants: gardenSeedPlants(),
    })
    await page.goto('/garden')
    await waitForFonts(page)

    // Overlay headline + both option cards visible.
    await expect(page.getByRole('heading', { name: /pick your view/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /basic.*simple/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /expert.*detailed/i })).toBeVisible()

    await expect(page).toHaveScreenshot('onboarding.png', { fullPage: true })
  })
})
