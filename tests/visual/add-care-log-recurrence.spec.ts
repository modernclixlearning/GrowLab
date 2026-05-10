/**
 * Visual regression — Add Care Log modal with Recurrence (F3).
 *
 * Opens the AddCareLogModal in expert mode and fills in
 * a weekly recurrence with byWeekday and count fields.
 */

import { expect, test } from '@playwright/test'
import {
  gardenSeedPlants,
  mockGrowlabApi,
  waitForFonts,
  FIXED_USER,
} from './fixtures'

test.describe('Add Care Log modal — recurrence', () => {
  test('matches golden — expert mode with weekly recurrence filled', async ({ page }) => {
    const plants = gardenSeedPlants()
    const plant = plants[0]! // OG Kush #1

    await mockGrowlabApi(page, {
      plants,
      user: { ...FIXED_USER, stageMode: 'expert' },
    })

    // Navigate to plant detail; modal is opened via JS so we mock the POST
    await page.route('**/api/plants/*/logs', async (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              careLog: {
                id: 'new-log',
                plantId: plant.id,
                logType: 'feed',
                amount: 250,
                unit: 'ml',
                notes: null,
                loggedAt: '2026-05-09T12:00:00.000Z',
                scheduledAt: '2026-05-09T10:00:00.000Z',
                completedAt: null,
                recurrenceRule: { frequency: 'weekly', interval: 1, byWeekday: [1, 3, 5], count: 6 },
                parentScheduleId: null,
              },
            },
          }),
        })
      }
      return route.continue()
    })

    await page.goto(`/plants/${plant.id}`)
    await waitForFonts(page)

    // Open the modal via the "Log Care" / "+" button
    const addButton = page.getByRole('button', { name: /log|add care/i }).first()
    await addButton.click()

    // Select Feed log type
    await page.getByRole('button', { name: /feed/i }).click()

    // Fill scheduledAt
    await page.fill('input[type="datetime-local"]', '2026-05-09T10:00')

    // Set recurrence to Weekly (expert mode shows radio buttons)
    await page.getByRole('radio', { name: /weekly/i }).check()

    // Snapshot the modal with weekly recurrence fields visible
    await expect(page).toHaveScreenshot('add-care-log-recurrence.png', { fullPage: false, clip: { x: 0, y: 0, width: 480, height: 900 } })
  })
})
