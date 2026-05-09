import { expect, test } from '@playwright/test'
import { gardenSeedPlants, mockGrowlabApi, waitForFonts } from './fixtures'

/**
 * Visual regression — Garden screen (F1).
 *
 * Canonical state per Master Plan §7.2: 4 plants seeded, mix of stages
 * (seedling, vegetative, flowering, curing) so the StagePills show
 * meaningful counts and PlantCard exercises three stage tints.
 */
test.describe('Garden screen', () => {
  test('matches golden — 4-plant seed', async ({ page }) => {
    await mockGrowlabApi(page, {
      plants: gardenSeedPlants(),
      careLogsByPlant: {},
    })
    await page.goto('/garden')
    await waitForFonts(page)

    // Wait for the SystemPulse line to render with real counts.
    await expect(page.getByText(/active plants/i)).toBeVisible()
    await expect(page.getByText(/blue dream/i)).toBeVisible()

    await expect(page).toHaveScreenshot('garden.png', { fullPage: true })
  })
})
