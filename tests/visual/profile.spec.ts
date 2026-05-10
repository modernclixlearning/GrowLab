import { expect, test } from '@playwright/test'
import {
  gardenSeedPlants,
  mockGrowlabApi,
  profileSeedTents,
  waitForFonts,
} from './fixtures'

/**
 * Visual regression — Profile screen (F2).
 *
 * Canonical state:
 *   - Authenticated user (FIXED_USER) with stageMode='expert'.
 *   - 4-plant garden seed → AvatarHeader stats render real numbers.
 *   - 1 tent configured → PrefsList shows "1 tent configured" and
 *     TentList renders the row.
 */
test.describe('Profile screen', () => {
  test('matches golden — expert user with 1 tent', async ({ page }) => {
    await mockGrowlabApi(page, {
      plants: gardenSeedPlants(),
      tents: profileSeedTents(),
    })
    await page.goto('/profile')
    await waitForFonts(page)

    await expect(page.getByRole('heading', { name: /jane grower/i })).toBeVisible()
    await expect(page.getByText(/stage mode/i)).toBeVisible()
    await expect(page.getByText(/veg room/i)).toBeVisible()

    await expect(page).toHaveScreenshot('profile.png', { fullPage: true })
  })
})
