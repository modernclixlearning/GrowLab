/**
 * GrowLab — #26 generateImageSchema unit tests
 *
 * Verifies `style` is optional, enum-validated, and strictly orthogonal to
 * the preset XOR prompt exclusivity (REG-4) — it never participates in it.
 */

import { describe, it, expect } from 'vitest'
import { generateImageSchema } from '@/server/api/ai/schemas'

const base = { plantId: 'p1', stage: 'seedling' as const }

describe('generateImageSchema — style field', () => {
  it('accepts omitting style (retro-compat)', () => {
    const r = generateImageSchema.safeParse({ ...base, stagePreset: true })
    expect(r.success).toBe(true)
  })

  it('accepts a valid style with a preset', () => {
    const r = generateImageSchema.safeParse({ ...base, stagePreset: true, style: 'illustration' })
    expect(r.success).toBe(true)
  })

  it('accepts a valid style with a free prompt', () => {
    const r = generateImageSchema.safeParse({ ...base, prompt: 'a bud', style: 'minimal' })
    expect(r.success).toBe(true)
  })

  it('rejects a style outside the enum', () => {
    const r = generateImageSchema.safeParse({ ...base, stagePreset: true, style: 'cyberpunk' })
    expect(r.success).toBe(false)
  })
})

describe('generateImageSchema — preset XOR prompt invariant intact', () => {
  it('rejects when neither preset nor prompt is provided (even with style)', () => {
    const r = generateImageSchema.safeParse({ ...base, style: 'photorealistic' })
    expect(r.success).toBe(false)
  })

  it('rejects when both preset and prompt are provided (even with style)', () => {
    const r = generateImageSchema.safeParse({ ...base, stagePreset: true, prompt: 'x', style: 'minimal' })
    expect(r.success).toBe(false)
  })

  it('enforces the 500-char prompt limit independently of style', () => {
    const r = generateImageSchema.safeParse({ ...base, prompt: 'a'.repeat(501), style: 'minimal' })
    expect(r.success).toBe(false)
  })
})
