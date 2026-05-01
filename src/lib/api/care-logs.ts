/**
 * GrowLab Care Logs API Client
 * 
 * API client functions for care logging endpoints.
 */

import type { ApiResponse } from '@/types/auth'
import type {
  CareLogResponse,
  CareLogsListResponse,
  CreateCareLogRequest,
  ListCareLogsParams,
} from '@/types/care-logs'

/**
 * Make an authenticated API request to care logs endpoints
 */
async function fetchApi<T>(
  plantId: string,
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const response = await fetch(`/api/plants/${plantId}/logs${endpoint}`, {
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

/**
 * List care logs for a plant
 */
export async function listCareLogs(
  accessToken: string,
  plantId: string,
  params?: ListCareLogsParams
): Promise<ApiResponse<CareLogsListResponse>> {
  const searchParams = new URLSearchParams()
  if (params?.logType) searchParams.set('logType', params.logType)
  if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder)
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.offset) searchParams.set('offset', String(params.offset))

  const query = searchParams.toString()
  return fetchApi<CareLogsListResponse>(
    plantId,
    query ? `?${query}` : '',
    accessToken,
    { method: 'GET' }
  )
}

/**
 * Create a care log entry for a plant
 */
export async function createCareLog(
  accessToken: string,
  plantId: string,
  data: CreateCareLogRequest
): Promise<ApiResponse<CareLogResponse>> {
  return fetchApi<CareLogResponse>(plantId, '', accessToken, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
