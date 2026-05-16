/**
 * GrowLab — TempWidget unit tests (F6e)
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/hooks/useSensors', () => ({
  useLatestReadings: vi.fn(),
}))

import { TempWidget } from '@/components/plants/TempWidget'
import { useLatestReadings } from '@/lib/hooks/useSensors'

const mockReadings = useLatestReadings as ReturnType<typeof vi.fn>

describe('TempWidget', () => {
  it('renders temperature in °C when data is available', () => {
    mockReadings.mockReturnValue({
      data: { temperature: { value: '23.5', metric: 'temperature' } },
      isLoading: false,
    })
    render(<TempWidget plantId="plant1" />)
    expect(screen.getByText('23.5')).toBeInTheDocument()
    expect(screen.getByText('°C')).toBeInTheDocument()
  })

  it('renders temperature in °F when unit="F"', () => {
    mockReadings.mockReturnValue({
      data: { temperature: { value: '20.0', metric: 'temperature' } },
      isLoading: false,
    })
    render(<TempWidget plantId="plant1" unit="F" />)
    // 20°C = 68°F
    expect(screen.getByText('68.0')).toBeInTheDocument()
    expect(screen.getByText('°F')).toBeInTheDocument()
  })

  it('renders "No sensor" message when no reading data', () => {
    mockReadings.mockReturnValue({ data: null, isLoading: false })
    render(<TempWidget plantId="plant1" />)
    expect(screen.getByText(/no sensor/i)).toBeInTheDocument()
  })

  it('is labelled as Temperature reading', () => {
    mockReadings.mockReturnValue({ data: null, isLoading: false })
    render(<TempWidget plantId="plant1" />)
    expect(screen.getByLabelText('Temperature reading')).toBeInTheDocument()
  })
})
