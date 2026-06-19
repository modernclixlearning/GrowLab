/**
 * GrowLab — #26 listPhotos aiQuota computation (REG-2)
 *
 * Verifies the server-authoritative aiQuota block: limit per tier, used =
 * count of sourceType 'ai', and remaining clamped to >= 0. Mocks the DB so
 * no connection is required (mirrors notifications-service.test.ts pattern).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Chainable Drizzle mock: each db.select() resolves with the next queued value.
function makeChain(resolveWith: unknown) {
  const chain: Record<string, unknown> = {}
  for (const m of ['from', 'where', 'orderBy', 'limit']) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  chain['then'] = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(resolveWith).then(resolve, reject)
  return chain
}

let selectQueue: unknown[] = []

vi.mock('@/server/db', () => ({
  get db() {
    return { select: vi.fn().mockImplementation(() => makeChain(selectQueue.shift())) }
  },
}))

import { listPhotos } from '@/server/api/uploads/service'

const OWNER = [{ id: 'p1', userId: 'u1' }]
const aiPhoto = { sourceType: 'ai' }
const uploadPhoto = { sourceType: 'upload' }

beforeEach(() => { selectQueue = [] })

describe('listPhotos — aiQuota', () => {
  it('expert tier: limit 5, used 2, remaining 3', async () => {
    selectQueue = [OWNER, [aiPhoto, uploadPhoto, aiPhoto, uploadPhoto]]
    const r = await listPhotos('p1', 'u1', 'expert')
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.data.aiQuota).toEqual({ used: 2, limit: 5, remaining: 3 })
  })

  it('basic tier: limit 1, used 1, remaining 0', async () => {
    selectQueue = [OWNER, [aiPhoto, uploadPhoto]]
    const r = await listPhotos('p1', 'u1', 'basic')
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.data.aiQuota).toEqual({ used: 1, limit: 1, remaining: 0 })
  })

  it('clamps remaining to 0 when used exceeds the limit', async () => {
    selectQueue = [OWNER, [aiPhoto, aiPhoto]]
    const r = await listPhotos('p1', 'u1', 'basic')
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.data.aiQuota.remaining).toBe(0)
    expect(r.data.aiQuota.used).toBe(2)
  })

  it('no AI photos: full quota remaining', async () => {
    selectQueue = [OWNER, [uploadPhoto, uploadPhoto]]
    const r = await listPhotos('p1', 'u1', 'expert')
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.data.aiQuota).toEqual({ used: 0, limit: 5, remaining: 5 })
  })

  it('unknown tier falls back to basic limit', async () => {
    selectQueue = [OWNER, []]
    const r = await listPhotos('p1', 'u1', 'enterprise')
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.data.aiQuota.limit).toBe(1)
  })
})
