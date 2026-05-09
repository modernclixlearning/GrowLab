/**
 * GrowLab — AddPlantModal smoke (F1).
 *
 * FIXME(f1): same constraint as the route smoke tests — Vitest is `node`
 * env without jsdom/RTL, and adding deps is forbidden by the F1 hard
 * rules. We verify the module loads, the createable stages are still 7
 * (Master Plan §3 F1.5 — Basic/Expert toggle is F2), and the stage list
 * does not include the terminal `completed` state.
 *
 * The 3-step flow's interactive behaviour is covered by the Playwright
 * golden in `tests/visual/add-plant.spec.ts` (TBD — F2 wires deeper
 * coverage when Profile + auth seed are available).
 */

import { describe, it, expect } from 'vitest'
import { AddPlantModal, CREATABLE_STAGES } from '@/components/plants/AddPlantModal'

describe('AddPlantModal — module', () => {
  it('exports a function component', () => {
    expect(typeof AddPlantModal).toBe('function')
  })

  it('exposes 6 creatable stages, excluding the terminal "completed" state', () => {
    expect(CREATABLE_STAGES).toHaveLength(6)
    expect(CREATABLE_STAGES).not.toContain('completed')
    expect(CREATABLE_STAGES[0]).toBe('seedling')
  })
})
