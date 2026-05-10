/**
 * GrowLab — Dashboard route smoke tests (F1).
 *
 * FIXME(f1): same constraint as `garden.test.ts` — no jsdom/RTL available
 * and adding deps is forbidden by the F1 hard rules. We exercise the
 * pure helpers that own dashboard derivations (`buildBuckets` for the
 * MiniChart placeholder + the shared `derivePlantStats`). Visual smoke
 * coverage of the rendered Dashboard lives in `tests/visual/dashboard.spec.ts`.
 */

import { describe, it, expect } from 'vitest'
import { buildBuckets } from '@/components/dashboard/MiniChart'
import { derivePlantStats } from '@/lib/plantStats'
import type { Plant, GrowthStage } from '@/types/plants'

const NOW = new Date('2026-05-09T12:00:00.000Z')

function makePlant(id: string, stage: GrowthStage, createdDaysAgo: number): Plant {
  const created = new Date(NOW.getTime() - createdDaysAgo * 24 * 60 * 60 * 1000)
  return {
    id,
    userId: 'u1',
    name: `Plant ${id}`,
    strainType: 'indica',
    growthStage: stage,
    stageStartDate: created.toISOString(),
    healthStatus: 'healthy',
    photoUrl: null,
    notes: null,
    createdAt: created.toISOString(),
    updatedAt: created.toISOString(),
  }
}

describe('Dashboard — derived data', () => {
  it('derivePlantStats reflects the active/flowering split shown in the header', () => {
    const plants = [
      makePlant('1', 'seedling', 30),
      makePlant('2', 'flowering', 20),
      makePlant('3', 'flowering', 25),
      makePlant('4', 'completed', 80),
    ]
    const stats = derivePlantStats(plants)
    expect(stats.active).toBe(3)
    expect(stats.flowering).toBe(2)
    expect(stats.total).toBe(4)
  })

  it('buildBuckets returns 5 buckets and is monotonically non-decreasing', () => {
    // Plants created 28, 21, 14, 7, 0 days ago — one alive each week.
    const plants = [
      makePlant('a', 'seedling', 28),
      makePlant('b', 'vegetative', 21),
      makePlant('c', 'vegetative', 14),
      makePlant('d', 'flowering', 7),
      makePlant('e', 'flowering', 0),
    ]
    const buckets = buildBuckets(plants, NOW)
    expect(buckets).toHaveLength(5)
    // Each bucket sums "plants alive at week-end", so as time progresses we
    // accumulate plants — strictly non-decreasing.
    for (let i = 1; i < buckets.length; i++) {
      expect(buckets[i]).toBeGreaterThanOrEqual(buckets[i - 1] ?? 0)
    }
    // Last bucket = current week → all 5 plants alive.
    expect(buckets[4]).toBe(5)
  })

  it('buildBuckets returns zeros for an empty plant list', () => {
    expect(buildBuckets([], NOW)).toEqual([0, 0, 0, 0, 0])
  })
})
