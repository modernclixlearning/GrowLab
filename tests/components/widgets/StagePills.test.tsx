/**
 * GrowLab — StagePills unit tests (F6e)
 *
 * Pure props-based component — no hooks to mock.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { StagePills } from '@/components/plants/StagePills'

describe('StagePills — expert mode (default)', () => {
  it('renders a tablist with "All" plus 7 stage pills (8 total)', () => {
    render(<StagePills selected="all" onChange={vi.fn()} stageMode="expert" />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(8) // All + 7 stages
  })

  it('renders the "All" pill', () => {
    render(<StagePills selected="all" onChange={vi.fn()} stageMode="expert" />)
    expect(screen.getByRole('tab', { name: /^all$/i })).toBeInTheDocument()
  })

  it('marks the selected pill as aria-selected=true', () => {
    render(<StagePills selected="vegetative" onChange={vi.fn()} stageMode="expert" />)
    expect(screen.getByRole('tab', { name: /vegetative/i })).toHaveAttribute('aria-selected', 'true')
  })

  it('marks non-selected pills as aria-selected=false', () => {
    render(<StagePills selected="all" onChange={vi.fn()} stageMode="expert" />)
    const seedlingTab = screen.getByRole('tab', { name: /seedling/i })
    expect(seedlingTab).toHaveAttribute('aria-selected', 'false')
  })

  it('calls onChange when a pill is clicked', async () => {
    const onChange = vi.fn()
    render(<StagePills selected="all" onChange={onChange} stageMode="expert" />)
    screen.getByRole('tab', { name: /flowering/i }).click()
    expect(onChange).toHaveBeenCalledWith('flowering')
  })
})

describe('StagePills — basic mode', () => {
  it('renders "All" + 4 basic stage pills (5 total)', () => {
    render(<StagePills selected="all" onChange={vi.fn()} stageMode="basic" />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(5) // All + 4 basic buckets
  })
})
