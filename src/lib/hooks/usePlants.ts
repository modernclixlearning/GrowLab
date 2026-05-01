/**
 * GrowLab Plants Hooks
 * 
 * React Query hooks for plant management operations.
 * Provides caching, automatic refetching, and optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/stores/auth'
import * as plantsApi from '@/lib/api/plants'
import { ApiResponseError } from '@/lib/api/errors'
import type {
  CreatePlantRequest,
  UpdatePlantRequest,
  ListPlantsParams,
} from '@/types/plants'

/**
 * Query key factory for plants
 */
export const plantKeys = {
  all: ['plants'] as const,
  lists: () => [...plantKeys.all, 'list'] as const,
  list: (params?: ListPlantsParams) => [...plantKeys.lists(), params] as const,
  details: () => [...plantKeys.all, 'detail'] as const,
  detail: (id: string) => [...plantKeys.details(), id] as const,
}

/**
 * Hook to list plants with filtering
 */
export function usePlants(params?: ListPlantsParams) {
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: plantKeys.list(params),
    queryFn: async () => {
      if (!accessToken) throw new Error('Not authenticated')
      const result = await plantsApi.listPlants(accessToken, params)
      if (!result.success) throw new ApiResponseError(result.error)
      return result.data
    },
    enabled: !!accessToken,
  })
}

/**
 * Hook to get a single plant by ID
 */
export function usePlant(plantId: string) {
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: plantKeys.detail(plantId),
    queryFn: async () => {
      if (!accessToken) throw new Error('Not authenticated')
      const result = await plantsApi.getPlant(accessToken, plantId)
      if (!result.success) throw new ApiResponseError(result.error)
      return result.data.plant
    },
    enabled: !!accessToken && !!plantId,
  })
}

/**
 * Hook to create a new plant
 */
export function useCreatePlant() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreatePlantRequest) => {
      if (!accessToken) throw new Error('Not authenticated')
      const result = await plantsApi.createPlant(accessToken, data)
      if (!result.success) throw new ApiResponseError(result.error)
      return result.data.plant
    },
    onSuccess: () => {
      // Invalidate plant list queries to refetch
      queryClient.invalidateQueries({ queryKey: plantKeys.lists() })
    },
  })
}

/**
 * Hook to update a plant
 */
export function useUpdatePlant() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      plantId,
      data,
    }: {
      plantId: string
      data: UpdatePlantRequest
    }) => {
      if (!accessToken) throw new Error('Not authenticated')
      const result = await plantsApi.updatePlant(accessToken, plantId, data)
      if (!result.success) throw new ApiResponseError(result.error)
      return result.data.plant
    },
    onSuccess: (plant) => {
      // Update the individual plant cache
      queryClient.setQueryData(plantKeys.detail(plant.id), plant)
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: plantKeys.lists() })
    },
  })
}

/**
 * Hook to delete a plant
 */
export function useDeletePlant() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (plantId: string) => {
      if (!accessToken) throw new Error('Not authenticated')
      const result = await plantsApi.deletePlant(accessToken, plantId)
      if (!result.success) throw new ApiResponseError(result.error)
      return plantId
    },
    onSuccess: (plantId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: plantKeys.detail(plantId) })
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: plantKeys.lists() })
    },
  })
}
