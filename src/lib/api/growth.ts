/**
 * GrowLab Growth API Client (F5)
 */

import type { ApiResponse } from '@/types/auth'
import type { GrowthBar, GrowthMeasurement, CreateGrowthMeasurementRequest } from '@/types/sensors'

async function fetchGrowthApi<T>(
  plantId: string,
  endpoint: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const response = await fetch(`/api/plants/${plantId}/growth${endpoint}`, {
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

export async function listGrowthMeasurements(
  accessToken: string,
  plantId: string,
  params?: { metric?: string; limit?: number },
): Promise<ApiResponse<{ measurements: GrowthMeasurement[]; growthBars: GrowthBar[] }>> {
  const searchParams = new URLSearchParams()
  if (params?.metric) searchParams.set('metric', params.metric)
  if (params?.limit) searchParams.set('limit', String(params.limit))
  const qs = searchParams.toString()
  return fetchGrowthApi<{ measurements: GrowthMeasurement[]; growthBars: GrowthBar[] }>(
    plantId,
    qs ? `?${qs}` : '',
    accessToken,
  )
}

export async function createGrowthMeasurement(
  accessToken: string,
  plantId: string,
  req: CreateGrowthMeasurementRequest,
): Promise<ApiResponse<{ measurement: GrowthMeasurement }>> {
  return fetchGrowthApi<{ measurement: GrowthMeasurement }>(plantId, '', accessToken, {
    method: 'POST',
    body: JSON.stringify(req),
  })
}
