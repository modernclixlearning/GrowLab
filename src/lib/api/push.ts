import type { ApiResponse } from '@/types/auth'

async function fetchPushApi<T>(
  endpoint: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
  const response = await fetch(`/api/push${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers },
    credentials: 'include',
  })
  return response.json()
}

export async function getVapidPublicKey(): Promise<ApiResponse<{ key: string }>> {
  return fetchPushApi<{ key: string }>('/vapid-public-key')
}

export async function subscribePush(
  accessToken: string,
  sub: PushSubscriptionJSON,
): Promise<ApiResponse<{ success: true }>> {
  return fetchPushApi<{ success: true }>(
    '/subscribe',
    {
      method: 'POST',
      body: JSON.stringify({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.keys?.p256dh, auth: sub.keys?.auth },
        userAgent: navigator.userAgent,
      }),
    },
    accessToken,
  )
}

export async function unsubscribePush(
  accessToken: string,
  endpoint: string,
): Promise<ApiResponse<{ success: true }>> {
  return fetchPushApi<{ success: true }>(
    '/subscribe',
    { method: 'DELETE', body: JSON.stringify({ endpoint }) },
    accessToken,
  )
}
