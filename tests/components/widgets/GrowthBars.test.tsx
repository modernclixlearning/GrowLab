/**
 * GrowLab — GrowthBars unit tests (F6e)
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/hooks/useGrowth', () => ({
  useGrowthMeasurements: vi.fn(),
}))

import { GrowthBars } from '@/components/plants/GrowthBars'
import { useGrowthMeasurements } from '@/lib/hooks/useGrowth'

const mockGrowth = useGrowthMeasurements as ReturnType<typeof vi.fn>

const makeBars = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    weekLabel: `W${i + 1}`,
    value: 50 + i * 10,
    weekDelta: i === 0 ? null : 10,
  }))

describe('GrowthBars', () => {
  it('renders the growth chart when bars are available', () => {
    mockGrowth.mockReturnValue({
      data: { growthBars: makeBars(3), measurements: [] },
      isLoading: false,
    })
    render(<GrowthBars plantId="plant1" />)
    expect(screen.getByRole('img', { name: /weekly growth chart/i })).toBeInTheDocument()
  })

  it('renders the correct number of bar labels', () => {
    mockGrowth.mockReturnValue({
      data: { growthBars: makeBars(3), measurements: [] },
      isLoading: false,
    })
    render(<GrowthBars plantId="plant1" />)
    expect(screen.getByText('W1')).toBeInTheDocument()
    expect(screen.getByText('W2')).toBeInTheDocument()
    expect(screen.getByText('W3')).toBeInTheDocument()
  })

  it('renders empty state when growthBars is empty', () => {
    mockGrowth.mockReturnValue({
      data: { growthBars: [], measurements: [] },
      isLoading: false,
    })
    render(<GrowthBars plantId="plant1" />)
    expect(screen.getByText(/no growth data yet/i)).toBeInTheDocument()
  })
})
