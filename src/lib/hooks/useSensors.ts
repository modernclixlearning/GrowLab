/**
 * GrowLab Sensor Devices Hooks (F5)
 *
 * React Query hooks for sensor device CRUD and readings queries.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/lib/stores/auth'
import * as sensorsApi from '@/lib/api/sensors'
import { getApiErrorToastMessage, ApiResponseError } from '@/lib/api/errors'
import type { CreateSensorDeviceRequest, UpdateSensorDeviceRequest, SensorMetric } from '@/types/sensors'

// ─── Query key factories ──────────────────────────────────────────────────────

export const sensorKeys = {
  all: ['sensors'] as const,
  lists: () => [...sensorKeys.all, 'list'] as const,
  list: () => [...sensorKeys.lists()] as const,
  detail: (id: string) => [...sensorKeys.all, 'detail', id] as const,
  readings: (plantId?: string, tentId?: string, metric?: string) =>
    [...sensorKeys.all, 'readings', { plantId, tentId, metric }] as const,
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** List all sensor devices for the authenticated user */
export function useSensorDevices() {
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: sensorKeys.list(),
    queryFn: async () => {
      if (!accessToken) throw new Error('Not authenticated')
      const result = await sensorsApi.listSensorDevices(accessToken)
      if (!result.success) throw new Error(result.error.message)
      return result.data
    },
    enabled: !!accessToken,
  })
}

/** Create a new sensor device */
export function useCreateSensorDevice() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (req: CreateSensorDeviceRequest) => {
      if (!accessToken) throw new Error('Not authenticated')
      const result = await sensorsApi.createSensorDevice(accessToken, req)
      if (!result.success) throw new ApiResponseError(result.error)
      return result.data.device
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sensorKeys.lists() })
      toast.success('Sensor device added')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorToastMessage(error))
    },
  })
}

/** Update an existing sensor device */
export function useUpdateSensorDevice(id: string) {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (req: UpdateSensorDeviceRequest) => {
      if (!accessToken) throw new Error('Not authenticated')
      const result = await sensorsApi.updateSensorDevice(accessToken, id, req)
      if (!result.success) throw new ApiResponseError(result.error)
      return result.data.device
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sensorKeys.lists() })
      toast.success('Sensor device updated')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorToastMessage(error))
    },
  })
}

/** Delete a sensor device */
export function useDeleteSensorDevice() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!accessToken) throw new Error('Not authenticated')
      const result = await sensorsApi.deleteSensorDevice(accessToken, id)
      if (!result.success) throw new ApiResponseError(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sensorKeys.lists() })
      toast.success('Sensor device removed')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorToastMessage(error))
    },
  })
}

/** List sensor readings for a plant or tent */
export function useSensorReadings(params: sensorsApi.ListReadingsParams) {
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: sensorKeys.readings(params.plantId, params.tentId, params.metric),
    queryFn: async () => {
      if (!accessToken) throw new Error('Not authenticated')
      const result = await sensorsApi.listReadings(accessToken, params)
      if (!result.success) throw new Error(result.error.message)
      return result.data
    },
    enabled: !!accessToken && !!(params.plantId || params.tentId),
    staleTime: 60_000, // Readings are refreshed every 5min on server; 1min client stale
  })
}

/** Get the most recent reading per metric for a given plant */
export function useLatestReadings(plantId: string | undefined, metrics: SensorMetric[] = ['humidity', 'temperature']) {
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: sensorKeys.readings(plantId, undefined, metrics.join(',')),
    queryFn: async () => {
      if (!accessToken || !plantId) throw new Error('Not authenticated or no plant')
      // Fetch last 10 readings — enough to get the latest per metric
      const result = await sensorsApi.listReadings(accessToken, { plantId, limit: 10 })
      if (!result.success) throw new Error(result.error.message)

      // Reduce to latest reading per metric
      const latest: Partial<Record<SensorMetric, (typeof result.data.readings)[0]>> = {}
      for (const reading of result.data.readings) {
        const m = reading.metric as SensorMetric
        if (metrics.includes(m) && !latest[m]) {
          latest[m] = reading
        }
      }
      return latest
    },
    enabled: !!accessToken && !!plantId,
    staleTime: 60_000,
  })
}
