import { eq, and } from 'drizzle-orm'
import webpush from 'web-push'
import { db } from '@/server/db'
import { pushSubscriptions, type PushSubscription } from '@/server/db/schema/push-subscriptions'
import { nanoid } from 'nanoid'
import { env } from '@/server/lib/env'
import type { PushSubscribeInput } from './schemas'

let vapidConfigured = false

function ensureVapid() {
  if (vapidConfigured) return
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) return
  webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY)
  vapidConfigured = true
}

export type PushResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }

export function getVapidPublicKey(): string | null {
  return env.VAPID_PUBLIC_KEY ?? null
}

export async function subscribe(
  userId: string,
  input: PushSubscribeInput,
): Promise<PushResult<PushSubscription>> {
  const existing = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, input.endpoint))
    .limit(1)

  if (existing.length > 0) {
    return { success: true, data: existing[0]! }
  }

  const rows = await db
    .insert(pushSubscriptions)
    .values({
      id: nanoid(),
      userId,
      endpoint: input.endpoint,
      p256dhKey: input.keys.p256dh,
      authKey: input.keys.auth,
      userAgent: input.userAgent,
    })
    .returning()

  return { success: true, data: rows[0]! }
}

export async function unsubscribe(
  userId: string,
  endpoint: string,
): Promise<PushResult<true>> {
  await db
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)))

  return { success: true, data: true }
}

export interface PushPayload {
  type: string
  title: string
  body: string
  data?: { notificationId?: string; referenceId?: string; referenceType?: string }
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  ensureVapid()
  if (!vapidConfigured) return

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId))

  const message = JSON.stringify(payload)

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dhKey, auth: sub.authKey } },
          message,
        )
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 410 || status === 404) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id))
        } else {
          console.error('[push] Send error for sub', sub.id, err)
        }
      }
    }),
  )
}
