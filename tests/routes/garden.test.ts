/**
 * GrowLab — Garden route smoke tests.
 *
 * FIXME(f1): the original F1 brief asked for a render-time smoke test that
 * mounts the route with mock plants and verifies search + StagePills filter
 * the visible list. The repo currently has Vitest configured with
 * `environment: 'node'` and no `@testing-library/react` / `jsdom` deps. The
 * F1 hard rule "no instalar dependencias nuevas" forbids pulling those in,
 * so we instead exercise the pure `filterPlants` helper that owns the
 * filtering pipeline used by the route. The structural coverage of the
 * rendered Garden screen is delegated to the Playwright golden in
 * `tests/visual/garden.spec.ts` (also added in F1).
 */

import { describe, it, expect } from 'vitest'
import { filterPlants } from '@/routes/garden'
import type { Plant, GrowthStage, StrainType } from '@/types/plants'

function makePlant(
  id: string,
  name: string,
  strainType: StrainType,
  growthStage: GrowthStage,
): Plant {
  return {
    id,
    userId: 'user-1',
    name,
    strainType,
    growthStage,
    stageStartDate: '2026-01-01T00:00:00.000Z',
    healthStatus: 'healthy',
    photoUrl: null,
    notes: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

const PLANTS: Plant[] = [
  makePlant('1', 'OG Kush #1', 'indica', 'seedling'),
  makePlant('2', 'Blue Dream', 'hybrid', 'vegetative'),
  makePlant('3', 'Northern Lights', 'indica', 'flowering'),
  makePlant('4', 'Sour Diesel', 'sativa', 'flowering'),
  makePlant('5', 'Auto Pilot', 'auto', 'curing'),
]

describe('Garden — filterPlants', () => {
  it('returns all plants when no filter and empty search', () => {
    expect(filterPlants(PLANTS, '', 'all')).toHaveLength(PLANTS.length)
  })

  it('filters by stage', () => {
    const flowering = filterPlants(PLANTS, '', 'flowering')
    expect(flowering).toHaveLength(2)
    expect(flowering.every((p) => p.growthStage === 'flowering')).toBe(true)
  })

  it('searches by plant name (case-insensitive, substring)', () => {
    const result = filterPlants(PLANTS, 'kush', 'all')
    expect(result.map((p) => p.id)).toEqual(['1'])
  })

  it('searches by strain label (e.g. "Sativa")', () => {
    const result = filterPlants(PLANTS, 'sativa', 'all')
    expect(result.map((p) => p.id)).toEqual(['4'])
  })

  it('combines search and stage filter (AND semantics)', () => {
    const result = filterPlants(PLANTS, 'lights', 'flowering')
    expect(result.map((p) => p.id)).toEqual(['3'])
  })

  it('returns empty array when search has no matches', () => {
    expect(filterPlants(PLANTS, 'nonexistent', 'all')).toEqual([])
  })

  it('ignores leading/trailing whitespace in the search', () => {
    expect(filterPlants(PLANTS, '   blue   ', 'all').map((p) => p.id)).toEqual(['2'])
  })
})
