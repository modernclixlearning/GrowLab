/**
 * GrowLab Plants API Client
 * 
 * API client functions for plant management endpoints.
 */

import type {
  ApiResponse,
} from '@/types/auth'
import type {
  PlantResponse,
  PlantsListResponse,
  DeletePlantResponse,
  CreatePlantRequest,
  UpdatePlantRequest,
  ListPlantsParams,
} from '@/types/plants'

const API_BASE = '/api/plants'

/**
 * Make an authenticated API request
 */
async function fetchApi<T>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
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
 * List plants with optional filtering
 */
export async function listPlants(
  accessToken: string,
  params?: ListPlantsParams
): Promise<ApiResponse<PlantsListResponse>> {
  const searchParams = new URLSearchParams()
  if (params?.stage) searchParams.set('stage', params.stage)
  if (params?.search) searchParams.set('search', params.search)
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder)
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.offset) searchParams.set('offset', String(params.offset))

  const query = searchParams.toString()
  return fetchApi<PlantsListResponse>(
    query ? `?${query}` : '',
    accessToken,
    { method: 'GET' }
  )
}

/**
 * Get a single plant by ID
 */
export async function getPlant(
  accessToken: string,
  plantId: string
): Promise<ApiResponse<PlantResponse>> {
  return fetchApi<PlantResponse>(`/${plantId}`, accessToken, {
    method: 'GET',
  })
}

/**
 * Create a new plant
 */
export async function createPlant(
  accessToken: string,
  data: CreatePlantRequest
): Promise<ApiResponse<PlantResponse>> {
  return fetchApi<PlantResponse>('', accessToken, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Update a plant
 */
export async function updatePlant(
  accessToken: string,
  plantId: string,
  data: UpdatePlantRequest
): Promise<ApiResponse<PlantResponse>> {
  return fetchApi<PlantResponse>(`/${plantId}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

/**
 * Delete a plant
 */
export async function deletePlant(
  accessToken: string,
  plantId: string
): Promise<ApiResponse<DeletePlantResponse>> {
  return fetchApi<DeletePlantResponse>(`/${plantId}`, accessToken, {
    method: 'DELETE',
  })
}
