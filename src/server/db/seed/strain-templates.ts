/**
 * GrowLab Seed - Strain Templates
 *
 * Seeds the `strain_templates` table with a curated catalogue of 6 popular
 * cannabis strains so the Add Plant flow has meaningful defaults from day
 * one (Master Plan §4.1, §1.2 N26).
 *
 * Idempotent: uses `ON CONFLICT (name) DO NOTHING` so repeat runs (or
 * concurrent runs in CI) leave the existing rows untouched.
 *
 * Run via `npm run db:seed`.
 */

import { sql } from 'drizzle-orm'
import { db } from '../index'
import {
  strainTemplates,
  type NewStrainTemplate,
} from '../schema/strain-templates'

/**
 * Default light schedule shared by photoperiod strains. Auto-flowering
 * strains keep "18/6" through the entire grow but the F2 UI doesn't yet
 * surface that distinction — defaults are good enough.
 */
const PHOTOPERIOD: NewStrainTemplate['defaultLightSchedule'] = {
  veg: '18/6',
  flower: '12/12',
}

/**
 * Stage durations (days) — tuned to widely-cited grow guides. Adjust over
 * time once telemetry from real users contradicts the defaults.
 */
const SEED_TEMPLATES: NewStrainTemplate[] = [
  {
    name: 'Northern Lights',
    strainType: 'indica',
    stageDurations: { seedling: 14, vegetative: 35, flowering: 49, harvesting: 7, drying: 10, curing: 30 },
    defaultLightSchedule: PHOTOPERIOD,
    description:
      'Classic indica. Compact, resinous, forgiving — well suited to first-time indoor grows.',
  },
  {
    name: 'OG Kush',
    strainType: 'hybrid',
    stageDurations: { seedling: 14, vegetative: 42, flowering: 63, harvesting: 7, drying: 10, curing: 30 },
    defaultLightSchedule: PHOTOPERIOD,
    description:
      'West-coast staple. Indica-leaning hybrid with earthy/piney aroma and dense buds.',
  },
  {
    name: 'Blue Dream',
    strainType: 'hybrid',
    stageDurations: { seedling: 14, vegetative: 42, flowering: 63, harvesting: 7, drying: 10, curing: 30 },
    defaultLightSchedule: PHOTOPERIOD,
    description:
      'Sativa-leaning hybrid. Vigorous vegetative growth, sweet berry profile.',
  },
  {
    name: 'GG #4',
    strainType: 'hybrid',
    stageDurations: { seedling: 14, vegetative: 42, flowering: 56, harvesting: 7, drying: 10, curing: 30 },
    defaultLightSchedule: PHOTOPERIOD,
    description:
      'Heavy resin producer (a.k.a. Gorilla Glue). Balanced hybrid, high yields.',
  },
  {
    name: 'Sour Diesel',
    strainType: 'sativa',
    stageDurations: { seedling: 14, vegetative: 42, flowering: 70, harvesting: 7, drying: 10, curing: 30 },
    defaultLightSchedule: PHOTOPERIOD,
    description:
      'Fast-growing sativa with diesel/citrus aroma. Stretches in flower — train accordingly.',
  },
  {
    name: 'White Widow',
    strainType: 'hybrid',
    stageDurations: { seedling: 14, vegetative: 35, flowering: 56, harvesting: 7, drying: 10, curing: 30 },
    defaultLightSchedule: PHOTOPERIOD,
    description:
      'Coffeeshop classic. Balanced hybrid, frosty trichome coverage, easy mid-difficulty grow.',
  },
]

/**
 * Insert strain templates idempotently.
 * Returns the number of rows inserted (0 means everything was already in place).
 */
export async function seedStrainTemplates(): Promise<{ inserted: number }> {
  const result = await db
    .insert(strainTemplates)
    .values(SEED_TEMPLATES)
    .onConflictDoNothing({ target: strainTemplates.name })
    .returning({ id: strainTemplates.id })

  return { inserted: result.length }
}

/**
 * Standalone runner — invoked by `npm run db:seed`.
 * Closes the postgres connection on completion so the script exits cleanly.
 */
export async function runSeed(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('[seed] strain_templates: starting...')
  const { inserted } = await seedStrainTemplates()
  // eslint-disable-next-line no-console
  console.log(`[seed] strain_templates: inserted ${inserted} new rows`)
  // Force the postgres pool to close so the process exits.
  await db.$client.end({ timeout: 5 })
  // Sanity ping to keep TS happy when sql is unused above.
  void sql`SELECT 1`
}

// When invoked directly: `tsx src/server/db/seed/strain-templates.ts`
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeed().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[seed] strain_templates: failed', err)
    process.exit(1)
  })
}
