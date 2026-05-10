/**
 * GrowLab Care Logs Tests
 * 
 * Unit tests for care log validation schemas and type constants.
 * F3 adds: recurrenceRuleSchema, createCareLogSchema F3 fields,
 *           listScheduledCareLogsQuerySchema.
 */

import { describe, it, expect } from 'vitest'
import {
  createCareLogSchema,
  listCareLogsQuerySchema,
  listScheduledCareLogsQuerySchema,
} from '@/server/api/care-logs/schemas'
import { CARE_LOG_TYPES } from '@/server/db/schema/care-logs'

describe('Care Log Validation Schemas', () => {
  describe('createCareLogSchema', () => {
    it('should validate a minimal care log (just logType)', () => {
      const input = { logType: 'water' }
      const result = createCareLogSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should validate with all optional fields', () => {
      const input = {
        logType: 'feed',
        amount: 500,
        unit: 'ml',
        notes: 'Added CalMag supplement',
        loggedAt: '2026-02-16T10:00:00.000Z',
      }
      const result = createCareLogSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.logType).toBe('feed')
        expect(result.data.amount).toBe(500)
        expect(result.data.unit).toBe('ml')
        expect(result.data.notes).toBe('Added CalMag supplement')
      }
    })

    it('should reject missing logType', () => {
      const input = { amount: 500 }
      const result = createCareLogSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject invalid logType', () => {
      const input = { logType: 'harvest' }
      const result = createCareLogSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should accept all valid log types', () => {
      for (const logType of CARE_LOG_TYPES) {
        const result = createCareLogSchema.safeParse({ logType })
        expect(result.success).toBe(true)
      }
    })

    it('should reject negative amount', () => {
      const input = { logType: 'water', amount: -100 }
      const result = createCareLogSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject zero amount', () => {
      const input = { logType: 'water', amount: 0 }
      const result = createCareLogSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should accept decimal amounts', () => {
      const input = { logType: 'feed', amount: 2.5 }
      const result = createCareLogSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.amount).toBe(2.5)
      }
    })

    it('should reject amount that is too large', () => {
      const input = { logType: 'water', amount: 100000000 }
      const result = createCareLogSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject unit over 20 characters', () => {
      const input = { logType: 'water', unit: 'a'.repeat(21) }
      const result = createCareLogSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject notes over 1000 characters', () => {
      const input = { logType: 'water', notes: 'x'.repeat(1001) }
      const result = createCareLogSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject invalid loggedAt format', () => {
      const input = { logType: 'water', loggedAt: 'not-a-date' }
      const result = createCareLogSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should accept valid ISO date for loggedAt', () => {
      const input = { logType: 'water', loggedAt: '2026-02-16T12:00:00.000Z' }
      const result = createCareLogSchema.safeParse(input)
      expect(result.success).toBe(true)
    })
  })

  describe('listCareLogsQuerySchema', () => {
    it('should validate with no params (defaults)', () => {
      const result = listCareLogsQuerySchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sortOrder).toBe('desc')
        expect(result.data.limit).toBe(50)
        expect(result.data.offset).toBe(0)
      }
    })

    it('should validate with logType filter', () => {
      const result = listCareLogsQuerySchema.safeParse({ logType: 'water' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.logType).toBe('water')
      }
    })

    it('should reject invalid logType filter', () => {
      const result = listCareLogsQuerySchema.safeParse({ logType: 'invalid' })
      expect(result.success).toBe(false)
    })

    it('should validate with sort order', () => {
      const result = listCareLogsQuerySchema.safeParse({ sortOrder: 'asc' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sortOrder).toBe('asc')
      }
    })

    it('should coerce string limit to number', () => {
      const result = listCareLogsQuerySchema.safeParse({ limit: '25' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(25)
      }
    })

    it('should reject limit over 100', () => {
      const result = listCareLogsQuerySchema.safeParse({ limit: 101 })
      expect(result.success).toBe(false)
    })

    it('should reject negative offset', () => {
      const result = listCareLogsQuerySchema.safeParse({ offset: -1 })
      expect(result.success).toBe(false)
    })
  })
})

describe('Care Log Type Constants', () => {
  it('should define all expected care log types', () => {
    expect(CARE_LOG_TYPES).toContain('water')
    expect(CARE_LOG_TYPES).toContain('feed')
    expect(CARE_LOG_TYPES).toContain('prune')
    expect(CARE_LOG_TYPES).toContain('transplant')
    expect(CARE_LOG_TYPES).toContain('train')
    expect(CARE_LOG_TYPES).toContain('other')
    expect(CARE_LOG_TYPES.length).toBe(6)
  })
})

// ──────────────────────────────────────────────────────────────────────
// F3 — createCareLogSchema with scheduling fields
// ──────────────────────────────────────────────────────────────────────

describe('F3 — createCareLogSchema scheduling fields', () => {
  it('accepts scheduledAt as ISO datetime', () => {
    const result = createCareLogSchema.safeParse({
      logType: 'water',
      scheduledAt: '2026-05-10T08:00:00.000Z',
    })
    expect(result.success).toBe(true)
  })

  it('rejects scheduledAt as plain date string', () => {
    const result = createCareLogSchema.safeParse({
      logType: 'water',
      scheduledAt: '2026-05-10',
    })
    expect(result.success).toBe(false)
  })

  it('accepts daily recurrenceRule', () => {
    const result = createCareLogSchema.safeParse({
      logType: 'feed',
      recurrenceRule: { frequency: 'daily', interval: 1 },
    })
    expect(result.success).toBe(true)
  })

  it('accepts weekly recurrenceRule with byWeekday', () => {
    const result = createCareLogSchema.safeParse({
      logType: 'feed',
      recurrenceRule: { frequency: 'weekly', interval: 2, byWeekday: [1, 3, 5] },
    })
    expect(result.success).toBe(true)
  })

  it('rejects recurrenceRule with interval 0', () => {
    const result = createCareLogSchema.safeParse({
      logType: 'water',
      recurrenceRule: { frequency: 'daily', interval: 0 },
    })
    expect(result.success).toBe(false)
  })

  it('rejects recurrenceRule with unknown key (strict)', () => {
    const result = createCareLogSchema.safeParse({
      logType: 'water',
      recurrenceRule: { frequency: 'daily', interval: 1, badKey: true },
    })
    expect(result.success).toBe(false)
  })

  it('rejects byWeekday value > 6', () => {
    const result = createCareLogSchema.safeParse({
      logType: 'water',
      recurrenceRule: { frequency: 'weekly', interval: 1, byWeekday: [7] },
    })
    expect(result.success).toBe(false)
  })

  it('rejects byWeekday value < 0', () => {
    const result = createCareLogSchema.safeParse({
      logType: 'water',
      recurrenceRule: { frequency: 'weekly', interval: 1, byWeekday: [-1] },
    })
    expect(result.success).toBe(false)
  })

  it('accepts count = 0 (exhausted marker)', () => {
    const result = createCareLogSchema.safeParse({
      logType: 'feed',
      recurrenceRule: { frequency: 'daily', interval: 1, count: 0 },
    })
    expect(result.success).toBe(true)
  })

  it('rejects count < 0', () => {
    const result = createCareLogSchema.safeParse({
      logType: 'feed',
      recurrenceRule: { frequency: 'daily', interval: 1, count: -1 },
    })
    expect(result.success).toBe(false)
  })
})

// ──────────────────────────────────────────────────────────────────────
// F3 — listScheduledCareLogsQuerySchema
// ──────────────────────────────────────────────────────────────────────

describe('F3 — listScheduledCareLogsQuerySchema', () => {
  it('accepts empty params (all optional)', () => {
    const result = listScheduledCareLogsQuerySchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts valid scheduledFrom and scheduledTo ISO datetimes', () => {
    const result = listScheduledCareLogsQuerySchema.safeParse({
      scheduledFrom: '2026-05-01T00:00:00.000Z',
      scheduledTo: '2026-05-07T23:59:59.999Z',
    })
    expect(result.success).toBe(true)
  })

  it('rejects scheduledFrom as plain date string', () => {
    const result = listScheduledCareLogsQuerySchema.safeParse({
      scheduledFrom: '2026-05-01',
    })
    expect(result.success).toBe(false)
  })

  it('accepts optional plantId', () => {
    const result = listScheduledCareLogsQuerySchema.safeParse({
      plantId: 'plant-abc',
    })
    expect(result.success).toBe(true)
  })
})
