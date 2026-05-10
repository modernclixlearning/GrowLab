/**
 * GrowLab Care Log Service
 *
 * Business logic for care logging operations.
 * Handles creating and listing care log entries for plants.
 * Verifies plant ownership before any operation.
 *
 * F3: adds listScheduledCareLogs (cross-plant window query) and
 *     completeCareLog (mark done + spawn next recurrence instance).
 */

import { eq, and, desc, asc, count, gte, lte, inArray, isNotNull, sql } from 'drizzle-orm'
import { db } from '@/server/db'
import { careLogs, type CareLog } from '@/server/db/schema/care-logs'
import { plants } from '@/server/db/schema/plants'
import { nextOccurrence } from '@/lib/recurrence'
import type { CreateCareLogInput, ListCareLogsQuery, ListScheduledCareLogsQuery } from './schemas'

/**
 * Error codes for care log operations
 */
export const CareLogErrorCodes = {
  PLANT_NOT_FOUND: 'PLANT_NOT_FOUND',
  PLANT_FORBIDDEN: 'PLANT_FORBIDDEN',
  CARE_LOG_NOT_FOUND: 'CARE_LOG_NOT_FOUND',
  CARE_LOG_FORBIDDEN: 'CARE_LOG_FORBIDDEN',
} as const

/**
 * Care log operation result type
 */
export type CareLogResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }

/**
 * Verify a plant exists and is owned by the given user.
 * Used before any care log operation to ensure authorization.
 */
async function verifyPlantOwnership(
  plantId: string,
  userId: string
): Promise<CareLogResult<{ plantId: string }>> {
  const plant = await db.query.plants.findFirst({
    where: eq(plants.id, plantId),
    columns: { id: true, userId: true },
  })

  if (!plant) {
    return {
      success: false,
      error: {
        code: CareLogErrorCodes.PLANT_NOT_FOUND,
        message: 'Plant not found',
      },
    }
  }

  if (plant.userId !== userId) {
    return {
      success: false,
      error: {
        code: CareLogErrorCodes.PLANT_FORBIDDEN,
        message: 'You do not have permission to access this plant',
      },
    }
  }

  return { success: true, data: { plantId: plant.id } }
}

/**
 * Create a new care log entry for a plant
 */
export async function createCareLog(
  plantId: string,
  userId: string,
  input: CreateCareLogInput
): Promise<CareLogResult<{ careLog: CareLog }>> {
  // Verify plant ownership
  const ownerCheck = await verifyPlantOwnership(plantId, userId)
  if (!ownerCheck.success) return ownerCheck

  const loggedAt = input.loggedAt ? new Date(input.loggedAt) : new Date()
  const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null

  const [careLog] = await db
    .insert(careLogs)
    .values({
      plantId,
      logType: input.logType,
      amount: input.amount?.toString() ?? null,
      unit: input.unit ?? null,
      notes: input.notes ?? null,
      loggedAt,
      scheduledAt,
      recurrenceRule: input.recurrenceRule ?? null,
    })
    .returning()

  return {
    success: true,
    data: { careLog },
  }
}

/**
 * List care logs for a plant with optional filtering and pagination
 */
export async function listCareLogs(
  plantId: string,
  userId: string,
  query: ListCareLogsQuery
): Promise<CareLogResult<{ careLogs: CareLog[]; total: number }>> {
  // Verify plant ownership
  const ownerCheck = await verifyPlantOwnership(plantId, userId)
  if (!ownerCheck.success) return ownerCheck

  const { logType, sortOrder, limit, offset } = query

  // Build where conditions
  const conditions = [eq(careLogs.plantId, plantId)]

  if (logType) {
    conditions.push(eq(careLogs.logType, logType))
  }

  const whereClause = and(...conditions)
  const orderFn = sortOrder === 'asc' ? asc : desc

  // Execute query and count in parallel
  const [logsList, [countResult]] = await Promise.all([
    db
      .select()
      .from(careLogs)
      .where(whereClause)
      .orderBy(orderFn(careLogs.loggedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(careLogs)
      .where(whereClause),
  ])

  return {
    success: true,
    data: {
      careLogs: logsList,
      total: countResult.count,
    },
  }
}

/**
 * F3 — List care logs across all plants owned by the user, filtered by
 * a scheduled window (scheduledFrom..scheduledTo inclusive).
 *
 * If `plantId` is supplied, restricts to that plant (after ownership check).
 * Sort: scheduledAt ASC NULLS LAST, then loggedAt DESC.
 */
export async function listScheduledCareLogs(
  userId: string,
  query: ListScheduledCareLogsQuery
): Promise<CareLogResult<{ careLogs: CareLog[]; total: number }>> {
  const { plantId, scheduledFrom, scheduledTo } = query

  // Fetch all plants owned by this user (or just the one requested).
  const ownedPlants = await db
    .select({ id: plants.id })
    .from(plants)
    .where(
      plantId
        ? and(eq(plants.id, plantId), eq(plants.userId, userId))
        : eq(plants.userId, userId),
    )

  if (ownedPlants.length === 0) {
    // Either the user has no plants or the specified plantId is not theirs.
    if (plantId) {
      return {
        success: false,
        error: { code: CareLogErrorCodes.PLANT_NOT_FOUND, message: 'Plant not found' },
      }
    }
    return { success: true, data: { careLogs: [], total: 0 } }
  }

  const plantIds = ownedPlants.map((p) => p.id)

  // Build conditions
  const conditions = [inArray(careLogs.plantId, plantIds), isNotNull(careLogs.scheduledAt)]

  if (scheduledFrom) {
    conditions.push(gte(careLogs.scheduledAt, new Date(scheduledFrom)))
  }
  if (scheduledTo) {
    conditions.push(lte(careLogs.scheduledAt, new Date(scheduledTo)))
  }

  const whereClause = and(...conditions)

  const [logsList, [countResult]] = await Promise.all([
    db
      .select()
      .from(careLogs)
      .where(whereClause)
      .orderBy(
        sql`${careLogs.scheduledAt} ASC NULLS LAST`,
        desc(careLogs.loggedAt),
      ),
    db.select({ count: count() }).from(careLogs).where(whereClause),
  ])

  return {
    success: true,
    data: { careLogs: logsList, total: countResult.count },
  }
}

/**
 * F3 — Mark a care log as completed (completedAt = now(), loggedAt = now()).
 *
 * If the row has a recurrenceRule, compute the next occurrence and insert
 * a new pending row. Stops if the rule is exhausted (until exceeded or
 * count decrements to 0).
 *
 * Returns the updated row (and the spawned next row if any).
 */
export async function completeCareLog(
  careLogId: string,
  userId: string,
): Promise<CareLogResult<{ careLog: CareLog; next: CareLog | null }>> {
  // Fetch the target row
  const row = await db.query.careLogs.findFirst({
    where: eq(careLogs.id, careLogId),
  })

  if (!row) {
    return {
      success: false,
      error: { code: CareLogErrorCodes.CARE_LOG_NOT_FOUND, message: 'Care log not found' },
    }
  }

  // Verify ownership via the plant
  const ownerCheck = await verifyPlantOwnership(row.plantId, userId)
  if (!ownerCheck.success) {
    return {
      success: false,
      error: { code: CareLogErrorCodes.CARE_LOG_FORBIDDEN, message: 'Access denied' },
    }
  }

  const now = new Date()

  // Mark the current row done
  const [updated] = await db
    .update(careLogs)
    .set({ completedAt: now, loggedAt: now })
    .where(eq(careLogs.id, careLogId))
    .returning()

  // Spawn next recurrence if applicable
  let spawned: CareLog | null = null
  const rule = row.recurrenceRule

  if (rule) {
    // Decrement count before deciding whether to spawn.
    const newCount =
      rule.count !== undefined ? rule.count - 1 : undefined

    // If count would be 0 after decrement, this was the last occurrence.
    if (newCount !== undefined && newCount <= 0) {
      // Do not generate next.
    } else {
      const anchor = row.scheduledAt ?? now
      const nextScheduledAt = nextOccurrence(
        { ...rule, count: newCount },
        anchor,
      )

      if (nextScheduledAt) {
        const newRule =
          newCount !== undefined
            ? { ...rule, count: newCount }
            : rule

        const [nextRow] = await db
          .insert(careLogs)
          .values({
            plantId: row.plantId,
            logType: row.logType,
            amount: row.amount,
            unit: row.unit,
            notes: row.notes,
            loggedAt: now,
            scheduledAt: nextScheduledAt,
            recurrenceRule: newRule,
            parentScheduleId: row.parentScheduleId ?? row.id,
          })
          .returning()

        spawned = nextRow
      }
    }
  }

  return { success: true, data: { careLog: updated, next: spawned } }
}

/**
 * Get care log summary stats for a plant (recent activity counts)
 */
export async function getCareLogStats(
  plantId: string,
  userId: string
): Promise<CareLogResult<{ total: number; byType: Record<string, number> }>> {
  // Verify plant ownership
  const ownerCheck = await verifyPlantOwnership(plantId, userId)
  if (!ownerCheck.success) return ownerCheck

  const results = await db
    .select({
      logType: careLogs.logType,
      count: count(),
    })
    .from(careLogs)
    .where(eq(careLogs.plantId, plantId))
    .groupBy(careLogs.logType)

  const byType: Record<string, number> = {}
  let total = 0

  for (const row of results) {
    byType[row.logType] = row.count
    total += row.count
  }

  return {
    success: true,
    data: { total, byType },
  }
}

