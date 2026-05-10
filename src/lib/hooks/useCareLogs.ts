/**
 * GrowLab Care Logs Hooks
 *
 * React Query hooks for care logging operations.
 * Provides caching, automatic refetching, and cache invalidation.
 * F3: adds useScheduledCareLogs and useCompleteCareLog.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/lib/stores/auth'
import * as careLogsApi from '@/lib/api/care-logs'
import { getApiErrorToastMessage, ApiResponseError } from '@/lib/api/errors'
import type {
  CreateCareLogRequest,
  ListCareLogsParams,
  ListScheduledCareLogsParams,
} from '@/types/care-logs'
import { plantKeys } from './usePlants'

/**
 * Query key factory for care logs
 */
export const careLogKeys = {
  all: (plantId: string) => [...plantKeys.detail(plantId), 'logs'] as const,
  lists: (plantId: string) => [...careLogKeys.all(plantId), 'list'] as const,
  list: (plantId: string, params?: ListCareLogsParams) =>
    [...careLogKeys.lists(plantId), params] as const,
}

/** F3 — top-level schedule query keys (not tied to a specific plant) */
export const scheduleKeys = {
  all: ['schedule'] as const,
  lists: () => [...scheduleKeys.all, 'list'] as const,
  list: (params?: ListScheduledCareLogsParams) =>
    [...scheduleKeys.lists(), params] as const,
}

/**
 * Hook to list care logs for a plant
 */
export function useCareLogs(plantId: string, params?: ListCareLogsParams) {
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: careLogKeys.list(plantId, params),
    queryFn: async () => {
      if (!accessToken) throw new Error('Not authenticated')
      const result = await careLogsApi.listCareLogs(accessToken, plantId, params)
      if (!result.success) throw new Error(result.error.message)
      return result.data
    },
    enabled: !!accessToken && !!plantId,
  })
}

/**
 * Hook to create a care log entry
 */
export function useCreateCareLog(plantId: string) {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCareLogRequest) => {
      if (!accessToken) throw new Error('Not authenticated')
      const result = await careLogsApi.createCareLog(accessToken, plantId, data)
      if (!result.success) throw new ApiResponseError(result.error)
      return result.data.careLog
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: careLogKeys.lists(plantId) })
      // Invalidate schedule queries in case a scheduled log was added
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all })
    },
  })
}

/**
 * F3 — Hook to list scheduled care logs across all user-owned plants.
 */
export function useScheduledCareLogs(params?: ListScheduledCareLogsParams) {
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: scheduleKeys.list(params),
    queryFn: async () => {
      if (!accessToken) throw new Error('Not authenticated')
      const result = await careLogsApi.listScheduledCareLogs(accessToken, params)
      if (!result.success) throw new Error(result.error.message)
      return result.data
    },
    enabled: !!accessToken,
  })
}

/**
 * F3 — Hook to mark a care log as completed.
 * Shows Sonner toasts and invalidates both per-plant and schedule caches.
 */
export function useCompleteCareLog() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!accessToken) throw new Error('Not authenticated')
      const result = await careLogsApi.completeCareLog(accessToken, id)
      if (!result.success) throw new ApiResponseError(result.error)
      return result.data
    },
    onSuccess: (data) => {
      const next = data.next
      if (next) {
        toast.success('Task completed — next occurrence scheduled')
      } else {
        toast.success('Task completed')
      }
      // Invalidate all schedule + per-plant caches
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all })
      queryClient.invalidateQueries({ queryKey: plantKeys.all })
    },
    onError: (error) => {
      const message = getApiErrorToastMessage(error, 'Failed to complete task')
      toast.error(message)
    },
  })
}
