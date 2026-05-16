import { X, Bell, CheckCheck } from 'lucide-react'
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from '@/lib/hooks/useNotifications'
import type { AppNotification } from '@/types/notifications'

interface NotificationDrawerProps {
  open: boolean
  onClose: () => void
}

export function NotificationDrawer({ open, onClose }: NotificationDrawerProps) {
  const { data, isLoading } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllRead()

  if (!open) return null

  const items = data?.notifications ?? []
  const unreadCount = data?.unreadCount ?? 0

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        role="dialog"
        aria-label="Notifications"
        aria-modal="true"
        className="fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col bg-bg shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-fg-3" />
            <h2 className="text-sm font-semibold text-fg">Notifications</h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-bg">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="flex items-center gap-1 text-xs text-fg-3 hover:text-fg disabled:opacity-50"
                aria-label="Mark all as read"
              >
                <CheckCheck className="h-4 w-4" />
                <span>All read</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-fg-3 hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Close notifications"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-sm text-fg-3">
              Loading…
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-fg-3">
              <Bell className="h-8 w-8 opacity-30" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <ul role="list" className="divide-y divide-border">
              {items.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={() => markRead.mutate(n.id)}
                />
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  )
}

function NotificationItem({
  notification: n,
  onMarkRead,
}: {
  notification: AppNotification
  onMarkRead: () => void
}) {
  const isUnread = n.readAt === null

  return (
    <li
      className={[
        'flex gap-3 px-4 py-3 transition-colors',
        isUnread ? 'bg-surface' : 'bg-bg',
      ].join(' ')}
    >
      <div className="mt-0.5 flex-shrink-0">
        <span
          className={[
            'block h-2 w-2 rounded-full',
            isUnread ? 'bg-accent' : 'bg-transparent',
          ].join(' ')}
          aria-hidden="true"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-fg">{n.title}</p>
        <p className="mt-0.5 text-xs text-fg-3">{n.body}</p>
        <p className="mt-1 text-[10px] text-fg-3">{formatRelativeTime(n.createdAt)}</p>
      </div>
      {isUnread && (
        <button
          type="button"
          onClick={onMarkRead}
          className="flex-shrink-0 self-start rounded p-1 text-xs text-fg-3 hover:text-fg focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          aria-label={`Mark "${n.title}" as read`}
        >
          <CheckCheck className="h-4 w-4" />
        </button>
      )}
    </li>
  )
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
