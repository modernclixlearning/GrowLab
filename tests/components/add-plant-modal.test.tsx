/**
 * GrowLab — AddPlantModal (F6e RTL rewrite)
 *
 * Phase F6e: upgraded from F1 module smoke to @testing-library/react
 * render + interaction tests. Retains the CREATABLE_STAGES assertions.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

vi.mock('@/lib/hooks/usePlants', () => ({
  useCreatePlant: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('@/lib/hooks/usePlantPhotos', () => ({
  useUploadPhoto: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useGenerateAiImage: () => ({ mutate: vi.fn(), isPending: false }),
  // UploadZone now reads AI quota via usePlantPhotos (disabled in defer mode).
  usePlantPhotos: () => ({ data: undefined, isLoading: false }),
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { AddPlantModal, CREATABLE_STAGES } from '@/components/plants/AddPlantModal'

describe('AddPlantModal — CREATABLE_STAGES', () => {
  it('exposes 6 creatable stages, excluding the terminal "completed" state', () => {
    expect(CREATABLE_STAGES).toHaveLength(6)
    expect(CREATABLE_STAGES).not.toContain('completed')
    expect(CREATABLE_STAGES[0]).toBe('seedling')
  })
})

describe('AddPlantModal — rendering', () => {
  it('does not render when isOpen=false', () => {
    const { container } = render(<AddPlantModal isOpen={false} onClose={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders Step 1 (Plant Photo) when opened', () => {
    render(<AddPlantModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText('Plant Photo')).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument()
  })

  it('advances to Step 2 (Strain & Name) after clicking Continue', async () => {
    const user = userEvent.setup()
    render(<AddPlantModal isOpen={true} onClose={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getByText('Strain & Name')).toBeInTheDocument()
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
  })

  it('advances to Step 3 (Growth Stage) after filling Step 2 and clicking Continue', async () => {
    const user = userEvent.setup()
    render(<AddPlantModal isOpen={true} onClose={vi.fn()} />)

    // Move to Step 2
    await user.click(screen.getByRole('button', { name: /continue/i }))

    // Fill required fields: name + strainType
    await user.type(screen.getByLabelText(/plant name/i), 'Test Plant')
    await user.click(screen.getByRole('button', { name: /indica/i }))

    // Advance to Step 3
    await user.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getByText('Growth Stage')).toBeInTheDocument()
    expect(screen.getByText('Step 3 of 3')).toBeInTheDocument()
  })
})
