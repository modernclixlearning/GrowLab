import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

vi.mock('@/lib/hooks/useNotifications', () => ({
  useNotifications: vi.fn(),
  useMarkNotificationRead: vi.fn(),
  useMarkAllRead: vi.fn(),
}))

import { NotificationDrawer } from '@/components/notifications/NotificationDrawer'
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from '@/lib/hooks/useNotifications'

const mockList = useNotifications as ReturnType<typeof vi.fn>
const mockMarkRead = useMarkNotificationRead as ReturnType<typeof vi.fn>
const mockMarkAll = useMarkAllRead as ReturnType<typeof vi.fn>

const emptyMutation = { mutate: vi.fn(), isPending: false }

function setupMocks(notifications = [], unreadCount = 0) {
  mockList.mockReturnValue({ data: { notifications, unreadCount }, isLoading: false })
  mockMarkRead.mockReturnValue(emptyMutation)
  mockMarkAll.mockReturnValue(emptyMutation)
}

describe('NotificationDrawer', () => {
  it('renders nothing when closed', () => {
    setupMocks()
    const { container } = render(<NotificationDrawer open={false} onClose={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the drawer when open', () => {
    setupMocks()
    render(<NotificationDrawer open={true} onClose={vi.fn()} />)
    expect(screen.getByRole('dialog', { name: /notifications/i })).toBeInTheDocument()
  })

  it('shows empty state when no notifications', () => {
    setupMocks([], 0)
    render(<NotificationDrawer open={true} onClose={vi.fn()} />)
    expect(screen.getByText(/no notifications yet/i)).toBeInTheDocument()
  })

  it('renders a list of notifications', () => {
    const notifications = [
      {
        id: 'n1', userId: 'u1', type: 'schedule_due',
        title: 'Water time', body: 'Plant needs water',
        referenceId: null, referenceType: null, channelKey: null,
        readAt: null, createdAt: new Date().toISOString(),
      },
      {
        id: 'n2', userId: 'u1', type: 'sensor_alert',
        title: 'High humidity', body: 'Tent A is at 80%',
        referenceId: null, referenceType: null, channelKey: null,
        readAt: new Date().toISOString(), createdAt: new Date().toISOString(),
      },
    ]
    setupMocks(notifications, 1)
    render(<NotificationDrawer open={true} onClose={vi.fn()} />)
    expect(screen.getByText('Water time')).toBeInTheDocument()
    expect(screen.getByText('High humidity')).toBeInTheDocument()
  })

  it('calls onClose when backdrop is clicked', async () => {
    setupMocks()
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<NotificationDrawer open={true} onClose={onClose} />)
    // click the backdrop (aria-hidden div before the aside)
    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement
    await user.click(backdrop)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows "All read" button when there are unread notifications', () => {
    setupMocks([], 2)
    render(<NotificationDrawer open={true} onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: /mark all as read/i })).toBeInTheDocument()
  })

  it('calls markAll when "All read" is clicked', async () => {
    const mutateFn = vi.fn()
    mockMarkAll.mockReturnValue({ mutate: mutateFn, isPending: false })
    mockList.mockReturnValue({ data: { notifications: [], unreadCount: 1 }, isLoading: false })
    mockMarkRead.mockReturnValue(emptyMutation)

    const user = userEvent.setup()
    render(<NotificationDrawer open={true} onClose={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /mark all as read/i }))
    expect(mutateFn).toHaveBeenCalledOnce()
  })
})
