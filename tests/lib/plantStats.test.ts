/**
 * GrowLab — derivePlantStats tests
 */

import { describe, it, expect } from 'vitest'
import { derivePlantStats } from '@/lib/plantStats'
import type { Plant, GrowthStage } from '@/types/plants'

function makePlant(id: string, growthStage: GrowthStage): Plant {
  return {
    id,
    userId: 'user-1',
    name: `Plant ${id}`,
    strainType: 'indica',
    growthStage,
    stageStartDate: '2026-01-01T00:00:00.000Z',
    healthStatus: 'healthy',
    photoUrl: null,
    notes: null,
    // F2 nullable defaults
    tentId: null,
    strainTemplateId: null,
    strainName: null,
    stageDurationOverride: null,
    lightSchedule: null,
    heroPhotoUrl: null,
    weekDeltaCache: null,
    weekOfStage: 1,
    totalWeeks: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('derivePlantStats', () => {
  it('returns zero counts for an empty list', () => {
    const stats = derivePlantStats([])
    expect(stats).toEqual({ active: 0, flowering: 0, total: 0 })
  })

  it('counts active (non-completed) plants and flowering bucket', () => {
    const plants = [
      makePlant('1', 'seedling'),
      makePlant('2', 'vegetative'),
      makePlant('3', 'flowering'),
      makePlant('4', 'harvesting'),
      makePlant('5', 'completed'),
    ]
    const stats = derivePlantStats(plants)
    expect(stats.total).toBe(5)
    expect(stats.active).toBe(4) // all except completed
    expect(stats.flowering).toBe(2) // flowering + harvesting
  })

  it('treats drying and curing as part of the flowering bucket', () => {
    const plants = [
      makePlant('1', 'flowering'),
      makePlant('2', 'drying'),
      makePlant('3', 'curing'),
      makePlant('4', 'completed'),
    ]
    const stats = derivePlantStats(plants)
    expect(stats.flowering).toBe(3) // flowering, drying, curing — not completed
    expect(stats.active).toBe(3) // 4 minus completed
    expect(stats.total).toBe(4)
  })
})
