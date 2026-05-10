/**
 * GrowLab — server-side derivePlantStats tests (F2)
 *
 * Lives under `tests/lib/` (not `tests/server/`) so the import path
 * resolves through the same `@/server/lib/*` alias the runtime uses.
 */

import { describe, it, expect } from 'vitest'
import { derivePlantStats } from '@/server/lib/derivePlantStats'

const NOW = new Date('2026-05-09T12:00:00.000Z')

describe('server derivePlantStats — weekOfStage', () => {
  it('returns week 1 on the same day as stageStartDate', () => {
    const result = derivePlantStats(
      {
        growthStage: 'vegetative',
        stageStartDate: NOW,
      },
      NOW,
    )
    expect(result.weekOfStage).toBe(1)
  })

  it('returns week 2 after 7 days', () => {
    const start = new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000)
    const result = derivePlantStats(
      { growthStage: 'flowering', stageStartDate: start },
      NOW,
    )
    expect(result.weekOfStage).toBe(2)
  })

  it('clamps to week 1 when stageStartDate is in the future', () => {
    const start = new Date(NOW.getTime() + 5 * 24 * 60 * 60 * 1000)
    const result = derivePlantStats(
      { growthStage: 'seedling', stageStartDate: start },
      NOW,
    )
    expect(result.weekOfStage).toBe(1)
  })
})

describe('server derivePlantStats — totalWeeks', () => {
  it('is null when no override and no template', () => {
    const result = derivePlantStats(
      { growthStage: 'flowering', stageStartDate: NOW },
      NOW,
    )
    expect(result.totalWeeks).toBeNull()
  })

  it('reads from the override when present', () => {
    const result = derivePlantStats(
      {
        growthStage: 'flowering',
        stageStartDate: NOW,
        stageDurationOverride: { flowering: 70 }, // 10 weeks
      },
      NOW,
    )
    expect(result.totalWeeks).toBe(10)
  })

  it('falls back to the template when no override is set', () => {
    const result = derivePlantStats(
      {
        growthStage: 'vegetative',
        stageStartDate: NOW,
        templateStageDurations: { vegetative: 35 }, // 5 weeks
      },
      NOW,
    )
    expect(result.totalWeeks).toBe(5)
  })

  it('override beats template when both are set', () => {
    const result = derivePlantStats(
      {
        growthStage: 'flowering',
        stageStartDate: NOW,
        stageDurationOverride: { flowering: 56 }, // 8 weeks
        templateStageDurations: { flowering: 70 }, // 10 weeks
      },
      NOW,
    )
    expect(result.totalWeeks).toBe(8)
  })

  it('returns null when the active stage has no duration entry', () => {
    const result = derivePlantStats(
      {
        growthStage: 'completed',
        stageStartDate: NOW,
        templateStageDurations: { vegetative: 35 },
      },
      NOW,
    )
    expect(result.totalWeeks).toBeNull()
  })

  it('rounds days to whole weeks', () => {
    // 49 days / 7 = 7 — clean round.
    const clean = derivePlantStats(
      {
        growthStage: 'flowering',
        stageStartDate: NOW,
        templateStageDurations: { flowering: 49 },
      },
      NOW,
    )
    expect(clean.totalWeeks).toBe(7)
    // 50 days → 7.14 → round to 7.
    const rounded = derivePlantStats(
      {
        growthStage: 'flowering',
        stageStartDate: NOW,
        templateStageDurations: { flowering: 50 },
      },
      NOW,
    )
    expect(rounded.totalWeeks).toBe(7)
  })
})
