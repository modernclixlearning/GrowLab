import type { ApiResponse } from '@/types/auth'
import type { NotificationsListResponse } from '@/types/notifications'

async function fetchNotificationsApi<T>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const response = await fetch(`/api/notifications${endpoint}`, {
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

export async function listNotifications(
  accessToken: string,
  page = 1,
  limit = 20,
): Promise<ApiResponse<NotificationsListResponse>> {
  return fetchNotificationsApi<NotificationsListResponse>(
    `/?page=${page}&limit=${limit}`,
    accessToken,
  )
}

export async function getUnreadCount(
  accessToken: string,
): Promise<ApiResponse<{ count: number }>> {
  return fetchNotificationsApi<{ count: number }>('/unread-count', accessToken)
}

export async function markRead(
  accessToken: string,
  id: string,
): Promise<ApiResponse<{ success: true }>> {
  return fetchNotificationsApi<{ success: true }>(`/${id}/read`, accessToken, { method: 'PATCH' })
}

export async function markAllRead(
  accessToken: string,
): Promise<ApiResponse<{ updated: number }>> {
  return fetchNotificationsApi<{ updated: number }>('/read-all', accessToken, { method: 'PATCH' })
}
