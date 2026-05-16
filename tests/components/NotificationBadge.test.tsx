import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

// Mock the hook before importing the component
vi.mock('@/lib/hooks/useNotifications', () => ({
  useUnreadCount: vi.fn(),
}))

import { NotificationBadge } from '@/components/notifications/NotificationBadge'
import { useUnreadCount } from '@/lib/hooks/useNotifications'

const mockUnread = useUnreadCount as ReturnType<typeof vi.fn>

describe('NotificationBadge', () => {
  it('renders a bell icon button', () => {
    mockUnread.mockReturnValue({ data: 0 })
    render(<NotificationBadge />)
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument()
  })

  it('does not show a badge when count is 0', () => {
    mockUnread.mockReturnValue({ data: 0 })
    render(<NotificationBadge />)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('shows the unread count when count > 0', () => {
    mockUnread.mockReturnValue({ data: 3 })
    render(<NotificationBadge />)
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /3 unread/i })).toBeInTheDocument()
  })

  it('shows "9+" when count exceeds 9', () => {
    mockUnread.mockReturnValue({ data: 12 })
    render(<NotificationBadge />)
    expect(screen.getByText('9+')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    mockUnread.mockReturnValue({ data: 1 })
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<NotificationBadge onClick={onClick} />)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
