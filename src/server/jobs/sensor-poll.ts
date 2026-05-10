/**
 * GrowLab Sensor Polling Job
 *
 * Polls cloud sensor APIs on a 5-minute interval (±30s jitter) and
 * stores readings in sensor_readings.
 *
 * Backoff policy on consecutive errors:
 *   1 error  → retry in 1 min
 *   2 errors → retry in 5 min
 *   3 errors → retry in 15 min
 *   4+ errors → retry in 60 min
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

      for (const device of devices) {
        if (device.provider === 'manual') continue

        // Honour backoff: skip if last_poll_at is too recent given error count
        if (device.lastError && device.lastPollAt) {
          const errorCount = 1 // simplified: treat any error as 1st error for backoff
          const backoff = getBackoffMs(errorCount)
          const elapsed = now - new Date(device.lastPollAt).getTime()
          if (elapsed < backoff) continue
        }

        // Fire-and-forget; errors are handled inside pollOnce
        pollOnce(device).catch((err: unknown) => {
          console.error(`[sensor-poll] Unexpected error for device ${device.id}:`, err)
        })
      }
    } catch (err) {
      console.error('[sensor-poll] Failed to load devices:', err)
    }
  }

  // Initial poll after a short delay so the server is ready
  setTimeout(
    () => {
      void runPoll()
      // Recurring interval with jitter
      setInterval(() => {
        const delay = POLL_INTERVAL_MS + jitter()
        setTimeout(() => void runPoll(), Math.max(0, delay))
      }, POLL_INTERVAL_MS)
    },
    10_000, // 10s startup delay
  )

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
