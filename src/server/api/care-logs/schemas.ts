/**
 * GrowLab Care Log Validation Schemas
 * 
 * Zod schemas for runtime validation of care logging inputs.
 */

import { z } from 'zod'
import { CARE_LOG_TYPES } from '@/server/db/schema/care-logs'

/**
 * Create care log request validation schema
 */
export const createCareLogSchema = z.object({
  logType: z.enum(CARE_LOG_TYPES, {
    errorMap: () => ({ message: `Log type must be one of: ${CARE_LOG_TYPES.join(', ')}` }),
  }),
  amount: z
    .number()
    .positive('Amount must be a positive number')
    .max(99999999.99, 'Amount is too large')
    .optional(),
  unit: z
    .string()
    .max(20, 'Unit must be at most 20 characters')
    .optional(),
  notes: z
    .string()
    .max(1000, 'Notes must be at most 1000 characters')
    .optional(),
  loggedAt: z
    .string()
    .datetime({ message: 'Logged at must be a valid ISO 8601 date' })
    .optional(),
})

/**
 * Query parameters for listing care logs
 */
export const listCareLogsQuerySchema = z.object({
  logType: z.enum(CARE_LOG_TYPES).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
})

/** TypeScript types inferred from schemas */
export type CreateCareLogInput = z.infer<typeof createCareLogSchema>
export type ListCareLogsQuery = z.infer<typeof listCareLogsQuerySchema>
