/**
 * GrowLab Sensor Provider Interface
 *
 * Defines the contract that every cloud sensor adapter must implement.
 * F5 (Master Plan §5 F5).
 */

export interface RawReading {
  metric: 'humidity' | 'temperature' | 'light'
  value: number
  unit: string
  recordedAt: Date
}

export interface SensorCredentials {
  apiKey: string
  secret?: string
  deviceId?: string
  model?: string
  [k: string]: string | undefined
}

export interface SensorProvider {
  fetchReadings(credentials: SensorCredentials): Promise<RawReading[]>
}
