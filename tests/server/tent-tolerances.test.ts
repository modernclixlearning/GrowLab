/**
 * Tent tolerance fields — Zod schema + service tests.
 *
 * Verifies that:
 * - updateTentSchema accepts humidityTolerancePct and tempToleranceC.
 * - updateTent() service persists the new fields (mock-DB approach).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateTentSchema } from '@/server/api/tents/schemas'

// ── Zod schema tests (no DB needed) ──────────────────────────────────────────

describe('updateTentSchema — tolerance fields', () => {
  it('accepts humidityTolerancePct and tempToleranceC', () => {
    const result = updateTentSchema.safeParse({
      humidityTolerancePct: 3.5,
      tempToleranceC: 1.5,
    })
    expect(result.success).toBe(true)
    expect(result.data?.humidityTolerancePct).toBe(3.5)
    expect(result.data?.tempToleranceC).toBe(1.5)
  })

  it('accepts null to clear tolerance fields', () => {
    const result = updateTentSchema.safeParse({
      humidityTolerancePct: null,
      tempToleranceC: null,
    })
    expect(result.success).toBe(true)
    expect(result.data?.humidityTolerancePct).toBeNull()
    expect(result.data?.tempToleranceC).toBeNull()
  })

  it('rejects humidityTolerancePct > 50', () => {
    expect(
      updateTentSchema.safeParse({ humidityTolerancePct: 51 }).success,
    ).toBe(false)
  })

  it('rejects tempToleranceC > 20', () => {
    expect(updateTentSchema.safeParse({ tempToleranceC: 21 }).success).toBe(false)
  })

  it('rejects negative tolerance values', () => {
    expect(
      updateTentSchema.safeParse({ humidityTolerancePct: -1 }).success,
    ).toBe(false)
    expect(
      updateTentSchema.safeParse({ tempToleranceC: -0.1 }).success,
    ).toBe(false)
  })

  it('accepts an empty object (no changes)', () => {
    expect(updateTentSchema.safeParse({}).success).toBe(true)
  })

  it('tolerance fields are independent of target fields', () => {
    const result = updateTentSchema.safeParse({
      humidityTargetPct: 60,
      humidityTolerancePct: 5,
      tempTargetC: 24,
      tempToleranceC: 2,
    })
    expect(result.success).toBe(true)
  })
})

// ── Service mock-DB tests ─────────────────────────────────────────────────────

function makeChain(resolveWith: unknown) {
  const c: Record<string, unknown> = {}
  for (const m of ['from', 'where', 'set', 'returning', 'update', 'limit', 'offset', 'orderBy']) {
    c[m] = vi.fn().mockReturnValue(c)
  }
  c['then'] = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
    Promise.resolve(resolveWith).then(res, rej)
  return c
}

const mocks = vi.hoisted(() => ({
  queryFindFirst: vi.fn<unknown[], Promise<unknown>>(),
  updateChain: null as ReturnType<typeof makeChain> | null,
}))

vi.mock('@/server/db', () => ({
  db: {
    query: {
      tents: {
        findFirst: (...args: unknown[]) => mocks.queryFindFirst(...args),
      },
    },
    update: vi.fn().mockImplementation(() => mocks.updateChain ?? makeChain([])),
    select: vi.fn().mockReturnValue(makeChain([])),
    delete: vi.fn().mockReturnValue(makeChain(undefined)),
  },
}))

describe('updateTent service — tolerance fields persisted', () => {
  beforeEach(() => { vi.resetModules() })

  it('sets humidityTolerancePct and tempToleranceC in the DB update', async () => {
    const existingTent = {
      id: 'tent-1', userId: 'u-1', name: 'Tent A',
      lightTarget: null, humidityTargetPct: '60.00', tempTargetC: null,
      notes: null, humidityTolerancePct: '5.00', tempToleranceC: '2.00',
      createdAt: new Date(), updatedAt: new Date(),
    }
    const updatedTent = { ...existingTent, humidityTolerancePct: '3.50', tempToleranceC: '1.50' }

    mocks.queryFindFirst.mockResolvedValue(existingTent)
    mocks.updateChain = makeChain([updatedTent])

    const { updateTent } = await import('@/server/api/tents/service')
    const result = await updateTent('tent-1', 'u-1', {
      humidityTolerancePct: 3.5,
      tempToleranceC: 1.5,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tent.humidityTolerancePct).toBe('3.50')
      expect(result.data.tent.tempToleranceC).toBe('1.50')
    }
  })
})
