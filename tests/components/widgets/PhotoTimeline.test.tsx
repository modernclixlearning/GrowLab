/**
 * GrowLab — PhotoTimeline unit tests (F6e)
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/hooks/usePlantPhotos', () => ({
  usePlantPhotos: vi.fn(),
}))

import { PhotoTimeline } from '@/components/plants/PhotoTimeline'
import { usePlantPhotos } from '@/lib/hooks/usePlantPhotos'

const mockPhotos = usePlantPhotos as ReturnType<typeof vi.fn>

const makePhoto = (id: string, stage = 'vegetative') => ({
  id,
  plantId: 'plant1',
  url: `https://cdn.example.com/${id}.jpg`,
  stage,
  sourceType: 'upload',
  createdAt: '2026-04-01T10:00:00Z',
})

describe('PhotoTimeline', () => {
  it('renders null (empty container) when photos list is empty', () => {
    mockPhotos.mockReturnValue({ data: { photos: [] }, isLoading: false })
    const { container } = render(<PhotoTimeline plantId="plant1" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders thumbnails when photos are available', () => {
    const photos = [makePhoto('p1'), makePhoto('p2')]
    mockPhotos.mockReturnValue({ data: { photos }, isLoading: false })
    render(<PhotoTimeline plantId="plant1" />)
    const thumbnails = screen.getAllByRole('button', { name: /view photo/i })
    expect(thumbnails).toHaveLength(2)
  })

  it('renders Photo Timeline section label when photos exist', () => {
    mockPhotos.mockReturnValue({ data: { photos: [makePhoto('p1')] }, isLoading: false })
    render(<PhotoTimeline plantId="plant1" />)
    expect(screen.getByText('Photo Timeline')).toBeInTheDocument()
  })
})
