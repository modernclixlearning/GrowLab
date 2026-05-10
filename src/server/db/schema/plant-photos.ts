/**
 * GrowLab Database Schema — Plant Photos (F4)
 *
 * Records every photo associated with a plant, tracking whether it came
 * from a direct user upload (R2 presigned PUT) or AI generation.
 * One photo per row; heroPhotoUrl on `plants` caches the latest for the
 * current stage to avoid a JOIN on every list query.
 */

import { pgTable, text, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { nanoid } from 'nanoid'
import { plants } from './plants'

export const SOURCE_TYPES = ['upload', 'ai'] as const
export type SourceType = (typeof SOURCE_TYPES)[number]

export const plantPhotos = pgTable(
  'plant_photos',
  {
    id: text('id').primaryKey().$defaultFn(() => nanoid()),

    /** Owning plant — cascade delete so photos are removed with the plant. */
    plantId: text('plant_id')
      .notNull()
      .references(() => plants.id, { onDelete: 'cascade' }),

    /** Growth stage at the time the photo was captured / generated. */
    stage: text('stage').notNull(),

    /** Canonical R2 URL (public CDN path — not the presigned PUT URL). */
    url: text('url').notNull(),

    /** 'upload' = direct R2 upload; 'ai' = AI-generated. */
    sourceType: text('source_type').notNull(),

    /** Prompt text supplied by the user or resolved from a stage preset. */
    aiPrompt: text('ai_prompt'),

    /** AI_PROVIDER env snapshot at generation time (e.g. 'openai'). */
    aiProvider: text('ai_provider'),

    width: integer('width'),
    height: integer('height'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_plant_photos_plant_id_stage').on(table.plantId, table.stage),
  ],
)

export type PlantPhoto = typeof plantPhotos.$inferSelect
export type NewPlantPhoto = typeof plantPhotos.$inferInsert
