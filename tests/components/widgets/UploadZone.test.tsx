/**
 * GrowLab — UploadZone unit tests (F6e)
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/lib/hooks/usePlantPhotos', () => ({
  useUploadPhoto: () => ({ mutate: vi.fn(), isPending: false }),
  useGenerateAiImage: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/lib/utils/image', () => ({
  convertToWebP: (f: File) => Promise.resolve(f),
}))

// jsdom doesn't implement URL.createObjectURL/revokeObjectURL
if (!URL.createObjectURL) {
  URL.createObjectURL = vi.fn(() => 'blob:mock-url')
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = vi.fn()
}

import { UploadZone } from '@/components/plants/UploadZone'

describe('UploadZone', () => {
  it('renders idle state with "Drop photo here" text', () => {
    render(<UploadZone mode="defer" onFileSelected={vi.fn()} />)
    expect(screen.getByText('Drop photo here')).toBeInTheDocument()
  })

  it('has role="button" with accessible label', () => {
    render(<UploadZone mode="defer" onFileSelected={vi.fn()} />)
    expect(screen.getByRole('button', { name: /upload photo/i })).toBeInTheDocument()
  })

  it('adds accent border class on dragOver', () => {
    render(<UploadZone mode="defer" onFileSelected={vi.fn()} />)
    const dropZone = screen.getByRole('button', { name: /upload photo/i })
    fireEvent.dragOver(dropZone)
    expect(dropZone.className).toContain('border-accent')
  })

  it('calls onFileSelected when a file is dropped', async () => {
    const onFileSelected = vi.fn()
    render(<UploadZone mode="defer" onFileSelected={onFileSelected} />)
    const dropZone = screen.getByRole('button', { name: /upload photo/i })
    const file = new File(['image data'], 'photo.jpg', { type: 'image/jpeg' })
    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } })
    await waitFor(() => expect(onFileSelected).toHaveBeenCalledWith(file))
  })
})
