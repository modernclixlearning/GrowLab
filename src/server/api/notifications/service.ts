import { eq, and, desc, isNull, lt, sql } from 'drizzle-orm'
import { db } from '@/server/db'
import { notifications, type Notification } from '@/server/db/schema/notifications'
import { nanoid } from 'nanoid'
import type { ListNotificationsQuery } from './schemas'

export type NotificationResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }

export async function listNotifications(
  userId: string,
  query: ListNotificationsQuery,
): Promise<NotificationResult<{ notifications: Notification[]; total: number; unreadCount: number }>> {
  const offset = (query.page - 1) * query.limit

  const [rows, totalResult, unreadResult] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(query.limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(eq(notifications.userId, userId)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt))),
  ])

  return {
    success: true,
    data: {
      notifications: rows,
      total: totalResult[0]?.count ?? 0,
      unreadCount: unreadResult[0]?.count ?? 0,
    },
  }
}

export async function getUnreadCount(userId: string): Promise<NotificationResult<{ count: number }>> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))

  return { success: true, data: { count: result[0]?.count ?? 0 } }
}

export async function markNotificationRead(
  id: string,
  userId: string,
): Promise<NotificationResult<true>> {
  const rows = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    .returning({ id: notifications.id })

  if (rows.length === 0) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } }
  }
  return { success: true, data: true }
}

export async function markAllRead(userId: string): Promise<NotificationResult<{ updated: number }>> {
  const rows = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
    .returning({ id: notifications.id })

  return { success: true, data: { updated: rows.length } }
}

export async function createNotification(input: {
  userId: string
  type: string
  title: string
  body: string
  referenceId?: string
  referenceType?: string
  channelKey?: string
}): Promise<NotificationResult<Notification>> {
  const rows = await db
    .insert(notifications)
    .values({ id: nanoid(), ...input })
    .returning()

  return { success: true, data: rows[0]! }
}

export async function purgeNotifications(): Promise<void> {
  const thirtyDaysAgo = sql`now() - interval '30 days'`
  const ninetyDaysAgo = sql`now() - interval '90 days'`

  await Promise.all([
    db
      .delete(notifications)
      .where(
        and(
          sql`${notifications.readAt} IS NOT NULL`,
          lt(notifications.createdAt, thirtyDaysAgo as unknown as Date),
        ),
      ),
    db
      .delete(notifications)
      .where(
        and(
          isNull(notifications.readAt),
          lt(notifications.createdAt, ninetyDaysAgo as unknown as Date),
        ),
      ),
  ])
}
