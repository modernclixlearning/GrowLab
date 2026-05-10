import { expect, test } from '@playwright/test'
import {
  gardenSeedPlants,
  mockGrowlabApi,
  profileSeedTents,
  waitForFonts,
  type MockSensorDevice,
} from './fixtures'

/**
 * Visual regression — Profile screen with F5 SensorDevicesSection.
 *
 * Expert mode + one sensor device → SensorDevicesSection renders below TentList.
 */
test.describe('Profile — Sensor Devices (F5)', () => {
  test('matches golden — expert user with 1 sensor device', async ({ page }) => {
    const sensorDevices: MockSensorDevice[] = [
      {
        id: 'dev-1',
        userId: 'user-1',
        provider: 'govee',
        label: 'Main Tent Sensor',
        targetPlantId: 'plant-blue-dream',
        targetTentId: null,
        lastPollAt: '2026-05-09T11:55:00.000Z',
        lastError: null,
        createdAt: '2026-04-01T00:00:00.000Z',
      },
    ]

    await mockGrowlabApi(page, {
      plants: gardenSeedPlants(),
      tents: profileSeedTents(),
      sensorDevices,
    })

    await page.goto('/profile')
    await waitForFonts(page)

    await expect(page.getByRole('heading', { name: /jane grower/i })).toBeVisible()
    await expect(page.getByText(/veg room/i)).toBeVisible()
    // F5 — SensorDevicesSection heading
    await expect(page.getByRole('heading', { name: /sensor devices/i })).toBeVisible()
    await expect(page.getByText(/main tent sensor/i)).toBeVisible()

    await expect(page).toHaveScreenshot('profile-sensors.png', { fullPage: true })
  })
})
