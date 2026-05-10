/**
 * Visual regression — Schedule screen (F3).
 *
 * Two scenarios:
 *   1. Week with 3 tasks (1 completed, 2 pending) — canonical populated state.
 *   2. Empty week — empty-state card.
 */

import { expect, test } from '@playwright/test'
import {
  gardenSeedPlants,
  mockGrowlabApi,
  waitForFonts,
  FIXED_USER,
} from './fixtures'
import type { MockCareLog } from './fixtures'

// Canonical "this week" tasks seeded in FIXED_NOW week (2026-05-04 Mon – 2026-05-10 Sun)
function scheduleWeekLogs(): MockCareLog[] {
  return [
    {
      id: 'sched-1',
      plantId: 'plant-blue-dream',
      logType: 'water',
      amount: '400',
      unit: 'ml',
      notes: null,
      loggedAt: '2026-05-09T08:00:00.000Z',
      scheduledAt: '2026-05-09T08:00:00.000Z',
      completedAt: '2026-05-09T08:05:00.000Z', // already done
      recurrenceRule: null,
      parentScheduleId: null,
    },
    {
      id: 'sched-2',
      plantId: 'plant-sour-d',
      logType: 'feed',
      amount: '250',
      unit: 'ml',
      notes: 'Bloom boost',
      loggedAt: '2026-05-09T10:00:00.000Z',
      scheduledAt: '2026-05-09T10:00:00.000Z',
      completedAt: null, // pending
      recurrenceRule: { frequency: 'weekly', interval: 1 },
      parentScheduleId: null,
    },
    {
      id: 'sched-3',
      plantId: 'plant-og-kush-1',
      logType: 'prune',
      amount: null,
      unit: null,
      notes: null,
      loggedAt: '2026-05-09T14:00:00.000Z',
      scheduledAt: '2026-05-09T14:00:00.000Z',
      completedAt: null, // pending
      recurrenceRule: null,
      parentScheduleId: null,
    },
  ]
}

test.describe('Schedule screen', () => {
  test('matches golden — populated week with mixed completion', async ({ page }) => {
    const plants = gardenSeedPlants()
    await mockGrowlabApi(page, {
      plants,
      scheduledCareLogs: scheduleWeekLogs(),
      user: { ...FIXED_USER, stageMode: 'expert' },
    })

    await page.goto('/schedule')
    await waitForFonts(page)

    // Page should render the week navigator
    await expect(page.getByRole('heading', { name: /schedule/i })).toBeVisible()

    // Completed task shows "Done" badge
    await expect(page.getByText('Done')).toBeVisible()

    await expect(page).toHaveScreenshot('schedule.png', { fullPage: true })
  })

  test('matches golden — empty week', async ({ page }) => {
    const plants = gardenSeedPlants()
    await mockGrowlabApi(page, {
      plants,
      scheduledCareLogs: [],
    })

    await page.goto('/schedule')
    await waitForFonts(page)

    // Empty state messaging
    await expect(page.getByText(/nothing scheduled/i)).toBeVisible()

    await expect(page).toHaveScreenshot('schedule-empty.png', { fullPage: true })
  })
})
