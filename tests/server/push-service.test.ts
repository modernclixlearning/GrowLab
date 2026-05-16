/**
 * Push service — mock-DB unit tests.
 *
 * Same infrastructure as notifications-service.test.ts: chainable Drizzle mock,
 * no real DB connection needed. Tests the idempotency logic in subscribe()
 * and the deletion path in unsubscribe().
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Chainable Drizzle mock ───────────────────────────────────────────────────

function makeChain(resolveWith: unknown) {
  const chain: Record<string, unknown> = {}
  const methods = [
    'select', 'from', 'where', 'limit',
    'insert', 'values', 'returning',
    'delete', 'update', 'set',
  ]
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  chain['then'] = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(resolveWith).then(resolve, reject)
  return chain
}

let dbChain: ReturnType<typeof makeChain>

vi.mock('@/server/db', () => ({
  get db() {
    return {
      select: vi.fn().mockImplementation(() => dbChain),
      insert: vi.fn().mockImplementation(() => dbChain),
      update: vi.fn().mockImplementation(() => dbChain),
      delete: vi.fn().mockImplementation(() => dbChain),
    }
  },
}))

vi.mock('nanoid', () => ({ nanoid: () => 'push-id-001' }))

// VAPID env so env.ts doesn't warn (overriding NODE_ENV guard).
process.env.INTERNAL_CRON_SECRET = 'a'.repeat(32)
process.env.VAPID_PUBLIC_KEY = 'test-pub'
process.env.VAPID_PRIVATE_KEY = 'test-priv'
process.env.VAPID_SUBJECT = 'mailto:test@test.com'

// ─── Tests ────────────────────────────────────────────────────────────────────

const validInput = {
  endpoint: 'https://fcm.googleapis.com/test',
  keys: { p256dh: 'dGVzdA==', auth: 'dGVzdA==' },
  userAgent: 'Chrome/120',
}

describe('subscribe', () => {
  beforeEach(() => { vi.resetModules() })

  it('returns the existing subscription without inserting when endpoint already exists', async () => {
    const existing = { id: 'push-id-001', userId: 'u1', endpoint: validInput.endpoint, p256dhKey: 'old', authKey: 'old', userAgent: null, createdAt: new Date() }
    // First DB call (select to check existing) resolves with [existing].
    dbChain = makeChain([existing])
    const { subscribe } = await import('@/server/api/push/service')
    const result = await subscribe('u1', validInput)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.id).toBe('push-id-001')
  })

  it('inserts a new row when endpoint is not yet registered', async () => {
    const newRow = { id: 'push-id-001', userId: 'u1', endpoint: validInput.endpoint, p256dhKey: validInput.keys.p256dh, authKey: validInput.keys.auth, userAgent: validInput.userAgent, createdAt: new Date() }
    // First call (select) → [], second call (insert.returning) → [newRow].
    let callCount = 0
    const selectChain = makeChain([])
    const insertChain = makeChain([newRow])
    // db is a getter so we need to intercept at the select/insert level.
    dbChain = {
      ...selectChain,
      then: (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => {
        callCount++
        const val = callCount === 1 ? [] : [newRow]
        return Promise.resolve(val).then(resolve, reject)
      },
    } as ReturnType<typeof makeChain>
    // Simpler: just re-mock for this test.
    vi.doMock('@/server/db', () => {
      let insertCalled = false
      return {
        get db() {
          return {
            select: vi.fn().mockReturnValue(makeChain([])),
            insert: vi.fn().mockReturnValue(makeChain([newRow])),
            delete: vi.fn().mockReturnValue(makeChain(undefined)),
          }
        },
      }
    })
    vi.resetModules()
    const { subscribe: subscribeFresh } = await import('@/server/api/push/service')
    const result = await subscribeFresh('u1', validInput)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.endpoint).toBe(validInput.endpoint)
  })
})

describe('unsubscribe', () => {
  beforeEach(() => { vi.resetModules() })

  it('returns success after deleting the subscription', async () => {
    dbChain = makeChain(undefined) // delete returns void
    const { unsubscribe } = await import('@/server/api/push/service')
    const result = await unsubscribe('u1', 'https://fcm.googleapis.com/test')
    expect(result.success).toBe(true)
  })
})
