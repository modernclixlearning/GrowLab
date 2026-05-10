/**
 * GrowLab updateMeSchema tests (F2)
 *
 * Validates the PATCH /api/auth/me payload schema. Covers the new
 * stageMode enum, the partial-update semantics, and the JSON shapes
 * for unitsPreference / notificationPrefs.
 */

import { describe, it, expect } from 'vitest'
import { updateMeSchema } from '@/server/api/auth/schemas'

describe('updateMeSchema — stageMode', () => {
  it('accepts "basic"', () => {
    const result = updateMeSchema.safeParse({ stageMode: 'basic' })
    expect(result.success).toBe(true)
  })

  it('accepts "expert"', () => {
    const result = updateMeSchema.safeParse({ stageMode: 'expert' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid stageMode values', () => {
    expect(
      updateMeSchema.safeParse({ stageMode: 'beginner' }).success,
    ).toBe(false)
    expect(updateMeSchema.safeParse({ stageMode: '' }).success).toBe(false)
    expect(updateMeSchema.safeParse({ stageMode: 1 as never }).success).toBe(
      false,
    )
  })
})

describe('updateMeSchema — empty / partial', () => {
  it('accepts an empty object', () => {
    expect(updateMeSchema.safeParse({}).success).toBe(true)
  })

  it('accepts setting hasOnboarded only', () => {
    expect(
      updateMeSchema.safeParse({ hasOnboarded: true }).success,
    ).toBe(true)
  })

  it('accepts clearing the avatar (null)', () => {
    expect(
      updateMeSchema.safeParse({ avatarUrl: null }).success,
    ).toBe(true)
  })
})

describe('updateMeSchema — unitsPreference', () => {
  it('accepts a complete units object', () => {
    expect(
      updateMeSchema.safeParse({
        unitsPreference: { temp: 'C', length: 'cm' },
      }).success,
    ).toBe(true)
  })

  it('rejects an incomplete units object', () => {
    expect(
      updateMeSchema.safeParse({
        unitsPreference: { temp: 'C' } as never,
      }).success,
    ).toBe(false)
  })

  it('rejects an invalid temp unit', () => {
    expect(
      updateMeSchema.safeParse({
        unitsPreference: { temp: 'K', length: 'cm' } as never,
      }).success,
    ).toBe(false)
  })
})

describe('updateMeSchema — notificationPrefs', () => {
  it('accepts the full triple', () => {
    expect(
      updateMeSchema.safeParse({
        notificationPrefs: { push: true, email: false, inApp: true },
      }).success,
    ).toBe(true)
  })

  it('rejects partial notification prefs', () => {
    expect(
      updateMeSchema.safeParse({
        notificationPrefs: { push: true } as never,
      }).success,
    ).toBe(false)
  })
})
