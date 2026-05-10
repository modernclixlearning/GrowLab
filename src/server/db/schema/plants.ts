/**
 * GrowLab Database Schema - Plants Model
 *
 * Core entity representing a cannabis plant from seed to harvest.
 * Includes growth stage tracking, health status, and strain information.
 *
 * F2 extensions (Master Plan §4.2):
 *   - `tentId` FK → tents (set null on delete; nullable).
 *   - `strainTemplateId` FK → strain_templates (set null; nullable).
 *   - `strainName` free-form commercial name when no template applies.
 *   - `stageDurationOverride` jsonb override for default durations.
 *   - `lightSchedule` "18/6" / "12/12" (Expert UI shows pill).
 *   - `heroPhotoUrl` cache of the latest plant_photo for the current stage
 *     (F4 will populate; F2 leaves nullable for forward-compat).
 *   - `weekDeltaCache` numeric cache for list views.
 */

import { pgTable, text, timestamp, numeric, jsonb, index } from 'drizzle-orm/pg-core'
import { nanoid } from 'nanoid'
import { users } from './auth'
import { tents } from './tents'
import { strainTemplates, type StrainStageDurations } from './strain-templates'

/**
 * Growth stage enum values
 * Plants progress through stages sequentially: seedling -> vegetative -> flowering -> harvesting -> drying -> curing -> completed
 */
export const GROWTH_STAGES = ['seedling', 'vegetative', 'flowering', 'harvesting', 'drying', 'curing', 'completed'] as const
export type GrowthStage = typeof GROWTH_STAGES[number]

/**
 * Health status enum values
 * Health status transitions are free (any state can go to any other)
 */
export const HEALTH_STATUSES = ['healthy', 'stressed', 'sick', 'recovering', 'dead'] as const
export type HealthStatus = typeof HEALTH_STATUSES[number]

/**
 * Strain type enum values
 */
export const STRAIN_TYPES = ['indica', 'sativa', 'hybrid', 'auto'] as const
export type StrainType = typeof STRAIN_TYPES[number]

/**
 * Plant entity - Individual cannabis plant record
 */
export const plants = pgTable('plants', {
  /** Unique identifier (nanoid) */
  id: text('id').primaryKey().$defaultFn(() => nanoid()),

  /** Reference to owning user */
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  /** Plant display name (e.g., "OG Kush #1") */
  name: text('name').notNull(),

  /** Strain type: indica, sativa, hybrid, auto */
  strainType: text('strain_type').notNull(),

  /** Current growth stage */
  growthStage: text('growth_stage').notNull().default('seedling'),

  /** Date when current stage started */
  stageStartDate: timestamp('stage_start_date', { withTimezone: true }).notNull().defaultNow(),

  /** Current health status */
  healthStatus: text('health_status').notNull().default('healthy'),

  /** Primary photo URL (optional) */
  photoUrl: text('photo_url'),

  /** Freeform notes about the plant */
  notes: text('notes'),

  /** Tent this plant lives in (optional). */
  tentId: text('tent_id').references(() => tents.id, { onDelete: 'set null' }),

  /** Strain template (optional — falls back to free-form `strainName`). */
  strainTemplateId: text('strain_template_id').references(
    () => strainTemplates.id,
    { onDelete: 'set null' },
  ),

  /** Free-form commercial strain name when no template fits. */
  strainName: text('strain_name'),

  /** Per-plant override of strain template stage durations (days). */
  stageDurationOverride: jsonb(
    'stage_duration_override',
  ).$type<StrainStageDurations>(),

  /** Light schedule (e.g., "18/6", "12/12"). Expert UI exposes a pill. */
  lightSchedule: text('light_schedule'),

  /** Cached URL of latest plant_photo for current stage (F4 fills this). */
  heroPhotoUrl: text('hero_photo_url'),

  /** Cached week delta for list views (optional optimisation). */
  weekDeltaCache: numeric('week_delta_cache', { precision: 6, scale: 2 }),

  /** Record creation timestamp */
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),

  /** Last update timestamp */
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_plants_user_id').on(table.userId),
  index('idx_plants_growth_stage').on(table.growthStage),
])

/** TypeScript types inferred from schema */
export type Plant = typeof plants.$inferSelect
export type NewPlant = typeof plants.$inferInsert
