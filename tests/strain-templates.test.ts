/**
 * GrowLab Strain Templates tests (F2)
 *
 * Validates the seed module shape without actually hitting Postgres.
 * The seed file imports `@/server/db` (which throws when
 * `DATABASE_URL` is missing), so we stub the env var before the
 * dynamic import to keep the test hermetic.
 */

import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(() => {
  // Set a syntactically-valid placeholder; we never .end()/.connect().
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test'
  }
})

describe('Strain templates seed module', () => {
  it('exports `seedStrainTemplates` and `runSeed`', async () => {
    const mod = await import('@/server/db/seed/strain-templates')
    expect(typeof mod.seedStrainTemplates).toBe('function')
    expect(typeof mod.runSeed).toBe('function')
  })
})
