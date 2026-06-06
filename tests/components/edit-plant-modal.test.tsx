/**
 * GrowLab — EditPlantModal tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import type { Plant } from '@/types/plants'

const mockMutateAsync = vi.fn()

vi.mock('@/lib/hooks/usePlants', () => ({
  useUpdatePlant: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { EditPlantModal } from '@/components/plants/EditPlantModal'

beforeEach(() => {
  mockMutateAsync.mockClear()
})

const mockPlant: Plant = {
  id: 'plant1',
  userId: 'u1',
  name: 'OG Kush #1',
  strainType: 'indica',
  floweringType: 'photoperiod',
  growthStage: 'vegetative',
  stageStartDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  healthStatus: 'healthy',
  photoUrl: null,
  notes: null,
  tentId: null,
  strainTemplateId: null,
  strainName: null,
  stageDurationOverride: null,
  lightSchedule: null,
  heroPhotoUrl: null,
  weekDeltaCache: null,
  weekOfStage: 2,
  totalWeeks: null,
  createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
}

describe('EditPlantModal — rendering', () => {
  it('does not render when isOpen=false', () => {
    const { container } = render(
      <EditPlantModal plant={mockPlant} isOpen={false} onClose={vi.fn()} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders with plant data pre-filled when open', () => {
    render(<EditPlantModal plant={mockPlant} isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByRole('dialog', { name: /edit plant/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/plant name/i)).toHaveValue('OG Kush #1')
  })

  it('renders all strain type buttons', () => {
    render(<EditPlantModal plant={mockPlant} isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: /indica/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sativa/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /hybrid/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /auto/i })).toBeInTheDocument()
  })

  it('renders all health status buttons', () => {
    render(<EditPlantModal plant={mockPlant} isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: /healthy/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /stressed/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sick/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /recovering/i })).toBeInTheDocument()
  })
})

describe('EditPlantModal — validation', () => {
  it('shows an error when name is cleared and Save is clicked', async () => {
    const user = userEvent.setup()
    render(<EditPlantModal plant={mockPlant} isOpen={true} onClose={vi.fn()} />)

    const nameInput = screen.getByLabelText(/plant name/i)
    await user.clear(nameInput)
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(screen.getByRole('alert')).toHaveTextContent('Plant name is required')
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })
})

describe('EditPlantModal — stale state regression', () => {
  it('resets form to plant values after closing with unsaved edits', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const { rerender } = render(
      <EditPlantModal plant={mockPlant} isOpen={true} onClose={onClose} />,
    )

    // Make a dirty edit without saving
    const nameInput = screen.getByLabelText(/plant name/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Unsaved Name')

    // Simulate the parent closing the modal (isOpen=false). The Cancel button
    // calls onClose() and the parent controls isOpen — we mirror that here so
    // the test exercises the actual open/close/reopen cycle, not just a rerender
    // with the same isOpen=true (which would never trigger the reset).
    rerender(<EditPlantModal plant={mockPlant} isOpen={false} onClose={onClose} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    // Reopen — must show the original plant name, not the unsaved edit
    rerender(<EditPlantModal plant={mockPlant} isOpen={true} onClose={onClose} />)
    expect(screen.getByLabelText(/plant name/i)).toHaveValue(mockPlant.name)
  })
})

describe('EditPlantModal — submission', () => {
  it('calls updatePlant with updated name on save', async () => {
    mockMutateAsync.mockResolvedValueOnce({ ...mockPlant, name: 'New Name' })
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<EditPlantModal plant={mockPlant} isOpen={true} onClose={onClose} />)

    const nameInput = screen.getByLabelText(/plant name/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'New Name')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        plantId: 'plant1',
        data: expect.objectContaining({ name: 'New Name' }),
      }),
    )
    expect(onClose).toHaveBeenCalled()
  })
})
