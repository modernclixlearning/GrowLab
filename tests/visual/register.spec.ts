import { expect, test } from '@playwright/test'
import { mockGrowlabApi, waitForFonts } from './fixtures'

/**
 * Visual regression — Register screen (F1).
 */
test.describe('Register screen', () => {
  test('matches golden — empty form', async ({ page }) => {
    await mockGrowlabApi(page, { user: null })
    await page.goto('/register')
    await waitForFonts(page)

    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible()

    await expect(page).toHaveScreenshot('register.png', { fullPage: true })
  })
})
