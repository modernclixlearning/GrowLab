/**
 * GrowLab Database Schema - Sensor Readings Model
 *
 * Timeseries data captured from sensor devices (via polling or manual input).
 * Linked to a sensor device and optionally to a plant or tent.
 *
 * Retention policy: readings older than 90 days are purged nightly
 * (see src/server/jobs/sensor-poll.ts cleanupOldReadings).
 *
 * F5 (Master Plan §5 F5).
 */

import { pgTable, text, timestamp, numeric, index } from 'drizzle-orm/pg-core'
import { nanoid } from 'nanoid'
import { sensorDevices } from './sensor-devices'
import { plants } from './plants'
import { tents } from './tents'

/**
 * Measurement metric enum values.
 */
export const METRICS = ['humidity', 'temperature', 'light'] as const
export type Metric = typeof METRICS[number]

/**
 * Sensor reading entity — one row per measurement point.
 */
export const sensorReadings = pgTable(
  'sensor_readings',
  {
    /** Unique identifier (nanoid) */
    id: text('id').primaryKey().$defaultFn(() => nanoid()),

    /** Reference to the device that produced this reading */
    sensorDeviceId: text('sensor_device_id')
      .notNull()
      .references(() => sensorDevices.id, { onDelete: 'cascade' }),

    /** Optional plant this reading is associated with */
    plantId: text('plant_id').references(() => plants.id, {
      onDelete: 'set null',
    }),

    /** Optional tent this reading is associated with */
    tentId: text('tent_id').references(() => tents.id, {
      onDelete: 'set null',
    }),

    /** Measurement type */
    metric: text('metric').notNull(),

    /** Numeric value (e.g. 65.50 for humidity, 24.30 for temperature) */
    value: numeric('value', { precision: 10, scale: 4 }).notNull(),

    /** Unit string (e.g. '%', 'C', 'F', 'lux') */
    unit: text('unit').notNull(),

    /** When this reading was recorded */
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('idx_sensor_readings_metric_recorded_at').on(
      table.metric,
      table.recordedAt,
    ),
    index('idx_sensor_readings_plant_metric_recorded').on(
      table.plantId,
      table.metric,
      table.recordedAt,
    ),
  ],
)

/** TypeScript types inferred from schema */
export type SensorReading = typeof sensorReadings.$inferSelect
export type NewSensorReading = typeof sensorReadings.$inferInsert
