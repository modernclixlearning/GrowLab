/**
 * POST /api/internal/poll-sensors — route-level tests.
 *
 * Verifies the endpoint delegates to pollAndAlert() and forwards its result.
 * pollAndAlert is mocked; auth middleware is tested by the separate
 * internal-auth.test.ts suite.
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { Hono } from 'hono'

vi.mock('@/server/jobs/sensor-poll', () => ({
  pollAndAlert: vi.fn().mockResolvedValue({ processed: 2, alerts: 1 }),
  cleanupOldReadings: vi.fn().mockResolvedValue(undefined),
  pollOnce: vi.fn(),
}))

vi.mock('@/server/api/notifications/service', () => ({
  purgeNotifications: vi.fn().mockResolvedValue(undefined),
  checkSchedulesDue: vi.fn().mockResolvedValue({ processed: 0, notified: 0 }),
}))

const VALID_SECRET = 'b'.repeat(32)

describe('POST /api/internal/poll-sensors', () => {
  let app: Hono

  beforeAll(async () => {
    process.env.INTERNAL_CRON_SECRET = VALID_SECRET
    vi.resetModules()
    const { internalRoutes } = await import('@/server/routes/internal')
    app = new Hono()
    app.route('/api/internal', internalRoutes)
  })

  afterAll(() => {
    delete process.env.INTERNAL_CRON_SECRET
    vi.resetModules()
  })

  it('returns 401 without token', async () => {
    const res = await app.request('/api/internal/poll-sensors', { method: 'POST' })
    expect(res.status).toBe(401)
  })

  it('returns 200 with processed and alerts when token is valid', async () => {
    const res = await app.request('/api/internal/poll-sensors', {
      method: 'POST',
      headers: { Authorization: `Bearer ${VALID_SECRET}` },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.processed).toBe(2)
    expect(body.alerts).toBe(1)
  })

  it('returns success:true with zero counts when no devices polled', async () => {
    const { pollAndAlert } = await import('@/server/jobs/sensor-poll')
    ;(pollAndAlert as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ processed: 0, alerts: 0 })

    const res = await app.request('/api/internal/poll-sensors', {
      method: 'POST',
      headers: { Authorization: `Bearer ${VALID_SECRET}` },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.processed).toBe(0)
    expect(body.alerts).toBe(0)
  })
})
