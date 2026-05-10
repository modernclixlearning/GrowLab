/**
 * GrowLab — stage-mapping helper tests (F2 / issue 003)
 */

import { describe, it, expect } from 'vitest'
import {
  expertToBasic,
  BASIC_STAGE_BUCKETS,
  BASIC_STAGE_LABEL,
  BASIC_STAGE_TINT,
} from '@/lib/stage-mapping'
import type { GrowthStage } from '@/types/plants'

// Mirror of the schema enum — kept inline so this test does not pull
// in `@/server/db/schema` (which evaluates `process.env.DATABASE_URL`).
const ALL_EXPERT_STAGES: GrowthStage[] = [
  'seedling',
  'vegetative',
  'flowering',
  'harvesting',
  'drying',
  'curing',
  'completed',
]

describe('expertToBasic', () => {
  it('maps the 7 Expert stages to the 4 Basic buckets per issue 003', () => {
    expect(expertToBasic('seedling')).toBe('seedling')
    expect(expertToBasic('vegetative')).toBe('veg')
    expect(expertToBasic('flowering')).toBe('flower')
    expect(expertToBasic('harvesting')).toBe('harvest')
    expect(expertToBasic('drying')).toBe('harvest')
    expect(expertToBasic('curing')).toBe('harvest')
    expect(expertToBasic('completed')).toBe('harvest')
  })

  it('returns a value from BASIC_STAGE_BUCKETS for every Expert stage', () => {
    for (const stage of ALL_EXPERT_STAGES) {
      const bucket = expertToBasic(stage)
      expect(BASIC_STAGE_BUCKETS).toContain(bucket)
    }
  })
})

describe('BASIC_STAGE_BUCKETS / labels', () => {
  it('has 4 buckets in display order', () => {
    expect([...BASIC_STAGE_BUCKETS]).toEqual([
      'seedling',
      'veg',
      'flower',
      'harvest',
    ])
  })

  it('exposes a non-empty label for every bucket', () => {
    for (const bucket of BASIC_STAGE_BUCKETS) {
      expect(BASIC_STAGE_LABEL[bucket]).toBeTruthy()
    }
  })

  it('exposes tint classes for every bucket', () => {
    for (const bucket of BASIC_STAGE_BUCKETS) {
      expect(BASIC_STAGE_TINT[bucket].text).toMatch(/^text-/)
      expect(BASIC_STAGE_TINT[bucket].bg).toMatch(/^bg-/)
    }
  })
})
