import { expect, test } from '@playwright/test'
import { mockGrowlabApi, waitForFonts } from './fixtures'

/**
 * Visual regression — Home / landing screen (F1).
 */
test.describe('Home screen', () => {
  test('matches golden — public landing', async ({ page }) => {
    await mockGrowlabApi(page, { user: null })
    await page.goto('/')
    await waitForFonts(page)

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await expect(page).toHaveScreenshot('home.png', { fullPage: true })
  })
})
