/**
 * GrowLab — #26 buildPrompt + style templates unit tests (pure, no I/O)
 *
 * Covers REG-1 (default photorealistic), preset+style and free-prompt+style
 * composition, every StyleKey modifier, and the medium-neutrality of the
 * rewritten STAGE_PRESETS (master-plan §2.2).
 */

import { describe, it, expect } from 'vitest'
import {
  buildPrompt,
  STYLE_KEYS,
  STYLE_MODIFIERS,
  STAGE_PRESETS,
  type StyleKey,
} from '@/server/ai/stage-presets'
import { GROWTH_STAGES } from '@/server/db/schema'

describe('STYLE_MODIFIERS', () => {
  it('has a non-empty modifier for every style key', () => {
    for (const key of STYLE_KEYS) {
      expect(STYLE_MODIFIERS[key], `missing modifier for ${key}`).toBeTruthy()
      expect(STYLE_MODIFIERS[key].length).toBeGreaterThan(10)
    }
  })
})

describe('buildPrompt — preset + style', () => {
  it('composes a stage preset with the selected style modifier', () => {
    const out = buildPrompt({ stage: 'seedling', stagePreset: true, style: 'illustration' })
    expect(out).toContain(STAGE_PRESETS.seedling)
    expect(out).toContain(STYLE_MODIFIERS.illustration)
  })

  it('falls back to a generic subject for an unknown stage preset', () => {
    const out = buildPrompt({ stage: 'banana', stagePreset: true, style: 'minimal' })
    expect(out).toContain('Cannabis plant in banana stage')
    expect(out).toContain(STYLE_MODIFIERS.minimal)
  })
})

describe('buildPrompt — free prompt + style', () => {
  it('composes a free-form prompt with the selected style modifier', () => {
    const out = buildPrompt({ prompt: 'a glowing purple bud', style: 'psychedelic' })
    expect(out).toContain('a glowing purple bud')
    expect(out).toContain(STYLE_MODIFIERS.psychedelic)
  })
})

describe('buildPrompt — REG-1 default style', () => {
  it('defaults to photorealistic when style is omitted (preset)', () => {
    const out = buildPrompt({ stage: 'flowering', stagePreset: true })
    expect(out).toContain(STYLE_MODIFIERS.photorealistic)
  })

  it('defaults to photorealistic when style is omitted (free prompt)', () => {
    const out = buildPrompt({ prompt: 'a frosty cola' })
    expect(out).toContain('a frosty cola')
    expect(out).toContain(STYLE_MODIFIERS.photorealistic)
  })
})

describe('buildPrompt — every StyleKey produces its own modifier', () => {
  for (const key of STYLE_KEYS) {
    it(`applies the ${key} modifier`, () => {
      const out = buildPrompt({ prompt: 'subject', style: key as StyleKey })
      expect(out).toContain(STYLE_MODIFIERS[key])
    })
  }
})

describe('STAGE_PRESETS are medium-neutral', () => {
  // The medium must come from STYLE_MODIFIERS, never from the preset itself.
  const MEDIUM_TERMS = /\b(photograph|photo|studio|macro|lighting|lit|illustration|watercolour|psychedelic|minimalist)\b/i

  it('has a preset for every growth stage', () => {
    for (const stage of GROWTH_STAGES) {
      expect(STAGE_PRESETS[stage], `missing preset for ${stage}`).toBeTruthy()
    }
  })

  it('no preset contains medium/photography terms', () => {
    for (const [stage, preset] of Object.entries(STAGE_PRESETS)) {
      expect(MEDIUM_TERMS.test(preset), `preset "${stage}" leaks a medium term: "${preset}"`).toBe(false)
    }
  })
})
