/**
 * GrowLab Plant Stats Derivation (server)
 *
 * Pure helper: given a plant's `growthStage`, `stageStartDate`, and any
 * `stageDurationOverride` / template defaults, returns the current
 * `weekOfStage` and the expected `totalWeeks` for the active stage.
 *
 * Master Plan §F2.12 / §4.2 wording: `weekOfStage = floor((now -
 * stageStartDate) / 7d) + 1`. `totalWeeks = duration_days / 7`,
 * rounded; `null` when no template/override gives a duration.
 */

import type { GrowthStage } from '@/server/db/schema'
import type { StrainStageDurations } from '@/server/db/schema/strain-templates'

export interface PlantStatsInput {
  growthStage: GrowthStage
  stageStartDate: Date | string
  stageDurationOverride?: StrainStageDurations | null
  templateStageDurations?: StrainStageDurations | null
}

export interface DerivedPlantStats {
  /** 1-indexed week of the current stage. Always ≥ 1. */
  weekOfStage: number
  /** Expected total weeks for the current stage; `null` when unknown. */
  totalWeeks: number | null
}

const DAY_MS = 1000 * 60 * 60 * 24

/**
 * Compute weekOfStage + totalWeeks. Pure and deterministic given `now`.
 */
export function derivePlantStats(
  input: PlantStatsInput,
  now: Date = new Date(),
): DerivedPlantStats {
  const start = typeof input.stageStartDate === 'string'
    ? new Date(input.stageStartDate)
    : input.stageStartDate

  const elapsedDays = Math.max(0, (now.getTime() - start.getTime()) / DAY_MS)
  const weekOfStage = Math.floor(elapsedDays / 7) + 1

  // Override wins; otherwise the template; otherwise null.
  const durations =
    input.stageDurationOverride ?? input.templateStageDurations ?? null

  let totalWeeks: number | null = null
  if (durations) {
    const stageKey = input.growthStage as keyof StrainStageDurations
    const days = durations[stageKey]
    if (typeof days === 'number' && days > 0) {
      totalWeeks = Math.max(1, Math.round(days / 7))
    }
  }

  return { weekOfStage, totalWeeks }
}
