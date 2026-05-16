import { eq, and, desc, isNull, lt, gt, gte, lte, sql } from 'drizzle-orm'
import { db } from '@/server/db'
import { notifications, type Notification } from '@/server/db/schema/notifications'
import { careLogs } from '@/server/db/schema/care-logs'
import { plants } from '@/server/db/schema/plants'
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

export async function checkSchedulesDue(): Promise<{ processed: number; notified: number }> {
  const { sendPushToUser } = await import('@/server/api/push/service')

  const dueLogs = await db
    .select({
      id: careLogs.id,
      logType: careLogs.logType,
      plantId: careLogs.plantId,
      plantName: plants.name,
      userId: plants.userId,
    })
    .from(careLogs)
    .innerJoin(plants, eq(careLogs.plantId, plants.id))
    .where(
      and(
        isNull(careLogs.completedAt),
        gte(careLogs.scheduledAt, sql`now()`),
        lte(careLogs.scheduledAt, sql`now() + interval '30 minutes'`),
      ),
    )

  let notified = 0

  for (const log of dueLogs) {
    const channelKey = `schedule_due:${log.id}`

    const recent = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, log.userId),
          eq(notifications.channelKey, channelKey),
          gt(notifications.createdAt, sql`now() - interval '2 hours'`),
        ),
      )
      .limit(1)

    if (recent.length > 0) continue

    const title = `Care task due: ${log.logType}`
    const body = `${log.plantName} needs attention in the next 30 minutes.`

    const notifResult = await createNotification({
      userId: log.userId,
      type: 'schedule_due',
      title,
      body,
      referenceId: log.id,
      referenceType: 'care_log',
      channelKey,
    })

    if (notifResult.success) {
      notified++
      await sendPushToUser(log.userId, {
        type: 'schedule_due',
        title,
        body,
        data: { notificationId: notifResult.data.id, referenceId: log.id, referenceType: 'care_log' },
      })
    }
  }

  return { processed: dueLogs.length, notified }
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
