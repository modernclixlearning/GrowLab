import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/stores/auth'
import * as notificationsApi from '@/lib/api/notifications'

const POLL_INTERVAL_FOCUSED = 30_000
const POLL_INTERVAL_BACKGROUND = 120_000

export function useNotifications(page = 1, limit = 20) {
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: ['notifications', page, limit],
    queryFn: () => notificationsApi.listNotifications(accessToken!, page, limit),
    enabled: !!accessToken,
    refetchInterval: (query) => {
      if (!document.hidden) return POLL_INTERVAL_FOCUSED
      return query.state.data ? POLL_INTERVAL_BACKGROUND : false
    },
    refetchOnWindowFocus: true,
    select: (res) => (res.success ? res.data : null),
  })
}

export function useUnreadCount() {
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(accessToken!),
    enabled: !!accessToken,
    refetchInterval: POLL_INTERVAL_FOCUSED,
    refetchOnWindowFocus: true,
    select: (res) => (res.success ? res.data.count : 0),
  })
}

export function useMarkNotificationRead() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(accessToken!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllRead() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
