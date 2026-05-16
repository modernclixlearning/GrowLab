/**
 * GrowLab — HumidityWidget unit tests (F6e)
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/hooks/useSensors', () => ({
  useLatestReadings: vi.fn(),
}))

import { HumidityWidget } from '@/components/plants/HumidityWidget'
import { useLatestReadings } from '@/lib/hooks/useSensors'

const mockReadings = useLatestReadings as ReturnType<typeof vi.fn>

describe('HumidityWidget', () => {
  it('renders humidity percentage when data is available', () => {
    mockReadings.mockReturnValue({
      data: { humidity: { value: '55.0', metric: 'humidity' } },
      isLoading: false,
    })
    render(<HumidityWidget plantId="plant1" />)
    expect(screen.getByText('55')).toBeInTheDocument()
    expect(screen.getByText('%')).toBeInTheDocument()
  })

  it('renders "No sensor" message when no reading data', () => {
    mockReadings.mockReturnValue({ data: null, isLoading: false })
    render(<HumidityWidget plantId="plant1" />)
    expect(screen.getByText(/no sensor/i)).toBeInTheDocument()
  })

  it('renders "No sensor" when data exists but humidity key is missing', () => {
    mockReadings.mockReturnValue({ data: {}, isLoading: false })
    render(<HumidityWidget plantId="plant1" />)
    expect(screen.getByText(/no sensor/i)).toBeInTheDocument()
  })

  it('is labelled as Humidity reading', () => {
    mockReadings.mockReturnValue({ data: null, isLoading: false })
    render(<HumidityWidget plantId="plant1" />)
    expect(screen.getByLabelText('Humidity reading')).toBeInTheDocument()
  })
})
