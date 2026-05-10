/**
 * GrowLab — Garden route smoke tests.
 *
 * F1 brief asked for a render-time smoke test that mounts the route with
 * mock plants and verifies search + StagePills filter the visible list.
 * The repo currently has Vitest configured with `environment: 'node'`
 * and no `@testing-library/react` / `jsdom` deps. The "no install" rule
 * (F1/F2) forbids pulling those in, so we exercise the pure
 * `filterPlants` helper that owns the filtering pipeline. Structural
 * coverage of the rendered Garden lives in
 * `tests/visual/garden.spec.ts` (Playwright).
 *
 * F2 update: the helper signature gained a `stageMode` parameter so the
 * filter pipeline can compare against the Basic-bucket mapping. New
 * cases below cover the mode-aware behaviour (issue 003).
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
    // F2 required fields — all nullable, default to null in fixtures.
    tentId: null,
    strainTemplateId: null,
    strainName: null,
    stageDurationOverride: null,
    lightSchedule: null,
    heroPhotoUrl: null,
    weekDeltaCache: null,
    weekOfStage: 1,
    totalWeeks: null,
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
  makePlant('6', 'Harvest A', 'indica', 'harvesting'),
  makePlant('7', 'Drying B', 'sativa', 'drying'),
  makePlant('8', 'Done C', 'hybrid', 'completed'),
]

describe('Garden — filterPlants (Expert mode)', () => {
  it('returns all plants when no filter and empty search', () => {
    expect(filterPlants(PLANTS, '', 'all', 'expert')).toHaveLength(PLANTS.length)
  })

  it('filters by stage', () => {
    const flowering = filterPlants(PLANTS, '', 'flowering', 'expert')
    expect(flowering).toHaveLength(2)
    expect(flowering.every((p) => p.growthStage === 'flowering')).toBe(true)
  })

  it('searches by plant name (case-insensitive, substring)', () => {
    const result = filterPlants(PLANTS, 'kush', 'all', 'expert')
    expect(result.map((p) => p.id)).toEqual(['1'])
  })

  it('searches by strain label (e.g. "Sativa")', () => {
    const result = filterPlants(PLANTS, 'sativa', 'all', 'expert')
    expect(result.map((p) => p.id).sort()).toEqual(['4', '7'])
  })

  it('combines search and stage filter (AND semantics)', () => {
    const result = filterPlants(PLANTS, 'lights', 'flowering', 'expert')
    expect(result.map((p) => p.id)).toEqual(['3'])
  })

  it('returns empty array when search has no matches', () => {
    expect(filterPlants(PLANTS, 'nonexistent', 'all', 'expert')).toEqual([])
  })

  it('ignores leading/trailing whitespace in the search', () => {
    expect(
      filterPlants(PLANTS, '   blue   ', 'all', 'expert').map((p) => p.id),
    ).toEqual(['2'])
  })
})

describe('Garden — filterPlants (Basic mode, issue 003)', () => {
  it('"all" returns every plant regardless of mode', () => {
    expect(filterPlants(PLANTS, '', 'all', 'basic')).toHaveLength(PLANTS.length)
  })

  it('"flower" matches only flowering plants', () => {
    const result = filterPlants(PLANTS, '', 'flower', 'basic')
    expect(result.map((p) => p.id).sort()).toEqual(['3', '4'])
  })

  it('"harvest" buckets harvesting + drying + curing + completed together', () => {
    const result = filterPlants(PLANTS, '', 'harvest', 'basic')
    expect(result.map((p) => p.id).sort()).toEqual(['5', '6', '7', '8'])
  })

  it('"seedling" matches only seedling plants', () => {
    const result = filterPlants(PLANTS, '', 'seedling', 'basic')
    expect(result.map((p) => p.id)).toEqual(['1'])
  })

  it('"veg" matches only vegetative plants', () => {
    const result = filterPlants(PLANTS, '', 'veg', 'basic')
    expect(result.map((p) => p.id)).toEqual(['2'])
  })

  it('combines basic stage filter with search', () => {
    const result = filterPlants(PLANTS, 'auto', 'harvest', 'basic')
    expect(result.map((p) => p.id)).toEqual(['5'])
  })
})
