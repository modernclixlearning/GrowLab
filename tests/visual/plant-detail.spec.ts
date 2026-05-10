import { expect, test } from '@playwright/test'
import {
  gardenSeedPlants,
  mockGrowlabApi,
  plantDetailCareLogs,
  waitForFonts,
} from './fixtures'

/**
 * Visual regression — Plant Detail screen (F1).
 *
 * Canonical state per Master Plan §7.2: a vegetative plant with a healthy
 * spread of care logs so the redesigned hero, careTag pill, advance-stage
 * CTA, and CareLogList timeline are all populated.
 */
test.describe('Plant Detail screen', () => {
  test('matches golden — vegetative plant with care history', async ({ page }) => {
    const plants = gardenSeedPlants()
    const target = plants.find((p) => p.id === 'plant-blue-dream')!
    await mockGrowlabApi(page, {
      plants,
      careLogsByPlant: {
        [target.id]: plantDetailCareLogs(target.id),
      },
    })
    await page.goto(`/plants/${target.id}`)
    await waitForFonts(page)

    await expect(page.getByRole('heading', { name: target.name })).toBeVisible()
    await expect(page.getByText(/care status/i)).toBeVisible()

    await expect(page).toHaveScreenshot('plant-detail.png', { fullPage: true })
  })
})
