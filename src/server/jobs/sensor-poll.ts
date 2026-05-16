/**
 * GrowLab Sensor Polling — F6c rewrite
 *
 * pollOnce(device): polls one cloud device, inserts readings (unchanged from F5).
 * pollAndAlert():   invoked by POST /api/internal/poll-sensors; polls all
 *                   non-manual devices, evaluates thresholds, creates sensor_alert
 *                   notifications with 4h cool-down.
 * cleanupOldReadings(): purges sensor readings older than 90 days (nightly cron).
 *
 * startPollingJob() (F5 setTimeout loop) has been removed — polling is now
 * driven by the external cron hitting /api/internal/poll-sensors.
 */

import { eq, and, desc, lt, gt, sql } from 'drizzle-orm'
import { db } from '@/server/db'
import { sensorDevices, type SensorDevice } from '@/server/db/schema/sensor-devices'
import { sensorReadings } from '@/server/db/schema/sensor-readings'
import { tents } from '@/server/db/schema/tents'
import { plants } from '@/server/db/schema/plants'
import { notifications } from '@/server/db/schema/notifications'
import { decryptApiKey } from '@/server/lib/crypto'
import { getProvider } from '@/server/integrations/provider-factory'
import { createNotification } from '@/server/api/notifications/service'
import { sendPushToUser } from '@/server/api/push/service'
import { nanoid } from 'nanoid'

/**
 * Poll a single device once and insert any readings into sensor_readings.
 * Updates last_poll_at on success or last_error on failure.
 * Unchanged from F5 — no threshold logic here.
 */
export async function pollOnce(device: SensorDevice): Promise<void> {
  if (device.provider === 'manual') return

  if (!device.apiKeyEncrypted) {
    await db
      .update(sensorDevices)
      .set({ lastError: 'No API key configured' })
      .where(eq(sensorDevices.id, device.id))
    return
  }

  try {
    const apiKey = decryptApiKey(device.apiKeyEncrypted)
    const provider = getProvider(device.provider)
    const rawReadings = await provider.fetchReadings({ apiKey })

    if (rawReadings.length > 0) {
      await db.insert(sensorReadings).values(
        rawReadings.map((r) => ({
          id: nanoid(),
          sensorDeviceId: device.id,
          plantId: device.targetPlantId,
          tentId: device.targetTentId,
          metric: r.metric,
          value: String(r.value),
          unit: r.unit,
          recordedAt: r.recordedAt,
        })),
      )
    }

    await db
      .update(sensorDevices)
      .set({ lastPollAt: new Date(), lastError: null })
      .where(eq(sensorDevices.id, device.id))
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[sensor-poll] Device ${device.id} (${device.provider}) failed:`, message)
    await db
      .update(sensorDevices)
      .set({ lastError: message })
      .where(eq(sensorDevices.id, device.id))
  }
}

/**
 * Poll all non-manual devices and evaluate sensor thresholds.
 * Creates sensor_alert notifications with 4-hour cool-down per (tentId, metric).
 * Invoked by POST /api/internal/poll-sensors.
 */
export async function pollAndAlert(): Promise<{ processed: number; alerts: number }> {
  const devices = await db.select().from(sensorDevices)
  const pollable = devices.filter((d) => d.provider !== 'manual')

  let alerts = 0

  for (const device of pollable) {
    await pollOnce(device).catch((err: unknown) => {
      console.error(`[sensor-poll] Unexpected error for device ${device.id}:`, err)
    })

    // Determine the associated tent for threshold evaluation.
    let tentId: string | null = device.targetTentId ?? null
    let userId: string | null = null

    if (!tentId && device.targetPlantId) {
      const [plant] = await db
        .select({ tentId: plants.tentId, userId: plants.userId })
        .from(plants)
        .where(eq(plants.id, device.targetPlantId))
        .limit(1)
      tentId = plant?.tentId ?? null
      userId = plant?.userId ?? null
    }

    if (!tentId) continue

    const [tent] = await db
      .select()
      .from(tents)
      .where(eq(tents.id, tentId))
      .limit(1)

    if (!tent) continue
    if (!userId) userId = tent.userId

    // Evaluate humidity and temperature thresholds.
    const checks = [
      { metric: 'humidity' as const, target: tent.humidityTargetPct, tolerance: tent.humidityTolerancePct },
      { metric: 'temperature' as const, target: tent.tempTargetC, tolerance: tent.tempToleranceC },
    ]

    for (const { metric, target, tolerance } of checks) {
      if (!target || !tolerance) continue

      const [latest] = await db
        .select({ value: sensorReadings.value })
        .from(sensorReadings)
        .where(
          and(
            eq(sensorReadings.sensorDeviceId, device.id),
            eq(sensorReadings.metric, metric),
          ),
        )
        .orderBy(desc(sensorReadings.recordedAt))
        .limit(1)

      if (!latest) continue

      const value = parseFloat(latest.value)
      const targetNum = parseFloat(target)
      const toleranceNum = parseFloat(tolerance)

      if (Math.abs(value - targetNum) <= toleranceNum) continue

      // Reading is out of range — apply 4h cool-down.
      const channelKey = `sensor_alert:${tentId}:${metric}`

      const [recentNotif] = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.channelKey, channelKey),
            gt(notifications.createdAt, sql`now() - interval '4 hours'`),
          ),
        )
        .limit(1)

      if (recentNotif) continue

      const metricLabel = metric === 'humidity' ? 'Humidity' : 'Temperature'
      const unit = metric === 'humidity' ? '%' : '°C'
      const title = `Sensor alert: ${metricLabel.toLowerCase()} out of range`
      const body = `${metricLabel} is ${value}${unit} (target ${targetNum}${unit} ± ${toleranceNum})`

      const notifResult = await createNotification({
        userId,
        type: 'sensor_alert',
        title,
        body,
        referenceId: tentId,
        referenceType: 'tent',
        channelKey,
      })

      if (notifResult.success) {
        alerts++
        await sendPushToUser(userId, {
          type: 'sensor_alert',
          title,
          body,
          data: { notificationId: notifResult.data.id, referenceId: tentId, referenceType: 'tent' },
        })
      }
    }
  }

  return { processed: pollable.length, alerts }
}

/**
 * Delete sensor readings older than 90 days. Invoked by POST /api/internal/cleanup.
 */
export async function cleanupOldReadings(): Promise<void> {
  const cutoff = sql`now() - interval '90 days'`
  await db
    .delete(sensorReadings)
    .where(lt(sensorReadings.recordedAt, cutoff as unknown as Date))
  console.log('[sensor-poll] Old readings cleanup complete')
}
