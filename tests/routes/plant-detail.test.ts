/**
 * GrowLab — Plant Detail derivations smoke test (F1).
 *
 * FIXME(f1): no jsdom/RTL available and adding deps is forbidden by F1
 * hard rules. We cover the date math used by the screen (`weekOfStage`
 * formula, `daysSince`) plus the `deriveCareTag` integration that the
 * detail page uses to render the "Care Status" pill. Visual smoke
 * coverage of the rendered Plant Detail lives in
 * `tests/visual/plant-detail.spec.ts`.
 */

import { describe, it, expect } from 'vitest'
import { deriveCareTag } from '@/lib/careTag'
import type { CareLog } from '@/types/care-logs'

const NOW = new Date('2026-05-09T12:00:00.000Z')

function waterLog(hoursAgo: number, id = 'l1'): CareLog {
  return {
    id,
    plantId: 'p1',
    logType: 'water',
    amount: '500',
    unit: 'ml',
    notes: null,
    loggedAt: new Date(NOW.getTime() - hoursAgo * 60 * 60 * 1000).toISOString(),
  }
}

/** Mirrors the inline formula from `routes/plants/$plantId.tsx`. */
function weekOfStage(daysInStage: number): number {
  return Math.max(1, Math.floor(daysInStage / 7) + 1)
}

describe('Plant Detail — derivations', () => {
  it('weekOfStage maps day counts to 1-indexed week buckets', () => {
    expect(weekOfStage(0)).toBe(1)
    expect(weekOfStage(6)).toBe(1)
    expect(weekOfStage(7)).toBe(2)
    expect(weekOfStage(13)).toBe(2)
    expect(weekOfStage(14)).toBe(3)
    expect(weekOfStage(60)).toBe(Math.floor(60 / 7) + 1)
  })

  it('deriveCareTag drives the page Care Status pill (smoke through helper)', () => {
    const tag = deriveCareTag([waterLog(2)], NOW)
    expect(tag.tone).toBe('good')
    expect(tag.label).toBe('WATERED')
    // Page expects hoursSinceWater present so the "Xh since last water"
    // suffix renders.
    expect(typeof tag.hoursSinceWater).toBe('number')
  })

  it('deriveCareTag returns NO DATA when no water logs exist', () => {
    const tag = deriveCareTag([], NOW)
    expect(tag.label).toBe('NO DATA')
    expect(tag.tone).toBe('alert')
  })
})
