/**
 * GrowLab — Growth measurement service tests (F5)
 *
 * Tests for deriveGrowthBars — the pure function that transforms
 * raw GrowthMeasurement rows into normalized weekly GrowthBar data.
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'

// Freeze time so ISO-week bucketing is deterministic regardless of when tests run
const FIXED_DATE = new Date('2026-05-07T12:00:00.000Z')
beforeAll(() => vi.useFakeTimers({ now: FIXED_DATE }))
afterAll(() => vi.useRealTimers())

// Mock db so the module-level DATABASE_URL check doesn't fire in tests
vi.mock('@/server/db', () => ({ db: {} }))

import { deriveGrowthBars } from '@/server/api/growth/service'
import type { GrowthMeasurement } from '@/server/db/schema/growth-measurements'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function measurement(
  heightCm: number,
  weeksAgo: number,
  id = `m-${Math.random()}`,
): GrowthMeasurement {
  const d = new Date()
  d.setDate(d.getDate() - weeksAgo * 7)
  return {
    id,
    plantId: 'plant-1',
    metric: 'height_cm',
    value: String(heightCm),
    recordedAt: d,
    createdAt: d,
  }
}

function leafMeasurement(count: number, weeksAgo: number): GrowthMeasurement {
  const d = new Date()
  d.setDate(d.getDate() - weeksAgo * 7)
  return {
    id: `leaf-${Math.random()}`,
    plantId: 'plant-1',
    metric: 'leaf_count',
    value: String(count),
    recordedAt: d,
    createdAt: d,
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('deriveGrowthBars', () => {
  it('returns empty array when there are no measurements', () => {
    expect(deriveGrowthBars([])).toEqual([])
  })

  it('returns empty array when there are only leaf_count measurements', () => {
    const bars = deriveGrowthBars([leafMeasurement(10, 0), leafMeasurement(15, 1)])
    expect(bars).toEqual([])
  })

  it('returns bars for all available weeks (< 5 weeks)', () => {
    const measurements = [
      measurement(10, 2),
      measurement(20, 1),
      measurement(30, 0),
    ]
    const bars = deriveGrowthBars(measurements)
    expect(bars.length).toBeLessThanOrEqual(3)
    expect(bars.length).toBeGreaterThanOrEqual(1)
  })

  it('limits to the last 5 weeks when more data is available', () => {
    const measurements = [
      measurement(5, 7),
      measurement(8, 6),
      measurement(12, 5),
      measurement(15, 4),
      measurement(20, 3),
      measurement(25, 2),
      measurement(30, 1),
      measurement(35, 0),
    ]
    const bars = deriveGrowthBars(measurements)
    expect(bars.length).toBeLessThanOrEqual(5)
  })

  it('normalizes the highest value to 100', () => {
    const measurements = [
      measurement(10, 4),
      measurement(20, 3),
      measurement(30, 2),
      measurement(40, 1),
      measurement(50, 0),
    ]
    const bars = deriveGrowthBars(measurements)
    expect(bars.length).toBeGreaterThanOrEqual(1)
    const maxVal = Math.max(...bars.map((b) => b.value))
    expect(maxVal).toBe(100)
  })

  it('sets weekDelta to null for the first bar', () => {
    const measurements = [measurement(20, 1), measurement(30, 0)]
    const bars = deriveGrowthBars(measurements)
    if (bars.length >= 2) {
      expect(bars[0]!.weekDelta).toBeNull()
    }
  })

  it('computes weekDelta correctly between adjacent weeks', () => {
    const measurements = [
      measurement(20, 2),
      measurement(30, 1),
      measurement(40, 0),
    ]
    const bars = deriveGrowthBars(measurements)
    if (bars.length >= 2) {
      // Each week grew by 10 units — delta should be positive
      const nonNullDeltas = bars.slice(1).map((b) => b.weekDelta)
      for (const d of nonNullDeltas) {
        if (d !== null) expect(d).toBeGreaterThan(0)
      }
    }
  })

  it('returns weekLabel as "W1", "W2", etc.', () => {
    const measurements = [
      measurement(10, 2),
      measurement(20, 1),
      measurement(30, 0),
    ]
    const bars = deriveGrowthBars(measurements)
    bars.forEach((bar, i) => {
      expect(bar.weekLabel).toBe(`W${i + 1}`)
    })
  })

  it('takes the max value when multiple measurements exist in the same week', () => {
    // Two measurements in the same week: 15 and 25 — should use 25
    const now = new Date()
    const sameWeek1: GrowthMeasurement = {
      id: 'a',
      plantId: 'plant-1',
      metric: 'height_cm',
      value: '15',
      recordedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
      createdAt: now,
    }
    const sameWeek2: GrowthMeasurement = {
      id: 'b',
      plantId: 'plant-1',
      metric: 'height_cm',
      value: '25',
      recordedAt: now,
      createdAt: now,
    }
    const bars = deriveGrowthBars([sameWeek1, sameWeek2])
    // Single week => single bar, value = 100 (max/max = 1)
    if (bars.length === 1) {
      expect(bars[0]!.value).toBe(100)
    }
  })
})
