/**
 * GrowLab Database Schema - Plants Model
 * 
 * Core entity representing a cannabis plant from seed to harvest.
 * Includes growth stage tracking, health status, and strain information.
 */

import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core'
import { nanoid } from 'nanoid'
import { users } from './auth'

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
