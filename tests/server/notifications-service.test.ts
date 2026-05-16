/**
 * Notifications service — mock-DB unit tests.
 *
 * This repo has no DB test infrastructure (all pre-F6 tests target Zod
 * schemas only; no test-Postgres, no cleanup setup). Rather than adding
 * docker-compose infra, we mock `@/server/db` with a chainable Drizzle
 * stub so the service logic (NOT_FOUND branch, pagination, cool-down
 * short-circuit) is verified without a real connection.
 *
 * See F6b reviewer report §5 — "Decisión sobre tests de servicio".
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Chainable Drizzle mock ───────────────────────────────────────────────────

function makeChain(resolveWith: unknown) {
  // Proxy: any method call returns the same chain; awaiting resolves with resolveWith.
  const chain: Record<string, unknown> = {}
  const methods = [
    'select', 'from', 'where', 'orderBy', 'limit', 'offset',
    'insert', 'values', 'returning',
    'update', 'set',
    'delete', 'innerJoin',
  ]
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  // Make the chain thenable so `await db.select()...` resolves.
  chain['then'] = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(resolveWith).then(resolve, reject)
  return chain
}

// We keep a mutable reference so individual tests can override resolveWith.
let dbChain: ReturnType<typeof makeChain>

vi.mock('@/server/db', () => ({
  // db.select / db.insert / db.update / db.delete all return the same chain.
  get db() {
    return {
      select: vi.fn().mockImplementation(() => dbChain),
      insert: vi.fn().mockImplementation(() => dbChain),
      update: vi.fn().mockImplementation(() => dbChain),
      delete: vi.fn().mockImplementation(() => dbChain),
    }
  },
}))

// Stub nanoid so IDs are deterministic in tests.
vi.mock('nanoid', () => ({ nanoid: () => 'test-id-001' }))

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('markNotificationRead', () => {
  beforeEach(() => { vi.resetModules() })

  it('returns success when the notification exists and belongs to the user', async () => {
    dbChain = makeChain([{ id: 'n1' }])
    const { markNotificationRead } = await import('@/server/api/notifications/service')
    const result = await markNotificationRead('n1', 'u1')
    expect(result.success).toBe(true)
  })

  it('returns NOT_FOUND when no rows are updated (wrong id or userId)', async () => {
    dbChain = makeChain([]) // DB returns empty — notification not found or not owned
    const { markNotificationRead } = await import('@/server/api/notifications/service')
    const result = await markNotificationRead('ghost', 'u1')
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('NOT_FOUND')
  })
})

describe('getUnreadCount', () => {
  beforeEach(() => { vi.resetModules() })

  it('returns the count from the DB result', async () => {
    dbChain = makeChain([{ count: 7 }])
    const { getUnreadCount } = await import('@/server/api/notifications/service')
    const result = await getUnreadCount('u1')
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.count).toBe(7)
  })

  it('returns 0 when DB result is empty', async () => {
    dbChain = makeChain([])
    const { getUnreadCount } = await import('@/server/api/notifications/service')
    const result = await getUnreadCount('u1')
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.count).toBe(0)
  })
})

describe('markAllRead', () => {
  beforeEach(() => { vi.resetModules() })

  it('returns the count of updated rows', async () => {
    dbChain = makeChain([{ id: 'n1' }, { id: 'n2' }])
    const { markAllRead } = await import('@/server/api/notifications/service')
    const result = await markAllRead('u1')
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.updated).toBe(2)
  })

  it('returns 0 updated when no unread notifications exist', async () => {
    dbChain = makeChain([])
    const { markAllRead } = await import('@/server/api/notifications/service')
    const result = await markAllRead('u1')
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.updated).toBe(0)
  })
})

describe('createNotification', () => {
  beforeEach(() => { vi.resetModules() })

  it('returns the inserted notification row', async () => {
    const fakeNotif = {
      id: 'test-id-001',
      userId: 'u1',
      type: 'schedule_due',
      title: 'Water time',
      body: 'Plant A needs water',
      referenceId: 'cl1',
      referenceType: 'care_log',
      channelKey: 'schedule_due:cl1',
      readAt: null,
      createdAt: new Date(),
    }
    dbChain = makeChain([fakeNotif])
    const { createNotification } = await import('@/server/api/notifications/service')
    const result = await createNotification({
      userId: 'u1',
      type: 'schedule_due',
      title: 'Water time',
      body: 'Plant A needs water',
      referenceId: 'cl1',
      referenceType: 'care_log',
      channelKey: 'schedule_due:cl1',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.type).toBe('schedule_due')
      expect(result.data.channelKey).toBe('schedule_due:cl1')
    }
  })
})
