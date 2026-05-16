import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

vi.mock('@/lib/pdf/plant-report', () => ({
  generatePlantPDF: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { PlantPDFButton } from '@/components/export/PlantPDFButton'
import { generatePlantPDF } from '@/lib/pdf/plant-report'

const mockGenerate = generatePlantPDF as ReturnType<typeof vi.fn>

beforeEach(() => { mockGenerate.mockReset().mockResolvedValue(undefined) })

const plant = {
  id: 'p-1',
  name: 'Blue Dream',
  strainName: 'Blue Dream OG',
  strainType: 'hybrid',
  growthStage: 'vegetative',
  healthStatus: 'healthy',
  createdAt: '2026-01-01T00:00:00Z',
}

const careLogs = [
  { id: 'cl-1', logType: 'water', loggedAt: '2026-02-01T10:00:00Z', amount: '500', unit: 'ml', notes: null },
  { id: 'cl-2', logType: 'feed', loggedAt: '2026-02-02T10:00:00Z', amount: '2', unit: 'tsp', notes: 'CalMag' },
]

const growthMeasurements = [
  { id: 'g-1', metric: 'height_cm', value: '25.5', recordedAt: '2026-02-01T10:00:00Z' },
]

describe('PlantPDFButton', () => {
  it('renders a button with accessible label', () => {
    render(<PlantPDFButton plant={plant} />)
    expect(screen.getByRole('button', { name: /download plant pdf/i })).toBeInTheDocument()
  })

  it('is not disabled in idle state', () => {
    render(<PlantPDFButton plant={plant} />)
    expect(screen.getByRole('button')).not.toBeDisabled()
  })

  it('calls generatePlantPDF with the plant, careLogs, and growthMeasurements props', async () => {
    mockGenerate.mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    render(<PlantPDFButton plant={plant} careLogs={careLogs} growthMeasurements={growthMeasurements} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => expect(mockGenerate).toHaveBeenCalledOnce())
    expect(mockGenerate).toHaveBeenCalledWith(plant, careLogs, growthMeasurements)
  })

  it('defaults to empty arrays when careLogs and growthMeasurements are omitted', async () => {
    mockGenerate.mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    render(<PlantPDFButton plant={plant} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => expect(mockGenerate).toHaveBeenCalledOnce())
    expect(mockGenerate).toHaveBeenCalledWith(plant, [], [])
  })

  it('shows loading state while generating', async () => {
    let resolve!: () => void
    mockGenerate.mockReturnValueOnce(new Promise<void>((r) => { resolve = r }))

    const user = userEvent.setup()
    render(<PlantPDFButton plant={plant} />)
    await user.click(screen.getByRole('button'))

    await waitFor(() => expect(screen.getByRole('button')).toBeDisabled())

    resolve()
    await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled())
  })
})
