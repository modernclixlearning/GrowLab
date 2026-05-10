import { expect, test } from '@playwright/test'
import {
  gardenSeedPlants,
  mockGrowlabApi,
  plantDetailCareLogs,
  waitForFonts,
} from './fixtures'

/**
 * Visual regression — Dashboard screen (F1).
 *
 * Canonical state per Master Plan §7.2: same 4-plant seed plus recent
 * care logs on a couple of plants to populate the "Recent Activity" tile
 * row and exercise the MiniChart placeholder.
 */
test.describe('Dashboard screen', () => {
  test('matches golden — populated state', async ({ page }) => {
    const plants = gardenSeedPlants()
    await mockGrowlabApi(page, {
      plants,
      careLogsByPlant: {
        'plant-blue-dream': plantDetailCareLogs('plant-blue-dream'),
        'plant-sour-d': plantDetailCareLogs('plant-sour-d').slice(0, 2),
      },
    })
    await page.goto('/dashboard')
    await waitForFonts(page)

    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /tent growth/i })).toBeVisible()

    await expect(page).toHaveScreenshot('dashboard.png', { fullPage: true })
  })
})
