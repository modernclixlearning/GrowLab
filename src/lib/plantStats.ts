/**
 * GrowLab — plant stats derivation helper
 *
 * Aggregates plant-level counters used by the Garden header
 * `<SystemPulse>` ("N ACTIVE PLANTS · M FLOWERING") and the Dashboard
 * `<StatCard>` row.
 */

import type { Plant, GrowthStage } from '@/types/plants'

export interface PlantStats {
  /** Plants whose stage is NOT `completed`. */
  active: number
  /** Plants in any of the late-cycle stages (flowering through curing). */
  flowering: number
  /** Total plants across all stages. */
  total: number
}

const FLOWERING_STAGES: ReadonlySet<GrowthStage> = new Set<GrowthStage>([
  'flowering',
  'harvesting',
  'drying',
  'curing',
])

/**
 * Compute aggregate plant counters in one pass.
 */
export function derivePlantStats(plants: Plant[]): PlantStats {
  let active = 0
  let flowering = 0

  for (const plant of plants) {
    if (plant.growthStage !== 'completed') {
      active += 1
    }
    if (FLOWERING_STAGES.has(plant.growthStage)) {
      flowering += 1
    }
  }

  return {
    active,
    flowering,
    total: plants.length,
  }
}
