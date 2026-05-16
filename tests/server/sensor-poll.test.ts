/**
 * pollAndAlert() unit tests — mock-DB approach (no real Postgres).
 *
 * Uses vi.hoisted + vi.mock to intercept @/server/db, notifications service,
 * and push service. The select queue allows each db.select() call inside
 * pollAndAlert() to return controlled data in the exact order they're made.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { pollAndAlert } from '@/server/jobs/sensor-poll'

// ── Hoisted shared state (must be available in vi.mock factories) ─────────────
const mocks = vi.hoisted(() => ({
  selectQueue: [] as unknown[][],
  createNotification: vi.fn<unknown[], Promise<{ success: boolean; data: { id: string } }>>(),
  sendPushToUser: vi.fn<unknown[], Promise<void>>(),
}))

// ── Chainable Drizzle mock ────────────────────────────────────────────────────
function makeChain(resolveWith: unknown) {
  const c: Record<string, unknown> = {}
  for (const m of [
    'from', 'where', 'orderBy', 'limit', 'offset',
    'set', 'values', 'returning', 'update', 'innerJoin',
  ]) {
    c[m] = vi.fn().mockReturnValue(c)
  }
  c['then'] = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
    Promise.resolve(resolveWith).then(res, rej)
  return c
}

vi.mock('@/server/db', () => ({
  db: {
    select: vi.fn().mockImplementation(() => makeChain(mocks.selectQueue.shift() ?? [])),
    insert: vi.fn().mockReturnValue(makeChain([])),
    update: vi.fn().mockReturnValue(makeChain([])),
    delete: vi.fn().mockReturnValue(makeChain(undefined)),
  },
}))

vi.mock('@/server/api/notifications/service', () => ({
  createNotification: (...args: unknown[]) => mocks.createNotification(...args),
}))

vi.mock('@/server/api/push/service', () => ({
  sendPushToUser: (...args: unknown[]) => mocks.sendPushToUser(...args),
}))

// ── Test fixtures ─────────────────────────────────────────────────────────────
// Non-manual device with null apiKeyEncrypted: pollOnce() hits the early-return
// guard ("No API key configured"), does a no-op DB update and returns — no
// real sensor API call, no SENSOR_KEK required. The device DOES pass the
// `provider !== 'manual'` filter, so pollAndAlert() counts it and evaluates
// thresholds against whichever readings the DB mock returns.
const device = {
  id: 'dev-1',
  userId: 'u-1',
  provider: 'govee' as const,
  apiKeyEncrypted: null,     // triggers early-return in pollOnce (no API call)
  label: 'Test sensor',
  targetPlantId: null,
  targetTentId: 'tent-1',
  lastPollAt: null,
  lastError: null,
  createdAt: new Date(),
}

const tent = {
  id: 'tent-1',
  userId: 'u-1',
  name: 'Tent A',
  lightTarget: null,
  notes: null,
  humidityTargetPct: '60.00',
  humidityTolerancePct: '5.00',
  tempTargetC: null,      // not configured → temperature check skipped
  tempToleranceC: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const outOfRangeReading = {
  value: '70.00', // |70-60|=10 > 5 → out of range
}

const inRangeReading = {
  value: '62.00', // |62-60|=2 ≤ 5 → within tolerance
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('pollAndAlert', () => {
  beforeEach(() => {
    mocks.selectQueue.length = 0
    mocks.createNotification
      .mockReset()
      .mockResolvedValue({ success: true, data: { id: 'n-1' } })
    mocks.sendPushToUser.mockReset().mockResolvedValue(undefined)
  })

  it('creates a sensor_alert notification when humidity is out of range', async () => {
    // SELECT sequence for one device with targetTentId:
    // 1. sensorDevices → [device]
    // 2. tents → [tent]
    // 3. sensorReadings (latest humidity) → [outOfRangeReading]
    // 4. notifications (cool-down check) → [] → no cool-down → create
    mocks.selectQueue.push([device], [tent], [outOfRangeReading], [])

    const result = await pollAndAlert()

    expect(mocks.createNotification).toHaveBeenCalledOnce()
    expect(mocks.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'sensor_alert',
        userId: 'u-1',
        channelKey: 'sensor_alert:tent-1:humidity',
        referenceId: 'tent-1',
        referenceType: 'tent',
      }),
    )
    expect(result.processed).toBe(1)
    expect(result.alerts).toBe(1)
  })

  it('does NOT create a notification when cool-down is active (recent alert < 4h)', async () => {
    // notifications query returns an existing recent notification → cool-down
    mocks.selectQueue.push(
      [device],
      [tent],
      [outOfRangeReading],
      [{ id: 'n-existing' }], // cool-down hit
    )

    const result = await pollAndAlert()

    expect(mocks.createNotification).not.toHaveBeenCalled()
    expect(mocks.sendPushToUser).not.toHaveBeenCalled()
    expect(result.alerts).toBe(0)
  })

  it('does NOT create a notification when reading is within tolerance', async () => {
    // |62 - 60| = 2 ≤ 5 tolerance → no alert
    mocks.selectQueue.push([device], [tent], [inRangeReading])
    // notifications (cool-down) should NOT be queried — no 4th element needed

    const result = await pollAndAlert()

    expect(mocks.createNotification).not.toHaveBeenCalled()
    expect(result.alerts).toBe(0)
  })

  it('skips threshold check entirely when no tent is associated', async () => {
    const deviceNoTent = { ...device, targetTentId: null, targetPlantId: null }
    mocks.selectQueue.push([deviceNoTent])

    const result = await pollAndAlert()

    expect(mocks.createNotification).not.toHaveBeenCalled()
    expect(result.processed).toBe(1)
    expect(result.alerts).toBe(0)
  })

  it('returns processed=0 when there are no non-manual devices', async () => {
    mocks.selectQueue.push([]) // empty device list

    const result = await pollAndAlert()

    expect(mocks.createNotification).not.toHaveBeenCalled()
    expect(result.processed).toBe(0)
    expect(result.alerts).toBe(0)
  })
})
