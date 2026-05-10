import { expect, test } from '@playwright/test'
import { FIXED_USER, gardenSeedPlants, mockGrowlabApi, waitForFonts } from './fixtures'

/**
 * Visual regression — Garden screen, Basic stage mode (F2 / issue 003).
 *
 * Same 4-plant seed as the Expert garden golden, but the user has
 * `stageMode='basic'` so the StagePills render 4 buckets (Seedling,
 * Veg, Flower, Harvest) plus All. Northern Lights (curing) maps into
 * the Harvest bucket — exercises the issue 003 mapping live.
 */
test.describe('Garden screen — Basic mode', () => {
  test('matches golden — basic 4-bucket pills', async ({ page }) => {
    await mockGrowlabApi(page, {
      user: { ...FIXED_USER, stageMode: 'basic' },
      plants: gardenSeedPlants(),
    })
    await page.goto('/garden')
    await waitForFonts(page)

    await expect(page.getByText(/active plants/i)).toBeVisible()
    // Basic pill labels — accessible name includes the count when set,
    // so "Harvest 4" / "Veg 1" rather than the bare label. Match by
    // start-anchored regex so we don't accidentally hit Expert-mode
    // labels like "Harvesting".
    await expect(page.getByRole('tab', { name: /^harvest\b/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /^veg\b/i })).toBeVisible()

    await expect(page).toHaveScreenshot('garden-basic.png', { fullPage: true })
  })
})
