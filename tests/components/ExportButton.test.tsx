import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

vi.mock('@/lib/stores/auth', () => ({
  useAuth: vi.fn().mockReturnValue({ accessToken: 'test-token' }),
}))

vi.mock('@/lib/api/export', () => ({
  downloadExport: vi.fn().mockResolvedValue(undefined),
}))

// Sonner toast mock
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { ExportButton } from '@/components/export/ExportButton'
import { downloadExport } from '@/lib/api/export'

const mockDownload = downloadExport as ReturnType<typeof vi.fn>

describe('ExportButton', () => {
  it('renders in idle state with download icon and label', () => {
    render(<ExportButton />)
    expect(screen.getByRole('button', { name: /export data/i })).toBeInTheDocument()
    expect(screen.getByText(/export data/i)).toBeInTheDocument()
  })

  it('is not disabled in idle state', () => {
    render(<ExportButton />)
    expect(screen.getByRole('button')).not.toBeDisabled()
  })

  it('shows loading state and disables button while downloading', async () => {
    let resolveDownload!: () => void
    mockDownload.mockReturnValueOnce(new Promise<void>((res) => { resolveDownload = res }))

    const user = userEvent.setup()
    render(<ExportButton />)

    await user.click(screen.getByRole('button'))

    // During download: button should be disabled and show loading text
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled()
      expect(screen.getByText(/exporting/i)).toBeInTheDocument()
    })

    resolveDownload()
    // Wait for state to settle after resolution
    await waitFor(() => expect(screen.getByText(/export data/i)).toBeInTheDocument())
  })

  it('calls downloadExport with the access token on click', async () => {
    mockDownload.mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    render(<ExportButton />)
    await user.click(screen.getByRole('button'))
    expect(mockDownload).toHaveBeenCalledWith('test-token')
  })
})
