/**
 * GrowLab Tent Validation Schemas tests (F2)
 *
 * Mirrors the structure of `tests/plants.test.ts` — covers the zod
 * surface, not the DB-backed service (no jsdom/RTL/PG infra).
 */

import { describe, it, expect } from 'vitest'
import {
  createTentSchema,
  updateTentSchema,
  listTentsQuerySchema,
} from '@/server/api/tents/schemas'

describe('createTentSchema', () => {
  it('validates the minimum payload', () => {
    const result = createTentSchema.safeParse({ name: 'Tent A' })
    expect(result.success).toBe(true)
  })

  it('accepts a full payload', () => {
    const result = createTentSchema.safeParse({
      name: 'Veg room',
      lightTarget: '18/6',
      humidityTargetPct: 55.5,
      tempTargetC: 24,
      notes: 'Front room, T5 lights.',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an empty name', () => {
    expect(createTentSchema.safeParse({ name: '' }).success).toBe(false)
  })

  it('rejects a name over 100 chars', () => {
    expect(
      createTentSchema.safeParse({ name: 'A'.repeat(101) }).success,
    ).toBe(false)
  })

  it('rejects humidity out of [0,100]', () => {
    expect(
      createTentSchema.safeParse({ name: 'X', humidityTargetPct: -1 }).success,
    ).toBe(false)
    expect(
      createTentSchema.safeParse({ name: 'X', humidityTargetPct: 101 }).success,
    ).toBe(false)
  })

  it('rejects extreme temperatures', () => {
    expect(
      createTentSchema.safeParse({ name: 'X', tempTargetC: -100 }).success,
    ).toBe(false)
    expect(
      createTentSchema.safeParse({ name: 'X', tempTargetC: 100 }).success,
    ).toBe(false)
  })

  it('rejects a light target longer than 20 chars', () => {
    expect(
      createTentSchema.safeParse({ name: 'X', lightTarget: 'A'.repeat(21) })
        .success,
    ).toBe(false)
  })
})

describe('updateTentSchema', () => {
  it('accepts an empty object (no changes)', () => {
    expect(updateTentSchema.safeParse({}).success).toBe(true)
  })

  it('accepts nullable values to clear fields', () => {
    expect(
      updateTentSchema.safeParse({
        lightTarget: null,
        humidityTargetPct: null,
        tempTargetC: null,
        notes: null,
      }).success,
    ).toBe(true)
  })

  it('rejects an empty name when provided', () => {
    expect(updateTentSchema.safeParse({ name: '' }).success).toBe(false)
  })
})

describe('listTentsQuerySchema', () => {
  it('defaults to limit=50 / offset=0', () => {
    const result = listTentsQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(50)
      expect(result.data.offset).toBe(0)
    }
  })

  it('coerces string limit', () => {
    const result = listTentsQuerySchema.safeParse({ limit: '25' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.limit).toBe(25)
  })

  it('rejects limit > 100', () => {
    expect(listTentsQuerySchema.safeParse({ limit: 101 }).success).toBe(false)
  })
})
