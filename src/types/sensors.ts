/**
 * GrowLab Frontend Types — Sensors & Growth (F5)
 */

export type SensorProvider = 'govee' | 'inkbird' | 'switchbot' | 'manual'
export type SensorMetric = 'humidity' | 'temperature' | 'light'

/**
 * Sensor device as returned by the API.
 * NOTE: apiKeyEncrypted is NEVER included in API responses.
 */
export interface SensorDevice {
  id: string
  userId: string
  provider: SensorProvider
  label: string
  targetPlantId: string | null
  targetTentId: string | null
  lastPollAt: string | null
  lastError: string | null
  createdAt: string
}

export interface SensorReading {
  id: string
  sensorDeviceId: string
  plantId: string | null
  tentId: string | null
  metric: SensorMetric
  value: string
  unit: string
  recordedAt: string
}

export interface GrowthMeasurement {
  id: string
  plantId: string
  metric: string
  value: string
  recordedAt: string
}

export interface GrowthBar {
  weekLabel: string
  value: number
  weekDelta: number | null
}

export interface CreateSensorDeviceRequest {
  provider: SensorProvider
  apiKey?: string
  label: string
  targetPlantId?: string
  targetTentId?: string
}

export interface UpdateSensorDeviceRequest {
  provider?: SensorProvider
  apiKey?: string
  label?: string
  targetPlantId?: string | null
  targetTentId?: string | null
}

export interface CreateGrowthMeasurementRequest {
  metric: 'height_cm' | 'leaf_count'
  value: number
  recordedAt?: string
}

/** Latest reading per metric, keyed by metric name */
export type LatestReadings = Partial<Record<SensorMetric, SensorReading>>
