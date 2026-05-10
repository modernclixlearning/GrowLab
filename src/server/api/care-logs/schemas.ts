/**
 * GrowLab Care Log Validation Schemas
 *
 * Zod schemas for runtime validation of care logging inputs.
 * F3: extends create schema with scheduledAt + recurrenceRule;
 *     adds listScheduledCareLogsQuerySchema for the cross-plant GET.
 */

import { z } from 'zod'
import { CARE_LOG_TYPES } from '@/server/db/schema/care-logs'

// ─── Recurrence rule ──────────────────────────────────────────────────────────

/**
 * Strict schema for RecurrenceRule — no extra keys allowed.
 * Mirrors src/lib/recurrence.ts RecurrenceRule interface.
 */
export const recurrenceRuleSchema = z
  .object({
    frequency: z.enum(['daily', 'weekly']),
    interval: z
      .number()
      .int('interval must be an integer')
      .min(1, 'interval must be >= 1'),
    byWeekday: z
      .array(
        z
          .number()
          .int()
          .min(0, 'weekday must be 0–6')
          .max(6, 'weekday must be 0–6'),
      )
      .min(1, 'byWeekday must not be empty when present')
      .optional(),
    until: z
      .string()
      .datetime({ message: 'until must be a valid ISO 8601 date' })
      .optional(),
    count: z
      .number()
      .int('count must be an integer')
      .min(0, 'count must be >= 0')
      .optional(),
  })
  .strict()

export type RecurrenceRuleInput = z.infer<typeof recurrenceRuleSchema>

// ─── Create care log ──────────────────────────────────────────────────────────

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
  /** F3 — when the task is due. */
  scheduledAt: z
    .string()
    .datetime({ message: 'scheduledAt must be a valid ISO 8601 date' })
    .optional(),
  /** F3 — repeat rule. */
  recurrenceRule: recurrenceRuleSchema.optional(),
}).refine(
  (data) => !data.recurrenceRule || data.scheduledAt !== undefined,
  { message: 'scheduledAt is required when recurrenceRule is provided', path: ['scheduledAt'] },
)

// ─── Query parameters for listing per-plant logs ──────────────────────────────

/**
 * Query parameters for listing care logs (per-plant endpoint).
 */
export const listCareLogsQuerySchema = z.object({
  logType: z.enum(CARE_LOG_TYPES).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
})

// ─── F3: Scheduled window query ───────────────────────────────────────────────

/**
 * Query parameters for GET /api/care-logs (cross-plant scheduled view).
 * `plantId` is optional — omitting it returns across all user-owned plants.
 * `scheduledFrom` / `scheduledTo` are inclusive ISO datetime strings.
 */
export const listScheduledCareLogsQuerySchema = z.object({
  plantId: z.string().optional(),
  scheduledFrom: z
    .string()
    .datetime({ message: 'scheduledFrom must be a valid ISO 8601 date' })
    .optional(),
  scheduledTo: z
    .string()
    .datetime({ message: 'scheduledTo must be a valid ISO 8601 date' })
    .optional(),
})

/** TypeScript types inferred from schemas */
export type CreateCareLogInput = z.infer<typeof createCareLogSchema>
export type ListCareLogsQuery = z.infer<typeof listCareLogsQuerySchema>
export type ListScheduledCareLogsQuery = z.infer<typeof listScheduledCareLogsQuerySchema>
