/**
 * GrowLab Sensor API Validation Schemas (F5)
 *
 * Zod schemas for sensor device CRUD and readings query endpoints.
 */

import { z } from 'zod'
import { SENSOR_PROVIDERS } from '@/server/db/schema/sensor-devices'
import { METRICS } from '@/server/db/schema/sensor-readings'

// ─── Sensor Device ───────────────────────────────────────────────────────────

export const createSensorDeviceSchema = z
  .object({
    provider: z.enum(SENSOR_PROVIDERS, {
      errorMap: () => ({ message: `provider must be one of: ${SENSOR_PROVIDERS.join(', ')}` }),
    }),
    apiKey: z.string().min(1).optional(),
    label: z.string().min(1).max(100),
    targetPlantId: z.string().optional(),
    targetTentId: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    // Cannot set both targetPlantId and targetTentId simultaneously
    const hasPlant = !!val.targetPlantId
    const hasTent = !!val.targetTentId
    if (hasPlant && hasTent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'targetPlantId and targetTentId are mutually exclusive',
        path: ['targetTentId'],
      })
    }
    // apiKey required for non-manual providers
    if (val.provider !== 'manual' && !val.apiKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'apiKey is required for non-manual providers',
        path: ['apiKey'],
      })
    }
  })

export type CreateSensorDeviceInput = z.infer<typeof createSensorDeviceSchema>

export const updateSensorDeviceSchema = z
  .object({
    provider: z.enum(SENSOR_PROVIDERS).optional(),
    apiKey: z.string().min(1).optional(),
    label: z.string().min(1).max(100).optional(),
    targetPlantId: z.string().optional().nullable(),
    targetTentId: z.string().optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.targetPlantId && val.targetTentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'targetPlantId and targetTentId are mutually exclusive',
        path: ['targetTentId'],
      })
    }
  })

export type UpdateSensorDeviceInput = z.infer<typeof updateSensorDeviceSchema>

// ─── Sensor Readings ─────────────────────────────────────────────────────────

export const listReadingsQuerySchema = z
  .object({
    plantId: z.string().optional(),
    tentId: z.string().optional(),
    metric: z.enum(METRICS).optional(),
    from: z.string().datetime({ message: 'from must be a valid ISO 8601 date' }).optional(),
    to: z.string().datetime({ message: 'to must be a valid ISO 8601 date' }).optional(),
    limit: z.coerce.number().int().min(1).max(500).default(100),
  })
  .superRefine((val, ctx) => {
    if (!val.plantId && !val.tentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Either plantId or tentId must be provided',
        path: ['plantId'],
      })
    }
  })

export type ListReadingsQuery = z.infer<typeof listReadingsQuerySchema>
