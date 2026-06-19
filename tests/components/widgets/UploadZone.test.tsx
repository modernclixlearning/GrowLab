/**
 * GrowLab — UploadZone unit tests (F6e + F3 issue #26: style + quota)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Hoisted mock handles so individual tests can configure return values.
const mocks = vi.hoisted(() => ({
  generateMutate: vi.fn(),
  uploadMutate:   vi.fn(),
  plantPhotosData: undefined as { aiQuota: { used: number; limit: number; remaining: number } } | undefined,
}))

vi.mock('@/lib/hooks/usePlantPhotos', () => ({
  useUploadPhoto: () => ({ mutate: mocks.uploadMutate, isPending: false }),
  useGenerateAiImage: () => ({ mutate: mocks.generateMutate, isPending: false }),
  usePlantPhotos: () => ({ data: mocks.plantPhotosData }),
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

beforeEach(() => {
  mocks.generateMutate.mockClear()
  mocks.uploadMutate.mockClear()
  mocks.plantPhotosData = undefined
})

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

describe('UploadZone — AI mode (issue #26 F3)', () => {
  function openAiMode() {
    fireEvent.click(screen.getByRole('button', { name: /generate with ai instead/i }))
  }

  it('shows the style selector with all 4 templates in AI mode', () => {
    render(<UploadZone mode="immediate" plantId="p1" stage="seedling" />)
    openAiMode()
    expect(screen.getByRole('radio', { name: 'Photorealistic' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Illustration' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Psychedelic' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Minimal' })).toBeInTheDocument()
  })

  it('passes the selected style to the generate mutation', () => {
    render(<UploadZone mode="immediate" plantId="p1" stage="seedling" />)
    openAiMode()
    fireEvent.click(screen.getByRole('radio', { name: 'Psychedelic' }))
    fireEvent.click(screen.getByRole('button', { name: /^generate$/i }))

    expect(mocks.generateMutate).toHaveBeenCalledTimes(1)
    const vars = mocks.generateMutate.mock.calls[0][0]
    expect(vars).toMatchObject({
      plantId: 'p1',
      stage: 'seedling',
      stagePreset: true,
      style: 'psychedelic',
    })
  })

  it('defaults to photorealistic style when none is changed', () => {
    render(<UploadZone mode="immediate" plantId="p1" stage="seedling" />)
    openAiMode()
    fireEvent.click(screen.getByRole('button', { name: /^generate$/i }))
    expect(mocks.generateMutate.mock.calls[0][0]).toMatchObject({ style: 'photorealistic' })
  })

  it('shows the remaining AI quota indicator', () => {
    mocks.plantPhotosData = { aiQuota: { used: 3, limit: 5, remaining: 2 } }
    render(<UploadZone mode="immediate" plantId="p1" stage="seedling" />)
    openAiMode()
    expect(screen.getByText('2 of 5 AI images left')).toBeInTheDocument()
  })

  it('disables Generate and shows exhausted message when remaining is 0', () => {
    mocks.plantPhotosData = { aiQuota: { used: 5, limit: 5, remaining: 0 } }
    render(<UploadZone mode="immediate" plantId="p1" stage="seedling" />)
    openAiMode()
    expect(screen.getByText('No AI images left')).toBeInTheDocument()
    const generateBtn = screen.getByRole('button', { name: /^generate$/i })
    expect(generateBtn).toBeDisabled()
    fireEvent.click(generateBtn)
    expect(mocks.generateMutate).not.toHaveBeenCalled()
  })
})
