/**
 * GrowLab — recurrence.ts unit tests
 *
 * Tests for `nextOccurrence` covering all branches of the algorithm.
 */

import { describe, it, expect } from 'vitest'
import { nextOccurrence } from '@/lib/recurrence'
import type { RecurrenceRule } from '@/lib/recurrence'

/** Parse an ISO string into a Date safely. */
const d = (iso: string) => new Date(iso)

describe('nextOccurrence', () => {
  // ──────────────────────────────────────────────
  // count exhaustion
  // ──────────────────────────────────────────────

  it('returns null when count is 0 (exhausted)', () => {
    const rule: RecurrenceRule = { frequency: 'daily', interval: 1, count: 0 }
    const result = nextOccurrence(rule, d('2026-05-01T10:00:00.000Z'))
    expect(result).toBeNull()
  })

  it('returns null when count is negative (treated as exhausted)', () => {
    const rule: RecurrenceRule = { frequency: 'daily', interval: 1, count: -1 }
    const result = nextOccurrence(rule, d('2026-05-01T10:00:00.000Z'))
    expect(result).toBeNull()
  })

  // ──────────────────────────────────────────────
  // daily
  // ──────────────────────────────────────────────

  it('advances by interval=1 day (daily)', () => {
    const rule: RecurrenceRule = { frequency: 'daily', interval: 1 }
    const from = d('2026-05-01T10:00:00.000Z')
    const next = nextOccurrence(rule, from)
    expect(next).not.toBeNull()
    expect(next!.toISOString()).toBe('2026-05-02T10:00:00.000Z')
  })

  it('advances by interval=3 days (daily, custom interval)', () => {
    const rule: RecurrenceRule = { frequency: 'daily', interval: 3 }
    const from = d('2026-05-01T00:00:00.000Z')
    const next = nextOccurrence(rule, from)
    expect(next!.toISOString()).toBe('2026-05-04T00:00:00.000Z')
  })

  it('returns null when daily next >= until', () => {
    const rule: RecurrenceRule = {
      frequency: 'daily',
      interval: 1,
      until: '2026-05-02T10:00:00.000Z', // exclusive
    }
    const from = d('2026-05-01T10:00:00.000Z')
    // next would be 2026-05-02T10:00:00.000Z — equal to until, should be null
    const result = nextOccurrence(rule, from)
    expect(result).toBeNull()
  })

  it('returns date when daily next < until', () => {
    const rule: RecurrenceRule = {
      frequency: 'daily',
      interval: 1,
      until: '2026-05-03T00:00:00.000Z',
    }
    const from = d('2026-05-01T10:00:00.000Z')
    const next = nextOccurrence(rule, from)
    expect(next).not.toBeNull()
    expect(next!.toISOString()).toBe('2026-05-02T10:00:00.000Z')
  })

  // ──────────────────────────────────────────────
  // weekly — no byWeekday
  // ──────────────────────────────────────────────

  it('advances by interval=1 week when no byWeekday specified', () => {
    const rule: RecurrenceRule = { frequency: 'weekly', interval: 1 }
    const from = d('2026-05-01T08:00:00.000Z') // Friday
    const next = nextOccurrence(rule, from)
    expect(next!.toISOString()).toBe('2026-05-08T08:00:00.000Z')
  })

  it('advances by interval=2 weeks when no byWeekday specified', () => {
    const rule: RecurrenceRule = { frequency: 'weekly', interval: 2 }
    const from = d('2026-05-01T08:00:00.000Z')
    const next = nextOccurrence(rule, from)
    expect(next!.toISOString()).toBe('2026-05-15T08:00:00.000Z')
  })

  // ──────────────────────────────────────────────
  // weekly — with byWeekday (same week)
  // ──────────────────────────────────────────────

  it('picks next weekday in same week (byWeekday, in-week)', () => {
    // from = Monday (day 1); next eligible is Wednesday (day 3)
    const rule: RecurrenceRule = {
      frequency: 'weekly',
      interval: 1,
      byWeekday: [3, 5], // Wed & Fri
    }
    // 2026-05-04 is a Monday (day 1 in JS getDay)
    const from = d('2026-05-04T09:00:00.000Z')
    const next = nextOccurrence(rule, from)
    expect(next).not.toBeNull()
    // Next Wed = 2026-05-06
    expect(next!.getUTCDay()).toBe(3)
  })

  it('wraps to next week when no byWeekday left in current week', () => {
    // from = Friday (day 5); byWeekday only has Mon (day 1) and Wed (day 3)
    const rule: RecurrenceRule = {
      frequency: 'weekly',
      interval: 1,
      byWeekday: [1, 3], // Mon & Wed
    }
    // 2026-05-08 is a Friday (day 5)
    const from = d('2026-05-08T09:00:00.000Z')
    const next = nextOccurrence(rule, from)
    expect(next).not.toBeNull()
    // Next Mon in the following week
    expect(next!.getUTCDay()).toBe(1)
  })
})
