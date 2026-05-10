/**
 * GrowLab Govee Sensor Adapter
 *
 * Fetches readings from the Govee cloud API.
 * Endpoint: https://developer.govee.com/v1/devices/state
 * Auth: Govee-API-Key header
 *
 * When SENSOR_MOCK=true, returns deterministic mock data for development.
 * F5 (Master Plan §5 F5).
 */

import type { RawReading, SensorCredentials, SensorProvider } from './sensor-provider'

interface GoveeDeviceState {
  model: string
  device: string
  properties: Array<{
    online: boolean
    powerState?: string
    brightness?: number
    color?: { r: number; g: number; b: number }
    colorTemInKelvin?: number
    humidity?: number
    temperature?: number
  }>
}

interface GoveeStateResponse {
  code: number
  message: string
  data: GoveeDeviceState
}

export class GoveeProvider implements SensorProvider {
  async fetchReadings(credentials: SensorCredentials): Promise<RawReading[]> {
    if (process.env.SENSOR_MOCK === 'true') {
      return this.mockReadings()
    }

    const { apiKey, deviceId, model } = credentials
    if (!deviceId || !model) {
      throw new Error('Govee provider requires credentials: apiKey, deviceId, model')
    }

    const url = new URL('https://developer.govee.com/v1/devices/state')
    url.searchParams.set('device', deviceId)
    url.searchParams.set('model', model)

    const response = await fetch(url.toString(), {
      headers: { 'Govee-API-Key': apiKey },
    })

    if (!response.ok) {
      throw new Error(`Govee API error: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as GoveeStateResponse

    if (data.code !== 200) {
      throw new Error(`Govee API returned code ${data.code}: ${data.message}`)
    }

    const readings: RawReading[] = []
    const now = new Date()

    for (const prop of data.data.properties) {
      if (typeof prop.humidity === 'number') {
        readings.push({ metric: 'humidity', value: prop.humidity, unit: '%', recordedAt: now })
      }
      if (typeof prop.temperature === 'number') {
        readings.push({ metric: 'temperature', value: prop.temperature, unit: 'C', recordedAt: now })
      }
    }

    return readings
  }

  private mockReadings(): RawReading[] {
    const now = new Date()
    return [
      { metric: 'humidity', value: 58.5, unit: '%', recordedAt: now },
      { metric: 'temperature', value: 24.2, unit: 'C', recordedAt: now },
    ]
  }
}
