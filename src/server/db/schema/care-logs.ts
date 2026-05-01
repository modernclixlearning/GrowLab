/**
 * GrowLab Database Schema - Care Logs Model
 * 
 * Records watering, feeding, pruning, and other care activities for plants.
 * Each log entry is tied to a specific plant and timestamped.
 */

import { pgTable, text, timestamp, numeric, index } from 'drizzle-orm/pg-core'
import { nanoid } from 'nanoid'
import { plants } from './plants'

/**
 * Care log type enum values
 * Represents the different types of care activities that can be logged.
 */
export const CARE_LOG_TYPES = ['water', 'feed', 'prune', 'transplant', 'train', 'other'] as const
export type CareLogType = typeof CARE_LOG_TYPES[number]

/**
 * Care log entity - Individual care event record
 */
export const careLogs = pgTable('care_logs', {
  /** Unique identifier (nanoid) */
  id: text('id').primaryKey().$defaultFn(() => nanoid()),

  /** Reference to the plant this care event belongs to */
  plantId: text('plant_id').notNull().references(() => plants.id, { onDelete: 'cascade' }),

  /** Type of care activity performed */
  logType: text('log_type').notNull(),

  /** Quantity amount (e.g., 500 ml of water, 2 tsp nutrients) */
  amount: numeric('amount', { precision: 10, scale: 2 }),

  /** Unit of measurement (e.g., ml, L, tsp, tbsp, g) */
  unit: text('unit'),

  /** Optional notes about the care event */
  notes: text('notes'),

  /** When the care event occurred */
  loggedAt: timestamp('logged_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_care_logs_plant_id_logged_at').on(table.plantId, table.loggedAt),
])

/** TypeScript types inferred from schema */
export type CareLog = typeof careLogs.$inferSelect
export type NewCareLog = typeof careLogs.$inferInsert
