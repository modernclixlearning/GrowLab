/**
 * GrowLab Database Schema - Tents Model
 *
 * A "tent" is a grow space (or any physical environment) where plants live.
 * Holds environmental targets the user wants to maintain (light, humidity,
 * temperature) and lets multiple plants share a single configuration.
 *
 * Master Plan §4.1 (F2). Used by:
 *   - `users.defaultTentId` (set null on delete)
 *   - `plants.tentId` (set null on delete)
 *   - `sensor_devices.targetTentId` (F5; set null on delete)
 */

import { pgTable, text, timestamp, numeric, index } from 'drizzle-orm/pg-core'
import { nanoid } from 'nanoid'
import { users } from './auth'

/**
 * Tent entity — environmental profile shared by zero or more plants.
 */
export const tents = pgTable(
  'tents',
  {
    /** Unique identifier (nanoid) */
    id: text('id').primaryKey().$defaultFn(() => nanoid()),

    /** Reference to owning user */
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    /** Display name (e.g., "Tent A", "Veg room") */
    name: text('name').notNull(),

    /** Light schedule target (e.g., "18/6", "12/12"). Free-form text. */
    lightTarget: text('light_target'),

    /** Target humidity in percent (0–100). */
    humidityTargetPct: numeric('humidity_target_pct', { precision: 5, scale: 2 }),

    /**
     * Target temperature in Celsius. UI converts to user preference.
     * Storage unit is fixed C to avoid drift; conversion is presentational.
     */
    tempTargetC: numeric('temp_target_c', { precision: 5, scale: 2 }),

    /** Free-form notes about the tent. */
    notes: text('notes'),

    /** Record creation timestamp */
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    /** Last update timestamp */
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('idx_tents_user_id').on(table.userId)],
)

/** TypeScript types inferred from schema */
export type Tent = typeof tents.$inferSelect
export type NewTent = typeof tents.$inferInsert
