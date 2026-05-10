/**
 * GrowLab Growth Measurements API Validation Schemas (F5)
 */

import { z } from 'zod'
import { GROWTH_METRICS } from '@/server/db/schema/growth-measurements'

export const createGrowthMeasurementSchema = z.object({
  plantId: z.string().min(1),
  metric: z.enum(GROWTH_METRICS, {
    errorMap: () => ({ message: `metric must be one of: ${GROWTH_METRICS.join(', ')}` }),
  }),
  value: z.number().positive('value must be a positive number'),
  recordedAt: z
    .string()
    .datetime({ message: 'recordedAt must be a valid ISO 8601 date' })
    .optional(),
})

export type CreateGrowthMeasurementInput = z.infer<typeof createGrowthMeasurementSchema>

export const listGrowthMeasurementsQuerySchema = z.object({
  plantId: z.string().min(1),
  metric: z.enum(GROWTH_METRICS).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(10),
})

export type ListGrowthMeasurementsQuery = z.infer<typeof listGrowthMeasurementsQuerySchema>
