/**
 * GrowLab Database Schema - Strain Templates Model
 *
 * Curated catalogue of cannabis strains with default growth-stage durations
 * and light schedules. Plants reference a template to inherit defaults; users
 * may still override per-plant via `plants.stageDurationOverride`.
 *
 * Master Plan §4.1 (F2). Seed lives in `src/server/db/seed/strain-templates.ts`.
 */

import { pgTable, text, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { nanoid } from 'nanoid'

/**
 * Stage durations expressed in DAYS, keyed by `growthStage`.
 * Only the active stages get default values; `completed` is terminal.
 */
export interface StrainStageDurations {
  seedling?: number
  vegetative?: number
  flowering?: number
  harvesting?: number
  drying?: number
  curing?: number
}

/**
 * Default light schedule keyed by phase (veg vs flower).
 * Values are free-form (e.g. "18/6", "12/12").
 */
export interface StrainLightSchedule {
  veg?: string
  flower?: string
}

/**
 * Strain template entity.
 */
export const strainTemplates = pgTable('strain_templates', {
  /** Unique identifier (nanoid) */
  id: text('id').primaryKey().$defaultFn(() => nanoid()),

  /** Display name (unique). e.g., "Northern Lights", "OG Kush" */
  name: text('name').notNull().unique(),

  /** Strain type — same enum as `plants.strainType`. */
  strainType: text('strain_type').notNull(),

  /** Default per-stage durations in days. */
  stageDurations: jsonb('stage_durations').$type<StrainStageDurations>(),

  /** Default light schedule by phase. */
  defaultLightSchedule: jsonb('default_light_schedule').$type<StrainLightSchedule>(),

  /** Free-form description shown in pickers. */
  description: text('description'),

  /** Record creation timestamp */
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

/** TypeScript types inferred from schema */
export type StrainTemplate = typeof strainTemplates.$inferSelect
export type NewStrainTemplate = typeof strainTemplates.$inferInsert
