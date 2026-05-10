/**
 * GrowLab Tents API Client (F2)
 */

import type { ApiResponse } from '@/types/auth'
import type {
  CreateTentRequest,
  UpdateTentRequest,
  ListTentsParams,
  TentResponse,
  TentsListResponse,
  DeleteTentResponse,
} from '@/types/tents'

const API_BASE = '/api/tents'

async function fetchApi<T>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {},
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

export async function listTents(
  accessToken: string,
  params?: ListTentsParams,
): Promise<ApiResponse<TentsListResponse>> {
  const search = new URLSearchParams()
  if (params?.limit) search.set('limit', String(params.limit))
  if (params?.offset) search.set('offset', String(params.offset))
  const query = search.toString()
  return fetchApi<TentsListResponse>(query ? `?${query}` : '', accessToken, {
    method: 'GET',
  })
}

export async function getTent(
  accessToken: string,
  tentId: string,
): Promise<ApiResponse<TentResponse>> {
  return fetchApi<TentResponse>(`/${tentId}`, accessToken, { method: 'GET' })
}

export async function createTent(
  accessToken: string,
  data: CreateTentRequest,
): Promise<ApiResponse<TentResponse>> {
  return fetchApi<TentResponse>('', accessToken, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateTent(
  accessToken: string,
  tentId: string,
  data: UpdateTentRequest,
): Promise<ApiResponse<TentResponse>> {
  return fetchApi<TentResponse>(`/${tentId}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteTent(
  accessToken: string,
  tentId: string,
): Promise<ApiResponse<DeleteTentResponse>> {
  return fetchApi<DeleteTentResponse>(`/${tentId}`, accessToken, {
    method: 'DELETE',
  })
}
