/**
 * GrowLab Database Schema - Sensor Devices Model
 *
 * A sensor device represents a cloud-connected sensor (Govee, Inkbird,
 * SwitchBot) or a manual entry point associated with a plant or tent.
 *
 * API keys are stored AES-256-GCM encrypted (see src/server/lib/crypto.ts).
 * The raw key is NEVER exposed via the API (rule RR6).
 *
 * F5 (Master Plan §5 F5).
 */

import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core'
import { nanoid } from 'nanoid'
import { users } from './auth'
import { plants } from './plants'
import { tents } from './tents'

/**
 * Cloud sensor provider enum values.
 * 'manual' = no polling; readings entered by user.
 */
export const SENSOR_PROVIDERS = ['govee', 'inkbird', 'switchbot', 'manual'] as const
export type SensorProvider = typeof SENSOR_PROVIDERS[number]

/**
 * Sensor device entity — one per API credential / physical device.
 */
export const sensorDevices = pgTable(
  'sensor_devices',
  {
    /** Unique identifier (nanoid) */
    id: text('id').primaryKey().$defaultFn(() => nanoid()),

    /** Reference to owning user */
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    /** Cloud provider identifier or 'manual' */
    provider: text('provider').notNull(),

    /**
     * AES-256-GCM encrypted API key.
     * Format: base64(iv):base64(ciphertext):base64(authTag)
     * Null for provider='manual'.
     */
    apiKeyEncrypted: text('api_key_encrypted'),

    /** User-facing label (e.g. "Tent A — Govee") */
    label: text('label').notNull(),

    /** Plant this device tracks (mutually exclusive with targetTentId) */
    targetPlantId: text('target_plant_id').references(() => plants.id, {
      onDelete: 'set null',
    }),

    /** Tent this device tracks (mutually exclusive with targetPlantId) */
    targetTentId: text('target_tent_id').references(() => tents.id, {
      onDelete: 'set null',
    }),

    /** When the device was last successfully polled */
    lastPollAt: timestamp('last_poll_at', { withTimezone: true }),

    /** Last error message (null when healthy) */
    lastError: text('last_error'),

    /** Record creation timestamp */
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('idx_sensor_devices_user_id').on(table.userId)],
)

/** TypeScript types inferred from schema */
export type SensorDevice = typeof sensorDevices.$inferSelect
export type NewSensorDevice = typeof sensorDevices.$inferInsert
