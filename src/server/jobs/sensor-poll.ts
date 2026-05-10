/**
 * GrowLab Sensor Polling Job
 *
 * Polls cloud sensor APIs on a 5-minute interval (±30s jitter) and
 * stores readings in sensor_readings.
 *
 * Backoff policy on consecutive errors (simplified):
 *   Any error → skip device for 1 min before retrying
 *
 * Retention: readings older than 90 days are cleaned up nightly.
 *
 * F5 (Master Plan §5 F5).
 */

import { eq, lt, sql } from 'drizzle-orm'
import { db } from '@/server/db'
import { sensorDevices, type SensorDevice } from '@/server/db/schema/sensor-devices'
import { sensorReadings } from '@/server/db/schema/sensor-readings'
import { decryptApiKey } from '@/server/lib/crypto'
import { getProvider } from '@/server/integrations/provider-factory'
import { nanoid } from 'nanoid'

const POLL_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes
const JITTER_MS = 30 * 1000 // ±30 seconds

const BACKOFF_MINUTES = [1, 5, 15, 60]

function getBackoffMs(consecutiveErrors: number): number {
  const idx = Math.min(consecutiveErrors - 1, BACKOFF_MINUTES.length - 1)
  const minutes = BACKOFF_MINUTES[idx] ?? 60
  return minutes * 60 * 1000
}

/**
 * Poll a single device once and insert any readings into sensor_readings.
 * Updates last_poll_at on success or last_error on failure.
 */
export async function pollOnce(device: SensorDevice): Promise<void> {
  // Manual devices have no API to poll
  if (device.provider === 'manual') return

  // Cannot poll without an encrypted key
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
 * Start the background polling job. Polls all non-manual devices every
 * ~5 minutes. Should only be called from the server entry point in non-test
 * environments.
 */
export function startPollingJob(): void {
  const jitter = () => Math.floor(Math.random() * JITTER_MS * 2) - JITTER_MS

  const runPoll = async () => {
    try {
      const devices = await db.select().from(sensorDevices)
      const now = Date.now()

      const toPoll = devices.filter((device) => {
        if (device.provider === 'manual') return false
        // Honour 1-minute backoff for any device with a recorded error
        if (device.lastError && device.lastPollAt) {
          const backoff = getBackoffMs(1)
          const elapsed = now - new Date(device.lastPollAt).getTime()
          if (elapsed < backoff) return false
        }
        return true
      })

      // Bounded concurrency: await all polls together instead of fire-and-forget
      await Promise.allSettled(
        toPoll.map((device) =>
          pollOnce(device).catch((err: unknown) => {
            console.error(`[sensor-poll] Unexpected error for device ${device.id}:`, err)
          }),
        ),
      )
    } catch (err) {
      console.error('[sensor-poll] Failed to load devices:', err)
    }
  }

  // Recursive setTimeout: the next poll is scheduled only after the current one
  // completes, preventing overlap and honouring the intended ~5-min cadence.
  const scheduleNext = () => {
    const delay = Math.max(0, POLL_INTERVAL_MS + jitter())
    setTimeout(() => void runPoll().then(scheduleNext), delay)
  }

  // Initial poll after a short startup delay, then keep scheduling
  setTimeout(() => void runPoll().then(scheduleNext), 10_000)

  console.log('[sensor-poll] Polling job started (interval: ~5 min)')
}

/**
 * Delete sensor readings older than 90 days. Intended to run nightly.
 */
export async function cleanupOldReadings(): Promise<void> {
  const cutoff = sql`now() - interval '90 days'`
  await db
    .delete(sensorReadings)
    .where(lt(sensorReadings.recordedAt, cutoff as unknown as Date))
  console.log('[sensor-poll] Old readings cleanup complete')
}
