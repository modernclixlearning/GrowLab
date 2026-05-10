/**
 * Visual regression — Add Plant Modal Step 1 with UploadZone (F4).
 *
 * Captures the modal in its initial state (step 1 = Photo) so the
 * UploadZone drag-drop area is frozen for golden comparison.
 */

import { expect, test } from '@playwright/test'
import { gardenSeedPlants, mockGrowlabApi, waitForFonts } from './fixtures'

test.describe('AddPlantModal — UploadZone step (F4)', () => {
  test('matches golden — step 1 shows UploadZone', async ({ page }) => {
    await mockGrowlabApi(page, { plants: gardenSeedPlants() })
    await page.goto('/garden')
    await waitForFonts(page)

    // Open the Add Plant modal via the header button (not the FAB)
    await page.getByRole('button', { name: 'Add plant', exact: true }).click()
    await waitForFonts(page)

    // Should be on step 1 — Photo
    await expect(page.getByText('Plant Photo')).toBeVisible()
    // UploadZone drop area
    await expect(page.getByRole('button', { name: 'Upload photo' })).toBeVisible()

    await expect(page).toHaveScreenshot('add-plant-modal-upload.png')
  })
})
