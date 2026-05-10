/**
 * GrowLab — Recurrence helper (F3)
 *
 * Pure, framework-free helper for computing the next occurrence of a
 * scheduled care task. Imported by both the server (care-logs service)
 * and the client (RecurrenceForm preview). No React, no DB.
 */

export interface RecurrenceRule {
  /** How often the event repeats. */
  frequency: 'daily' | 'weekly'
  /** Repeat every N days/weeks. Must be >= 1. */
  interval: number
  /**
   * ISO weekday numbers (0 = Sunday … 6 = Saturday).
   * Only meaningful when frequency = 'weekly'.
   * When absent with weekly, recurs every interval*7 days from the anchor.
   */
  byWeekday?: number[]
  /**
   * Exclusive upper-bound (ISO date string).
   * If the computed next date >= until, nextOccurrence returns null.
   */
  until?: string
  /**
   * Remaining occurrences. 0 means exhausted; undefined means unlimited.
   * Decremented each time a new instance is spawned by completeCareLog.
   */
  count?: number
}

/**
 * Add a whole number of days to a Date, returning a new Date.
 */
function addDays(d: Date, days: number): Date {
  const result = new Date(d.getTime())
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Compute the next occurrence after `from` for the given recurrence rule.
 *
 * Returns `null` when the rule is exhausted:
 *   - `count` is defined and <= 0
 *   - the computed next date >= `until`
 *
 * ### Frequency semantics
 *
 * **daily** — next = from + interval days.
 *
 * **weekly** (no byWeekday) — next = from + interval * 7 days.
 *
 * **weekly** (with byWeekday):
 *   1. Sort the weekday list ascending.
 *   2. Look for the first listed weekday strictly after from.getDay().
 *      If found, that date is in the same week — return it.
 *   3. If not (no day later in the week), jump to the first listed weekday
 *      in the week that starts `interval` weeks after the current week's
 *      Sunday (i.e. offset = −fromDay + interval * 7 + sorted[0]).
 *
 * @param rule - Recurrence definition.
 * @param from - The anchor date (usually the last scheduledAt).
 * @returns Next date, or null if exhausted.
 */
export function nextOccurrence(rule: RecurrenceRule, from: Date): Date | null {
  // Count exhaustion check.
  if (rule.count !== undefined && rule.count <= 0) return null

  let next: Date

  if (rule.frequency === 'daily') {
    next = addDays(from, rule.interval)
  } else {
    // weekly
    const byWeekday = rule.byWeekday

    if (!byWeekday || byWeekday.length === 0) {
      // Simple weekly: advance N full weeks.
      next = addDays(from, rule.interval * 7)
    } else {
      const sorted = [...byWeekday].sort((a, b) => a - b)
      const fromDay = from.getDay() // 0 = Sun … 6 = Sat

      // Look for the first listed weekday strictly after fromDay (same week).
      const nextInWeek = sorted.find((d) => d > fromDay)

      if (nextInWeek !== undefined) {
        // Same-week candidate.
        next = addDays(from, nextInWeek - fromDay)
      } else {
        // No remaining weekday this week. Jump to the first byWeekday in the
        // week that is `interval` full weeks ahead.
        // offset = days to this week's Sunday (= -fromDay) + interval weeks
        //          + first sorted weekday.
        const offset = -fromDay + rule.interval * 7 + sorted[0]
        next = addDays(from, offset)
      }
    }
  }

  // Until check (exclusive).
  if (rule.until) {
    const untilDate = new Date(rule.until)
    if (next >= untilDate) return null
  }

  return next
}
