import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { Hono } from 'hono'

// Mock DB-dependent modules used by /cleanup so tests run without DATABASE_URL
vi.mock('@/server/api/notifications/service', () => ({
  purgeNotifications: vi.fn().mockResolvedValue(undefined),
  checkSchedulesDue: vi.fn().mockResolvedValue({ processed: 0, notified: 0 }),
}))
vi.mock('@/server/jobs/sensor-poll', () => ({
  cleanupOldReadings: vi.fn().mockResolvedValue(undefined),
  startPollingJob: vi.fn(),
  pollOnce: vi.fn(),
}))

const VALID_SECRET = 'a'.repeat(32)

describe('Internal API — bearer auth', () => {
  let testApp: Hono

  beforeAll(async () => {
    process.env.INTERNAL_CRON_SECRET = VALID_SECRET
    vi.resetModules()
    const { internalRoutes } = await import('@/server/routes/internal')
    testApp = new Hono()
    testApp.route('/api/internal', internalRoutes)
  })

  afterAll(() => {
    delete process.env.INTERNAL_CRON_SECRET
    vi.resetModules()
  })

  const endpoints = [
    '/api/internal/poll-sensors',
    '/api/internal/check-schedules',
    '/api/internal/cleanup',
  ] as const

  for (const endpoint of endpoints) {
    describe(endpoint, () => {
      it('returns 401 without Authorization header', async () => {
        const res = await testApp.request(endpoint, { method: 'POST' })
        expect(res.status).toBe(401)
        const body = await res.json()
        expect(body.success).toBe(false)
      })

      it('returns 401 with wrong token', async () => {
        const res = await testApp.request(endpoint, {
          method: 'POST',
          headers: { Authorization: 'Bearer wrong-token-that-is-not-valid' },
        })
        expect(res.status).toBe(401)
        const body = await res.json()
        expect(body.success).toBe(false)
      })

      it('returns 200 with correct token', async () => {
        const res = await testApp.request(endpoint, {
          method: 'POST',
          headers: { Authorization: `Bearer ${VALID_SECRET}` },
        })
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.success).toBe(true)
      })
    })
  }
})
