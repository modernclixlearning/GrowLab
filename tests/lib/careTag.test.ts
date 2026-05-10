/**
 * GrowLab — deriveCareTag tests
 *
 * Covers the four time-window thresholds plus the "no data" edge case.
 * Uses a fixed `now` to keep the assertions deterministic.
 */

import { describe, it, expect } from 'vitest'
import { deriveCareTag } from '@/lib/careTag'
import type { CareLog } from '@/types/care-logs'

const NOW = new Date('2026-05-09T12:00:00.000Z')

function waterLog(hoursAgo: number, id = 'log-x'): CareLog {
  const ts = new Date(NOW.getTime() - hoursAgo * 60 * 60 * 1000)
  return {
    id,
    plantId: 'plant-1',
    logType: 'water',
    amount: '500',
    unit: 'ml',
    notes: null,
    loggedAt: ts.toISOString(),
  }
}

function feedLog(hoursAgo: number, id = 'log-feed'): CareLog {
  const ts = new Date(NOW.getTime() - hoursAgo * 60 * 60 * 1000)
  return {
    id,
    plantId: 'plant-1',
    logType: 'feed',
    amount: null,
    unit: null,
    notes: null,
    loggedAt: ts.toISOString(),
  }
}

describe('deriveCareTag', () => {
  it('returns NO DATA when there are no water logs', () => {
    const tag = deriveCareTag([], NOW)
    expect(tag.label).toBe('NO DATA')
    expect(tag.tone).toBe('alert')
    expect(tag.hoursSinceWater).toBeUndefined()
  })

  it('ignores non-water logs and returns NO DATA when no water logs exist', () => {
    const tag = deriveCareTag([feedLog(3), feedLog(20, 'log-feed-2')], NOW)
    expect(tag.label).toBe('NO DATA')
    expect(tag.tone).toBe('alert')
  })

  it('returns WATERED (good) when last water log is <12h old', () => {
    const tag = deriveCareTag([waterLog(2)], NOW)
    expect(tag.label).toBe('WATERED')
    expect(tag.tone).toBe('good')
    expect(tag.hoursSinceWater).toBeCloseTo(2, 5)
  })

  it('returns OK (water) when last water log is between 12h and 48h', () => {
    const tag = deriveCareTag([waterLog(24)], NOW)
    expect(tag.label).toBe('OK')
    expect(tag.tone).toBe('water')
    expect(tag.hoursSinceWater).toBeCloseTo(24, 5)
  })

  it('returns THIRSTY when last water log is between 48h and 72h', () => {
    const tag = deriveCareTag([waterLog(60)], NOW)
    expect(tag.label).toBe('THIRSTY')
    expect(tag.tone).toBe('thirsty')
    expect(tag.hoursSinceWater).toBeCloseTo(60, 5)
  })

  it('returns NEEDS WATER (warn) when last water log is >72h old', () => {
    const tag = deriveCareTag([waterLog(96)], NOW)
    expect(tag.label).toBe('NEEDS WATER')
    expect(tag.tone).toBe('warn')
    expect(tag.hoursSinceWater).toBeCloseTo(96, 5)
  })

  it('uses the most recent water log when multiple exist', () => {
    const tag = deriveCareTag(
      [waterLog(96, 'old'), waterLog(2, 'recent'), waterLog(40, 'mid')],
      NOW,
    )
    expect(tag.label).toBe('WATERED')
    expect(tag.tone).toBe('good')
  })

  it('treats the 12h threshold inclusively as OK (boundary case)', () => {
    // 12h exactly should fall into the OK bucket per `<12` strict inequality.
    const tag = deriveCareTag([waterLog(12)], NOW)
    expect(tag.label).toBe('OK')
    expect(tag.tone).toBe('water')
  })
})
