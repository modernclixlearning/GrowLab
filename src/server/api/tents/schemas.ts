/**
 * GrowLab Tent Validation Schemas
 *
 * Zod schemas for runtime validation of tent CRUD inputs.
 * Master Plan §4.1 (F2).
 */

import { z } from 'zod'

/**
 * Light target — free-form text but bounded length so the DB column is happy.
 * Common values: "18/6", "12/12", "20/4", "auto".
 */
const lightTarget = z
  .string()
  .min(1)
  .max(20, 'Light target must be at most 20 characters')

/**
 * Numeric target shared by humidity (0–100) and temperature (-50–60 C).
 * Stored as numeric in PG; we accept number on the wire and coerce below.
 */
const humidityTargetPct = z
  .number()
  .min(0, 'Humidity target must be ≥ 0')
  .max(100, 'Humidity target must be ≤ 100')

const tempTargetC = z
  .number()
  .min(-50, 'Temperature target out of range')
  .max(60, 'Temperature target out of range')

const notes = z.string().max(2000, 'Notes must be at most 2000 characters')

/** Create tent payload. */
export const createTentSchema = z.object({
  name: z
    .string()
    .min(1, 'Tent name is required')
    .max(100, 'Tent name must be at most 100 characters'),
  lightTarget: lightTarget.optional(),
  humidityTargetPct: humidityTargetPct.optional(),
  tempTargetC: tempTargetC.optional(),
  notes: notes.optional(),
})

/**
 * Update tent payload — all fields optional, nullable values allowed for
 * the optional ones so the user can clear a previously-set field.
 */
export const updateTentSchema = z.object({
  name: z
    .string()
    .min(1, 'Tent name is required')
    .max(100, 'Tent name must be at most 100 characters')
    .optional(),
  lightTarget: lightTarget.nullable().optional(),
  humidityTargetPct: humidityTargetPct.nullable().optional(),
  tempTargetC: tempTargetC.nullable().optional(),
  notes: notes.nullable().optional(),
})

/** Listing query — no params yet, but typed for forward-compat. */
export const listTentsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
})

export type CreateTentInput = z.infer<typeof createTentSchema>
export type UpdateTentInput = z.infer<typeof updateTentSchema>
export type ListTentsQuery = z.infer<typeof listTentsQuerySchema>
