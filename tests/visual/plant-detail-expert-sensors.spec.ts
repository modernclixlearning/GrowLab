import { expect, test } from '@playwright/test'
import {
  gardenSeedPlants,
  mockGrowlabApi,
  plantDetailCareLogs,
  waitForFonts,
  type MockSensorDevice,
  type MockSensorReading,
} from './fixtures'

/**
 * Visual regression — Plant Detail screen with F5 Environmentals section.
 *
 * Expert mode + sensor data → shows HumidityWidget, TempWidget, GrowthBars
 * in the Environmentals section above the care log timeline.
 */
test.describe('Plant Detail — Environmentals (F5)', () => {
  test('matches golden — expert user with sensor readings', async ({ page }) => {
    const plants = gardenSeedPlants()
    const target = plants.find((p) => p.id === 'plant-blue-dream')!

    const sensorDevices: MockSensorDevice[] = [
      {
        id: 'dev-1',
        userId: 'user-1',
        provider: 'govee',
        label: 'Tent Sensor',
        targetPlantId: target.id,
        targetTentId: null,
        lastPollAt: '2026-05-09T11:55:00.000Z',
        lastError: null,
        createdAt: '2026-04-01T00:00:00.000Z',
      },
    ]

    const sensorReadings: Record<string, MockSensorReading[]> = {
      [target.id]: [
        {
          id: 'r-1',
          sensorDeviceId: 'dev-1',
          plantId: target.id,
          tentId: null,
          metric: 'humidity',
          value: 58,
          unit: '%',
          recordedAt: '2026-05-09T11:55:00.000Z',
        },
        {
          id: 'r-2',
          sensorDeviceId: 'dev-1',
          plantId: target.id,
          tentId: null,
          metric: 'temperature',
          value: 24.5,
          unit: '°C',
          recordedAt: '2026-05-09T11:55:00.000Z',
        },
      ],
    }

    await mockGrowlabApi(page, {
      plants,
      careLogsByPlant: {
        [target.id]: plantDetailCareLogs(target.id),
      },
      sensorDevices,
      sensorReadings,
    })

    await page.goto(`/plants/${target.id}`)
    await waitForFonts(page)

    await expect(page.getByRole('heading', { name: target.name })).toBeVisible()
    // F5 — Environmentals section visible for expert users
    await expect(page.getByRole('heading', { name: /environmentals/i })).toBeVisible()

    await expect(page).toHaveScreenshot('plant-detail-expert-with-sensors.png', {
      fullPage: true,
    })
  })
})
