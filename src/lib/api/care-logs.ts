/**
 * GrowLab Care Logs API Client
 *
 * API client functions for care logging endpoints.
 * F3: adds listScheduledCareLogs (GET /api/care-logs window query) and
 *     completeCareLog (POST /api/care-logs/:id/complete).
 */

import type { ApiResponse } from '@/types/auth'
import type {
  CareLogResponse,
  CareLogsListResponse,
  CompleteCareLogResponse,
  CreateCareLogRequest,
  ListCareLogsParams,
  ListScheduledCareLogsParams,
} from '@/types/care-logs'

/**
 * Make an authenticated API request to the nested plant logs endpoints
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
 * Make an authenticated API request to the top-level /api/care-logs endpoints (F3)
 */
async function fetchCareLogsApi<T>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const response = await fetch(`/api/care-logs${endpoint}`, {
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

/**
 * F3 — List care logs across all user-owned plants filtered by scheduled window.
 * GET /api/care-logs?plantId=&scheduledFrom=&scheduledTo=
 */
export async function listScheduledCareLogs(
  accessToken: string,
  params?: ListScheduledCareLogsParams
): Promise<ApiResponse<CareLogsListResponse>> {
  const searchParams = new URLSearchParams()
  if (params?.plantId) searchParams.set('plantId', params.plantId)
  if (params?.scheduledFrom) searchParams.set('scheduledFrom', params.scheduledFrom)
  if (params?.scheduledTo) searchParams.set('scheduledTo', params.scheduledTo)

  const query = searchParams.toString()
  return fetchCareLogsApi<CareLogsListResponse>(
    query ? `?${query}` : '',
    accessToken,
    { method: 'GET' }
  )
}

/**
 * F3 — Mark a care log as completed and potentially spawn the next recurrence.
 * POST /api/care-logs/:id/complete
 */
export async function completeCareLog(
  accessToken: string,
  id: string
): Promise<ApiResponse<CompleteCareLogResponse>> {
  return fetchCareLogsApi<CompleteCareLogResponse>(
    `/${id}/complete`,
    accessToken,
    { method: 'POST' }
  )
}
