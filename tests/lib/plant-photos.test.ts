/**
 * GrowLab — F4 Plant Photos quota unit tests
 *
 * Validates quota helpers (uploadQuota, aiQuota) and the STAGE_PRESETS map
 * without touching the database or R2.
 */

import { describe, it, expect, vi } from 'vitest'

// Mock the db module before any service import so the eager DATABASE_URL
// check at module init-time does not throw in the test environment.
vi.mock('@/server/db', () => ({ db: {} }))

import { uploadQuota, aiQuota } from '@/server/api/uploads/service'
import { STAGE_PRESETS } from '@/server/ai/stage-presets'
import { GROWTH_STAGES } from '@/server/db/schema'

// ── Quota helpers ─────────────────────────────────────────────────────────────

describe('uploadQuota', () => {
  it('returns 2 for basic tier', () => {
    expect(uploadQuota('basic')).toBe(2)
  })

  it('returns 5 for expert tier', () => {
    expect(uploadQuota('expert')).toBe(5)
  })

  it('falls back to basic quota for unknown tier', () => {
    expect(uploadQuota('enterprise')).toBe(2)
  })
})

describe('aiQuota', () => {
  it('returns 1 for basic tier', () => {
    expect(aiQuota('basic')).toBe(1)
  })

  it('returns 5 for expert tier', () => {
    expect(aiQuota('expert')).toBe(5)
  })

  it('falls back to basic quota for unknown tier', () => {
    expect(aiQuota('free')).toBe(1)
  })
})

// ── Stage presets coverage ────────────────────────────────────────────────────

describe('STAGE_PRESETS', () => {
  it('has a non-empty preset for every growth stage', () => {
    for (const stage of GROWTH_STAGES) {
      const preset = STAGE_PRESETS[stage]
      expect(preset, `Missing preset for stage: ${stage}`).toBeTruthy()
      expect(typeof preset).toBe('string')
      expect(preset.length).toBeGreaterThan(10)
    }
  })

  it('each preset string mentions cannabis or a stage-relevant keyword', () => {
    for (const [stage, preset] of Object.entries(STAGE_PRESETS)) {
      const lower = preset.toLowerCase()
      const hasCannabis = lower.includes('cannabis')
      const hasStage    = lower.includes(stage)
      expect(
        hasCannabis || hasStage,
        `Preset for "${stage}" lacks domain keywords: "${preset}"`,
      ).toBe(true)
    }
  })
})

// ── GROWTH_STAGES sanity ──────────────────────────────────────────────────────

describe('GROWTH_STAGES enum', () => {
  it('contains all 7 expected stages in order', () => {
    expect(GROWTH_STAGES).toEqual([
      'seedling',
      'vegetative',
      'flowering',
      'harvesting',
      'drying',
      'curing',
      'completed',
    ])
  })
})
