/**
 * GrowLab — careTag derivation helper
 *
 * Derives a presentation-ready care status tag from a plant's care log
 * history. Used by Garden screen `<PlantCard>` and Plant Detail (F1).
 *
 * Rules (F1, refinable with telemetry):
 *   - <12h since last water log  → WATERED  (good)
 *   - 12–48h since last water    → OK        (water)
 *   - 48–72h since last water    → THIRSTY   (thirsty)
 *   - >72h since last water      → NEEDS WATER (warn)
 *   - No water logs ever         → NO DATA   (alert)
 *
 * `tone` maps to existing Tailwind tokens via `text-status-*`.
 */

import type { CareLog } from '@/types/care-logs'

export type CareTagTone = 'good' | 'water' | 'thirsty' | 'alert' | 'warn'

export interface CareTag {
  /** Uppercase mono label, ready for `<Eyebrow>` rendering. */
  label: string
  /** Maps to `text-status-{tone}` Tailwind utility. */
  tone: CareTagTone
  /** Hours since last water log; omitted when no water logs exist. */
  hoursSinceWater?: number
}

const HOUR_MS = 1000 * 60 * 60

/**
 * Compute the careTag for a plant given its full care log history.
 *
 * The function is pure and deterministic given a fixed `now`; pass `now`
 * for testing. In production callers, omit it (defaults to current time).
 */
export function deriveCareTag(careLogs: CareLog[], now: Date = new Date()): CareTag {
  // Filter to water logs only and find the most recent by loggedAt.
  let mostRecent: CareLog | null = null
  let mostRecentMs = -Infinity

  for (const log of careLogs) {
    if (log.logType !== 'water') continue
    const ts = new Date(log.loggedAt).getTime()
    if (Number.isNaN(ts)) continue
    if (ts > mostRecentMs) {
      mostRecentMs = ts
      mostRecent = log
    }
  }

  if (!mostRecent) {
    return { label: 'NO DATA', tone: 'alert' }
  }

  const hoursSinceWater = (now.getTime() - mostRecentMs) / HOUR_MS

  if (hoursSinceWater < 12) {
    return { label: 'WATERED', tone: 'good', hoursSinceWater }
  }
  if (hoursSinceWater < 48) {
    return { label: 'OK', tone: 'water', hoursSinceWater }
  }
  if (hoursSinceWater < 72) {
    return { label: 'THIRSTY', tone: 'thirsty', hoursSinceWater }
  }
  return { label: 'NEEDS WATER', tone: 'warn', hoursSinceWater }
}

/**
 * Tailwind text color class for a careTag tone.
 * Useful in components that don't want to map tone → class manually.
 */
export const CARE_TAG_TONE_CLASS: Record<CareTagTone, string> = {
  good: 'text-status-good',
  water: 'text-status-water',
  thirsty: 'text-status-thirsty',
  alert: 'text-status-alert',
  warn: 'text-status-warn',
}
