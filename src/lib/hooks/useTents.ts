/**
 * GrowLab Tents Hooks (F2)
 *
 * React Query hooks for tent CRUD. Mirrors the structure of
 * `usePlants.ts` so consumers see a uniform pattern across resources.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/stores/auth'
import * as tentsApi from '@/lib/api/tents'
import { ApiResponseError } from '@/lib/api/errors'
import type {
  CreateTentRequest,
  UpdateTentRequest,
  ListTentsParams,
} from '@/types/tents'

export const tentKeys = {
  all: ['tents'] as const,
  lists: () => [...tentKeys.all, 'list'] as const,
  list: (params?: ListTentsParams) => [...tentKeys.lists(), params] as const,
  details: () => [...tentKeys.all, 'detail'] as const,
  detail: (id: string) => [...tentKeys.details(), id] as const,
}

export function useTents(params?: ListTentsParams) {
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: tentKeys.list(params),
    queryFn: async () => {
      if (!accessToken) throw new Error('Not authenticated')
      const result = await tentsApi.listTents(accessToken, params)
      if (!result.success) throw new ApiResponseError(result.error)
      return result.data
    },
    enabled: !!accessToken,
  })
}

export function useTent(tentId: string) {
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: tentKeys.detail(tentId),
    queryFn: async () => {
      if (!accessToken) throw new Error('Not authenticated')
      const result = await tentsApi.getTent(accessToken, tentId)
      if (!result.success) throw new ApiResponseError(result.error)
      return result.data.tent
    },
    enabled: !!accessToken && !!tentId,
  })
}

export function useCreateTent() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTentRequest) => {
      if (!accessToken) throw new Error('Not authenticated')
      const result = await tentsApi.createTent(accessToken, data)
      if (!result.success) throw new ApiResponseError(result.error)
      return result.data.tent
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tentKeys.lists() })
    },
  })
}

export function useUpdateTent() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      tentId,
      data,
    }: {
      tentId: string
      data: UpdateTentRequest
    }) => {
      if (!accessToken) throw new Error('Not authenticated')
      const result = await tentsApi.updateTent(accessToken, tentId, data)
      if (!result.success) throw new ApiResponseError(result.error)
      return result.data.tent
    },
    onSuccess: (tent) => {
      queryClient.setQueryData(tentKeys.detail(tent.id), tent)
      queryClient.invalidateQueries({ queryKey: tentKeys.lists() })
    },
  })
}

export function useDeleteTent() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tentId: string) => {
      if (!accessToken) throw new Error('Not authenticated')
      const result = await tentsApi.deleteTent(accessToken, tentId)
      if (!result.success) throw new ApiResponseError(result.error)
      return tentId
    },
    onSuccess: (tentId) => {
      queryClient.removeQueries({ queryKey: tentKeys.detail(tentId) })
      queryClient.invalidateQueries({ queryKey: tentKeys.lists() })
    },
  })
}
