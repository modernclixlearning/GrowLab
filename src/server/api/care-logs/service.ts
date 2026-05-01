/**
 * GrowLab Care Log Service
 * 
 * Business logic for care logging operations.
 * Handles creating and listing care log entries for plants.
 * Verifies plant ownership before any operation.
 */

import { eq, and, desc, asc, count } from 'drizzle-orm'
import { db } from '@/server/db'
import { careLogs, type CareLog } from '@/server/db/schema/care-logs'
import { plants } from '@/server/db/schema/plants'
import type { CreateCareLogInput, ListCareLogsQuery } from './schemas'

/**
 * Error codes for care log operations
 */
export const CareLogErrorCodes = {
  PLANT_NOT_FOUND: 'PLANT_NOT_FOUND',
  PLANT_FORBIDDEN: 'PLANT_FORBIDDEN',
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

  const [careLog] = await db
    .insert(careLogs)
    .values({
      plantId,
      logType: input.logType,
      amount: input.amount?.toString() ?? null,
      unit: input.unit ?? null,
      notes: input.notes ?? null,
      loggedAt,
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
