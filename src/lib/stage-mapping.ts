/**
 * GrowLab Stage Mapping (F2 / issue 003)
 *
 * Pure helpers translating between the canonical 7-stage Expert
 * `growthStage` model and the simplified 4-bucket Basic presentation.
 *
 * Storage is ALWAYS the 7-stage model (issue 003 / N11). Basic mode is
 * purely presentational and reversible without data loss.
 *
 * Mapping (issue 003):
 *   seedling   → seedling
 *   vegetative → veg
 *   flowering  → flower
 *   harvesting → harvest
 *   drying     → harvest
 *   curing     → harvest
 *   completed  → harvest
 */

import type { GrowthStage } from '@/types/plants'

/** The 4 Basic-mode buckets, in display order. */
export const BASIC_STAGE_BUCKETS = [
  'seedling',
  'veg',
  'flower',
  'harvest',
] as const
export type BasicStage = (typeof BASIC_STAGE_BUCKETS)[number]

/**
 * Map a 7-stage Expert `growthStage` to its 4-bucket Basic equivalent.
 * The 4 terminal stages (harvesting, drying, curing, completed) collapse
 * into a single "harvest" bucket.
 */
export function expertToBasic(stage: GrowthStage): BasicStage {
  switch (stage) {
    case 'seedling':
      return 'seedling'
    case 'vegetative':
      return 'veg'
    case 'flowering':
      return 'flower'
    case 'harvesting':
    case 'drying':
    case 'curing':
    case 'completed':
      return 'harvest'
  }
}

/**
 * Display labels per Basic bucket. Mirrors `GROWTH_STAGE_CONFIG` in
 * `types/plants.ts` but kept here so consumers don't have to import the
 * full Expert config when in Basic mode.
 */
export const BASIC_STAGE_LABEL: Record<BasicStage, string> = {
  seedling: 'Seedling',
  veg: 'Veg',
  flower: 'Flower',
  harvest: 'Harvest',
}

/**
 * Tailwind text/bg classes per Basic bucket. Reuses the existing
 * `stage-*` and `status-*` color tokens from `tailwind.config.ts`. The
 * `harvest` bucket borrows the alert tone since it spans multiple
 * end-of-cycle stages — same convention as Expert mode.
 */
export const BASIC_STAGE_TINT: Record<
  BasicStage,
  { text: string; bg: string }
> = {
  seedling: { text: 'text-stage-seedling', bg: 'bg-stage-seedling/15' },
  veg: { text: 'text-stage-veg', bg: 'bg-stage-veg/15' },
  flower: { text: 'text-stage-flower', bg: 'bg-stage-flower/15' },
  harvest: { text: 'text-status-alert', bg: 'bg-status-alert/15' },
}
