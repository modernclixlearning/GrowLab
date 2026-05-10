/**
 * GrowLab Sensors API Client (F5)
 */

import type { ApiResponse } from '@/types/auth'
import type {
  SensorDevice,
  SensorReading,
  CreateSensorDeviceRequest,
  UpdateSensorDeviceRequest,
} from '@/types/sensors'

async function fetchSensorsApi<T>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const response = await fetch(`/api/sensors${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
    credentials: 'include',
  })
  return response.json()
}

export async function listSensorDevices(
  accessToken: string,
): Promise<ApiResponse<{ devices: SensorDevice[] }>> {
  return fetchSensorsApi<{ devices: SensorDevice[] }>('/', accessToken)
}

export async function createSensorDevice(
  accessToken: string,
  req: CreateSensorDeviceRequest,
): Promise<ApiResponse<{ device: SensorDevice }>> {
  return fetchSensorsApi<{ device: SensorDevice }>('/', accessToken, {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export async function updateSensorDevice(
  accessToken: string,
  id: string,
  req: UpdateSensorDeviceRequest,
): Promise<ApiResponse<{ device: SensorDevice }>> {
  return fetchSensorsApi<{ device: SensorDevice }>(`/${id}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(req),
  })
}

export async function deleteSensorDevice(
  accessToken: string,
  id: string,
): Promise<ApiResponse<{ deleted: true }>> {
  return fetchSensorsApi<{ deleted: true }>(`/${id}`, accessToken, {
    method: 'DELETE',
  })
}

export interface ListReadingsParams {
  plantId?: string
  tentId?: string
  metric?: string
  from?: string
  to?: string
  limit?: number
}

export async function listReadings(
  accessToken: string,
  params: ListReadingsParams,
): Promise<ApiResponse<{ readings: SensorReading[] }>> {
  const searchParams = new URLSearchParams()
  if (params.plantId) searchParams.set('plantId', params.plantId)
  if (params.tentId) searchParams.set('tentId', params.tentId)
  if (params.metric) searchParams.set('metric', params.metric)
  if (params.from) searchParams.set('from', params.from)
  if (params.to) searchParams.set('to', params.to)
  if (params.limit) searchParams.set('limit', String(params.limit))

  const qs = searchParams.toString()
  return fetchSensorsApi<{ readings: SensorReading[] }>(
    `/readings${qs ? `?${qs}` : ''}`,
    accessToken,
  )
}
