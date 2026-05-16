/**
 * GET /api/export — route-level auth and content-type tests.
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { Hono } from 'hono'

vi.mock('@/server/api/export/service', () => ({
  buildPlantsCSV: vi.fn().mockResolvedValue('id,name\np-1,Rose'),
  buildCareLogsCSV: vi.fn().mockResolvedValue('id,logType\ncl-1,water'),
  buildSensorReadingsCSV: vi.fn().mockResolvedValue('id,metric\nr-1,humidity'),
  buildGrowthCSV: vi.fn().mockResolvedValue('id,metric\ng-1,height_cm'),
  buildPhotosMetadataCSV: vi.fn().mockResolvedValue('id,url\nph-1,https://example.com'),
  buildExportZip: vi.fn().mockReturnValue(new Uint8Array([0x50, 0x4b, 0x05, 0x06, ...new Array(18).fill(0)])),
}))

// Mock auth middleware — always returns authenticated for token 'valid-token'
vi.mock('@/server/lib/auth-middleware', () => ({
  authenticate: vi.fn().mockImplementation(async (req: Request) => {
    const header = req.headers.get('authorization')
    if (header === 'Bearer valid-token') {
      return { authenticated: true, user: { userId: 'u-1', email: 'test@test.com', subscriptionTier: 'free' } }
    }
    return {
      authenticated: false,
      response: Response.json({ success: false, error: { code: 'MISSING_TOKEN', message: 'Unauthorized' } }, { status: 401 }),
    }
  }),
}))

describe('GET /api/export', () => {
  let app: Hono

  beforeAll(async () => {
    const { exportRoutes } = await import('@/server/routes/export')
    app = new Hono()
    app.route('/api/export', exportRoutes)
  })

  afterAll(() => { vi.resetModules() })

  it('returns 401 without Authorization header', async () => {
    const res = await app.request('/api/export', { method: 'GET' })
    expect(res.status).toBe(401)
  })

  it('returns 401 with wrong token', async () => {
    const res = await app.request('/api/export', {
      method: 'GET',
      headers: { Authorization: 'Bearer wrong' },
    })
    expect(res.status).toBe(401)
  })

  it('returns 200 with Content-Type application/zip when authenticated', async () => {
    const res = await app.request('/api/export', {
      method: 'GET',
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/zip')
  })

  it('includes Content-Disposition attachment header', async () => {
    const res = await app.request('/api/export', {
      method: 'GET',
      headers: { Authorization: 'Bearer valid-token' },
    })
    const disposition = res.headers.get('content-disposition') ?? ''
    expect(disposition).toContain('attachment')
    expect(disposition).toContain('growlab-export-')
    expect(disposition).toContain('.zip')
  })
})
