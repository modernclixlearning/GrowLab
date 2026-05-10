/**
 * GrowLab Tent Service
 *
 * Business logic for tent CRUD. Mirrors the structure of `plants/service.ts`:
 * each operation returns a tagged-union `TentResult<T>` so route handlers can
 * pattern-match and pick the right HTTP status without try/catch noise.
 */

import { eq, and, desc, count } from 'drizzle-orm'
import { db } from '@/server/db'
import { tents, type Tent } from '@/server/db/schema'
import type {
  CreateTentInput,
  UpdateTentInput,
  ListTentsQuery,
} from './schemas'

export const TentErrorCodes = {
  NOT_FOUND: 'TENT_NOT_FOUND',
  FORBIDDEN: 'TENT_FORBIDDEN',
} as const

export type TentResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }

/**
 * Find a tent by id and ownership; returns NOT_FOUND vs FORBIDDEN
 * separately so the handler can map to 404/403 cleanly.
 */
async function findTentByIdAndOwner(
  tentId: string,
  userId: string,
): Promise<TentResult<{ tent: Tent }>> {
  const tent = await db.query.tents.findFirst({
    where: eq(tents.id, tentId),
  })
  if (!tent) {
    return {
      success: false,
      error: { code: TentErrorCodes.NOT_FOUND, message: 'Tent not found' },
    }
  }
  if (tent.userId !== userId) {
    return {
      success: false,
      error: {
        code: TentErrorCodes.FORBIDDEN,
        message: 'You do not have permission to access this tent',
      },
    }
  }
  return { success: true, data: { tent } }
}

/** List tents owned by `userId`, newest first. */
export async function listTents(
  userId: string,
  query: ListTentsQuery,
): Promise<TentResult<{ tents: Tent[]; total: number }>> {
  const { limit, offset } = query
  const where = eq(tents.userId, userId)

  const [list, [countResult]] = await Promise.all([
    db
      .select()
      .from(tents)
      .where(where)
      .orderBy(desc(tents.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(tents).where(where),
  ])

  return {
    success: true,
    data: { tents: list, total: countResult.count },
  }
}

export async function getTent(
  tentId: string,
  userId: string,
): Promise<TentResult<{ tent: Tent }>> {
  return findTentByIdAndOwner(tentId, userId)
}

export async function createTent(
  userId: string,
  input: CreateTentInput,
): Promise<TentResult<{ tent: Tent }>> {
  const now = new Date()
  const [created] = await db
    .insert(tents)
    .values({
      userId,
      name: input.name,
      // Numeric columns accept string or number; we always pass string so
      // the DB driver doesn't surprise us with Postgres' implicit cast rules.
      lightTarget: input.lightTarget ?? null,
      humidityTargetPct:
        input.humidityTargetPct === undefined
          ? null
          : String(input.humidityTargetPct),
      tempTargetC:
        input.tempTargetC === undefined ? null : String(input.tempTargetC),
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
  return { success: true, data: { tent: created } }
}

export async function updateTent(
  tentId: string,
  userId: string,
  input: UpdateTentInput,
): Promise<TentResult<{ tent: Tent }>> {
  const findResult = await findTentByIdAndOwner(tentId, userId)
  if (!findResult.success) return findResult

  const updateValues: Record<string, unknown> = { updatedAt: new Date() }
  if (input.name !== undefined) updateValues.name = input.name
  if (input.lightTarget !== undefined) updateValues.lightTarget = input.lightTarget
  if (input.humidityTargetPct !== undefined) {
    updateValues.humidityTargetPct =
      input.humidityTargetPct === null ? null : String(input.humidityTargetPct)
  }
  if (input.tempTargetC !== undefined) {
    updateValues.tempTargetC =
      input.tempTargetC === null ? null : String(input.tempTargetC)
  }
  if (input.notes !== undefined) updateValues.notes = input.notes

  const [updated] = await db
    .update(tents)
    .set(updateValues)
    .where(and(eq(tents.id, tentId), eq(tents.userId, userId)))
    .returning()

  return { success: true, data: { tent: updated } }
}

export async function deleteTent(
  tentId: string,
  userId: string,
): Promise<TentResult<{ message: string }>> {
  const findResult = await findTentByIdAndOwner(tentId, userId)
  if (!findResult.success) return findResult

  await db.delete(tents).where(eq(tents.id, tentId))
  return { success: true, data: { message: 'Tent deleted successfully' } }
}
