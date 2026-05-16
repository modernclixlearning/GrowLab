/**
 * GrowLab — LightCyclePill unit tests (F6e)
 *
 * Pure props-based component — no hooks to mock.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { LightCyclePill } from '@/components/plants/LightCyclePill'

describe('LightCyclePill', () => {
  it('renders null when lightSchedule is null', () => {
    const { container } = render(
      <LightCyclePill lightSchedule={null} stageMode="expert" />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders null when stageMode is "basic" even with a schedule', () => {
    const { container } = render(
      <LightCyclePill lightSchedule="18/6" stageMode="basic" />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the light schedule pill in expert mode', () => {
    render(<LightCyclePill lightSchedule="18/6" stageMode="expert" />)
    expect(screen.getByLabelText('Light cycle: 18/6')).toBeInTheDocument()
    expect(screen.getByText(/18\/6/i)).toBeInTheDocument()
  })

  it('renders the light schedule pill for 12/12', () => {
    render(<LightCyclePill lightSchedule="12/12" stageMode="expert" />)
    expect(screen.getByLabelText('Light cycle: 12/12')).toBeInTheDocument()
  })
})
