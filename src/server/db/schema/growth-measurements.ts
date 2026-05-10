/**
 * GrowLab Database Schema - Growth Measurements Model
 *
 * Discrete growth snapshots (height, leaf count) logged by the user.
 * Used to derive weekly growthBars in the Plant Detail Expert view.
 *
 * F5 (Master Plan §5 F5).
 */

import { pgTable, text, timestamp, numeric, index } from 'drizzle-orm/pg-core'
import { nanoid } from 'nanoid'
import { plants } from './plants'

/**
 * Growth metric enum values.
 */
export const GROWTH_METRICS = ['height_cm', 'leaf_count'] as const
export type GrowthMetric = typeof GROWTH_METRICS[number]

/**
 * Growth measurement entity — one row per recorded measurement.
 */
export const growthMeasurements = pgTable(
  'growth_measurements',
  {
    /** Unique identifier (nanoid) */
    id: text('id').primaryKey().$defaultFn(() => nanoid()),

    /** Reference to the plant being measured */
    plantId: text('plant_id')
      .notNull()
      .references(() => plants.id, { onDelete: 'cascade' }),

    /** What was measured (height_cm or leaf_count) */
    metric: text('metric').notNull(),

    /** Measured value */
    value: numeric('value', { precision: 10, scale: 2 }).notNull(),

    /** When the measurement was recorded */
    recordedAt: timestamp('recorded_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_growth_measurements_plant_id').on(
      table.plantId,
      table.recordedAt,
    ),
  ],
)

/** TypeScript types inferred from schema */
export type GrowthMeasurement = typeof growthMeasurements.$inferSelect
export type NewGrowthMeasurement = typeof growthMeasurements.$inferInsert
