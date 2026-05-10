import { expect, test } from '@playwright/test'
import {
  gardenSeedPlants,
  mockGrowlabApi,
  plantDetailCareLogs,
  waitForFonts,
} from './fixtures'
import type { MockCareLog } from './fixtures'

/**
 * Visual regression — Dashboard screen (F1 + F3).
 *
 * Canonical state per Master Plan §7.2: same 4-plant seed plus recent
 * care logs on a couple of plants to populate the "Recent Activity" tile
 * row and exercise the MiniChart placeholder.
 *
 * F3 adds a "Pending today" task via scheduledCareLogs.
 */

function pendingTodayLogs(): MockCareLog[] {
  return [
    {
      id: 'pending-today-1',
      plantId: 'plant-blue-dream',
      logType: 'water',
      amount: '400',
      unit: 'ml',
      notes: null,
      loggedAt: '2026-05-09T09:00:00.000Z',
      scheduledAt: '2026-05-09T09:00:00.000Z',
      completedAt: null,
      recurrenceRule: null,
      parentScheduleId: null,
    },
  ]
}

test.describe('Dashboard screen', () => {
  test('matches golden — populated state', async ({ page }) => {
    const plants = gardenSeedPlants()
    await mockGrowlabApi(page, {
      plants,
      careLogsByPlant: {
        'plant-blue-dream': plantDetailCareLogs('plant-blue-dream'),
        'plant-sour-d': plantDetailCareLogs('plant-sour-d').slice(0, 2),
      },
      scheduledCareLogs: pendingTodayLogs(),
    })
    await page.goto('/dashboard')
    await waitForFonts(page)

    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /tent growth/i })).toBeVisible()

    await expect(page).toHaveScreenshot('dashboard.png', { fullPage: true })
  })
})
