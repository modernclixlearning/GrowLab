/**
 * GrowLab Care Logs Hooks
 * 
 * React Query hooks for care logging operations.
 * Provides caching, automatic refetching, and cache invalidation.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/stores/auth'
import * as careLogsApi from '@/lib/api/care-logs'
import type {
  CreateCareLogRequest,
  ListCareLogsParams,
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
      if (!result.success) throw new Error(result.error.message)
      return result.data.careLog
    },
    onSuccess: () => {
      // Invalidate care log list queries to refetch
      queryClient.invalidateQueries({ queryKey: careLogKeys.lists(plantId) })
    },
  })
}
