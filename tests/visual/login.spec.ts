import { expect, test } from '@playwright/test'
import { mockGrowlabApi, waitForFonts } from './fixtures'

/**
 * Visual regression — Login screen (F1 redesign).
 *
 * F0 originally landed this golden as the only visual baseline. F1 keeps
 * it as the public-facing canonical state and adds the rest of the 6
 * routes alongside (see neighbour `*.spec.ts`).
 */
test.describe('Login screen', () => {
  test('matches golden — empty form', async ({ page }) => {
    // No authenticated user — refresh fails, page renders normally.
    await mockGrowlabApi(page, { user: null })
    await page.goto('/login')
    await waitForFonts(page)

    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()

    await expect(page).toHaveScreenshot('login.png', { fullPage: true })
  })
})
