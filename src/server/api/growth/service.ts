/**
 * GrowLab Growth Measurements Service (F5)
 *
 * Business logic for growth measurement creation, listing, and
 * derivation of weekly growth bars for the Plant Detail Expert view.
 */

import { eq, and, desc } from 'drizzle-orm'
import { db } from '@/server/db'
import { growthMeasurements, type GrowthMeasurement } from '@/server/db/schema/growth-measurements'
import { plants } from '@/server/db/schema/plants'
import { nanoid } from 'nanoid'
import type { CreateGrowthMeasurementInput, ListGrowthMeasurementsQuery } from './schemas'

export const GrowthErrorCodes = {
  PLANT_NOT_FOUND: 'PLANT_NOT_FOUND',
} as const

export type GrowthResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }

async function verifyPlantOwnership(
  plantId: string,
  userId: string,
): Promise<GrowthResult<true>> {
  const plant = await db.query.plants.findFirst({
    where: eq(plants.id, plantId),
    columns: { id: true, userId: true },
  })
  if (!plant || plant.userId !== userId) {
    return { success: false, error: { code: GrowthErrorCodes.PLANT_NOT_FOUND, message: 'Plant not found' } }
  }
  return { success: true, data: true }
}

export async function createGrowthMeasurement(
  userId: string,
  input: CreateGrowthMeasurementInput,
): Promise<GrowthResult<{ measurement: GrowthMeasurement }>> {
  const check = await verifyPlantOwnership(input.plantId, userId)
  if (!check.success) return check

  const [measurement] = await db
    .insert(growthMeasurements)
    .values({
      id: nanoid(),
      plantId: input.plantId,
      metric: input.metric,
      value: String(input.value),
      recordedAt: input.recordedAt ? new Date(input.recordedAt) : new Date(),
    })
    .returning()

  if (!measurement) {
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create measurement' } }
  }

  return { success: true, data: { measurement } }
}

export async function listGrowthMeasurements(
  userId: string,
  query: ListGrowthMeasurementsQuery,
): Promise<GrowthResult<{ measurements: GrowthMeasurement[] }>> {
  const check = await verifyPlantOwnership(query.plantId, userId)
  if (!check.success) return check

  const conditions = [eq(growthMeasurements.plantId, query.plantId)]
  if (query.metric) conditions.push(eq(growthMeasurements.metric, query.metric))

  const measurements = await db
    .select()
    .from(growthMeasurements)
    .where(and(...conditions))
    .orderBy(desc(growthMeasurements.recordedAt))
    .limit(query.limit)

  return { success: true, data: { measurements } }
}

// ─── Growth Bars derivation ───────────────────────────────────────────────────

export interface GrowthBar {
  weekLabel: string
  value: number
  weekDelta: number | null
}

/**
 * Derive the last 5 weekly growth bars from a list of height_cm measurements.
 * Each bar represents one ISO week. Values are normalized so the max = 100.
 *
 * Returns up to 5 bars ordered from oldest to newest (left → right in the UI).
 */
export function deriveGrowthBars(measurements: GrowthMeasurement[]): GrowthBar[] {
  // Filter to height_cm only
  const heightMeasurements = measurements.filter((m) => m.metric === 'height_cm')
  if (heightMeasurements.length === 0) return []

  // Group by ISO week (YYYY-Www)
  function getISOWeek(date: Date): string {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    // Thursday of current week
    d.setDate(d.getDate() + 4 - (d.getDay() || 7))
    const yearStart = new Date(d.getFullYear(), 0, 1)
    const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
    return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
  }

  const weekMap = new Map<string, number>()
  for (const m of heightMeasurements) {
    const week = getISOWeek(new Date(m.recordedAt))
    const val = parseFloat(String(m.value))
    const existing = weekMap.get(week) ?? 0
    if (val > existing) weekMap.set(week, val) // take max per week
  }

  // Sort weeks and take the last 5
  const sortedWeeks = [...weekMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  const last5 = sortedWeeks.slice(-5)

  if (last5.length === 0) return []

  // Normalize so max = 100
  const maxVal = Math.max(...last5.map(([, v]) => v))
  const normalize = (v: number) => (maxVal === 0 ? 0 : Math.round((v / maxVal) * 100))

  return last5.map(([, rawValue], i) => {
    const prev = i > 0 ? last5[i - 1]?.[1] ?? null : null
    const weekDelta = prev !== null ? parseFloat((rawValue - prev).toFixed(2)) : null
    // Derive a short label "W1"…"W5" based on position
    const weekLabel = `W${i + 1}`
    return {
      weekLabel,
      value: normalize(rawValue),
      weekDelta,
    }
  })
}
