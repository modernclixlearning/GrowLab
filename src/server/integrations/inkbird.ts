/**
 * GrowLab Inkbird Sensor Adapter
 *
 * Fetches readings from the Inkbird/Engbird cloud API.
 * Base URL: https://api.engbird.com/
 * Auth: Bearer token (apiKey)
 *
 * When SENSOR_MOCK=true, returns deterministic mock data for development.
 * F5 (Master Plan §5 F5).
 */

import type { RawReading, SensorCredentials, SensorProvider } from './sensor-provider'

interface InkbirdDevice {
  deviceId: string
  name: string
  temperature?: number
  humidity?: number
  tempUnit?: 'C' | 'F'
}

interface InkbirdDevicesResponse {
  code: number
  msg: string
  data: InkbirdDevice[]
}

export class InkbirdProvider implements SensorProvider {
  async fetchReadings(credentials: SensorCredentials): Promise<RawReading[]> {
    if (process.env.SENSOR_MOCK === 'true') {
      return this.mockReadings()
    }

    const { apiKey, deviceId } = credentials

    const response = await fetch('https://api.engbird.com/v1/devices', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Inkbird API error: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as InkbirdDevicesResponse

    if (data.code !== 0) {
      throw new Error(`Inkbird API returned code ${data.code}: ${data.msg}`)
    }

    const devices = deviceId
      ? data.data.filter((d) => d.deviceId === deviceId)
      : data.data

    const readings: RawReading[] = []
    const now = new Date()

    for (const device of devices) {
      if (typeof device.humidity === 'number') {
        readings.push({ metric: 'humidity', value: device.humidity, unit: '%', recordedAt: now })
      }
      if (typeof device.temperature === 'number') {
        readings.push({
          metric: 'temperature',
          value: device.temperature,
          unit: device.tempUnit ?? 'C',
          recordedAt: now,
        })
      }
    }

    return readings
  }

  private mockReadings(): RawReading[] {
    const now = new Date()
    return [
      { metric: 'humidity', value: 62.0, unit: '%', recordedAt: now },
      { metric: 'temperature', value: 23.5, unit: 'C', recordedAt: now },
    ]
  }
}
