/**
 * GrowLab Growth Measurement Hooks (F5)
 *
 * React Query hooks for growth measurements and derived growth bars.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/lib/stores/auth'
import * as growthApi from '@/lib/api/growth'
import { getApiErrorToastMessage, ApiResponseError } from '@/lib/api/errors'
import type { CreateGrowthMeasurementRequest } from '@/types/sensors'
import { plantKeys } from './usePlants'

// ─── Query key factories ──────────────────────────────────────────────────────

export const growthKeys = {
  all: (plantId: string) => [...plantKeys.detail(plantId), 'growth'] as const,
  lists: (plantId: string) => [...growthKeys.all(plantId), 'list'] as const,
  list: (plantId: string, params?: { metric?: string; limit?: number }) =>
    [...growthKeys.lists(plantId), params] as const,
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** List growth measurements and derived growth bars for a plant */
export function useGrowthMeasurements(plantId: string, params?: { metric?: string; limit?: number }) {
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: growthKeys.list(plantId, params),
    queryFn: async () => {
      if (!accessToken) throw new Error('Not authenticated')
      const result = await growthApi.listGrowthMeasurements(accessToken, plantId, params)
      if (!result.success) throw new Error(result.error.message)
      return result.data
    },
    enabled: !!accessToken && !!plantId,
  })
}

/** Create a growth measurement for a plant */
export function useCreateGrowthMeasurement(plantId: string) {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (req: CreateGrowthMeasurementRequest) => {
      if (!accessToken) throw new Error('Not authenticated')
      const result = await growthApi.createGrowthMeasurement(accessToken, plantId, req)
      if (!result.success) throw new ApiResponseError(result.error)
      return result.data.measurement
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: growthKeys.lists(plantId) })
      toast.success('Growth measurement recorded')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorToastMessage(error))
    },
  })
}
