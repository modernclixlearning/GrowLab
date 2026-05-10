/**
 * GrowLab SwitchBot Sensor Adapter
 *
 * Fetches readings from the SwitchBot cloud API.
 * Ref: https://github.com/OpenWonderLabs/SwitchBotAPI
 * Auth: Token + HMAC-SHA256 signature (token:nonce:timestamp)
 *
 * When SENSOR_MOCK=true, returns deterministic mock data for development.
 * F5 (Master Plan §5 F5).
 */

import { createHmac, randomUUID } from 'node:crypto'
import type { RawReading, SensorCredentials, SensorProvider } from './sensor-provider'

interface SwitchBotStatusResponse {
  statusCode: number
  body: {
    deviceId: string
    deviceType: string
    hubDeviceId: string
    temperature?: number
    humidity?: number
    brightness?: number | string
  }
  message: string
}

function buildSwitchBotHeaders(token: string, secret: string) {
  const nonce = randomUUID()
  const ts = Date.now().toString()
  const sign = createHmac('sha256', secret)
    .update(token + ts + nonce)
    .digest('base64')

  return {
    Authorization: token,
    sign,
    nonce,
    t: ts,
    'Content-Type': 'application/json',
  }
}

export class SwitchBotProvider implements SensorProvider {
  async fetchReadings(credentials: SensorCredentials): Promise<RawReading[]> {
    if (process.env.SENSOR_MOCK === 'true') {
      return this.mockReadings()
    }

    const { apiKey, secret, deviceId } = credentials
    if (!secret || !deviceId) {
      throw new Error('SwitchBot provider requires credentials: apiKey (token), secret, deviceId')
    }

    const headers = buildSwitchBotHeaders(apiKey, secret)

    const response = await fetch(
      `https://api.switch-bot.com/v1.1/devices/${deviceId}/status`,
      { headers },
    )

    if (!response.ok) {
      throw new Error(`SwitchBot API error: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as SwitchBotStatusResponse

    if (data.statusCode !== 100) {
      throw new Error(`SwitchBot API returned statusCode ${data.statusCode}: ${data.message}`)
    }

    const readings: RawReading[] = []
    const now = new Date()

    if (typeof data.body.humidity === 'number') {
      readings.push({ metric: 'humidity', value: data.body.humidity, unit: '%', recordedAt: now })
    }
    if (typeof data.body.temperature === 'number') {
      readings.push({ metric: 'temperature', value: data.body.temperature, unit: 'C', recordedAt: now })
    }
    if (typeof data.body.brightness === 'number') {
      readings.push({ metric: 'light', value: data.body.brightness, unit: 'lux', recordedAt: now })
    }

    return readings
  }

  private mockReadings(): RawReading[] {
    const now = new Date()
    return [
      { metric: 'humidity', value: 55.0, unit: '%', recordedAt: now },
      { metric: 'temperature', value: 25.0, unit: 'C', recordedAt: now },
      { metric: 'light', value: 400, unit: 'lux', recordedAt: now },
    ]
  }
}
