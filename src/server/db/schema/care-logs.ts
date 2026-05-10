/**
 * GrowLab Database Schema - Care Logs Model
 *
 * Records watering, feeding, pruning, and other care activities for plants.
 * Each log entry is tied to a specific plant and timestamped.
 *
 * F3 extensions (Master Plan §3 F3):
 *   - `scheduledAt` — when the task is due (pending queue).
 *   - `completedAt` — when it was marked done. Backfilled from `loggedAt`
 *     for all pre-F3 rows so they appear as historical completions.
 *   - `recurrenceRule` — jsonb blob describing the repeat pattern.
 *   - `parentScheduleId` — self-FK linking recurrence instances to their
 *     root (set null on delete). Uses the thunk pattern to avoid circular
 *     reference (same technique as `users.defaultTentId` in auth.ts).
 */

import { pgTable, text, timestamp, numeric, jsonb, index, type AnyPgColumn } from 'drizzle-orm/pg-core'
import { nanoid } from 'nanoid'
import { plants } from './plants'
import type { RecurrenceRule } from '@/lib/recurrence'

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

  /**
   * When the care event occurred. Preserved from pre-F3 schema; for new
   * scheduled tasks it is set to now() when the task is completed.
   */
  loggedAt: timestamp('logged_at', { withTimezone: true }).notNull().defaultNow(),

  /** F3 — When the task is scheduled (pending queue). Nullable. */
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),

  /** F3 — When the task was marked done. Backfilled = loggedAt for pre-F3 rows. */
  completedAt: timestamp('completed_at', { withTimezone: true }),

  /** F3 — JSONB recurrence rule (frequency, interval, byWeekday?, until?, count?). */
  recurrenceRule: jsonb('recurrence_rule').$type<RecurrenceRule>(),

  /**
   * F3 — Self-FK linking recurrence instances to their root care log.
   * Uses a thunk (): AnyPgColumn to avoid circular reference during TS
   * module resolution (same pattern as users.defaultTentId in auth.ts).
   * ON DELETE SET NULL preserves child rows if the parent is deleted.
   */
  parentScheduleId: text('parent_schedule_id').references(
    (): AnyPgColumn => careLogs.id,
    { onDelete: 'set null' },
  ),
}, (table) => [
  index('idx_care_logs_plant_id_logged_at').on(table.plantId, table.loggedAt),
  index('idx_care_logs_scheduled_at').on(table.scheduledAt),
])

/** TypeScript types inferred from schema */
export type CareLog = typeof careLogs.$inferSelect
export type NewCareLog = typeof careLogs.$inferInsert
