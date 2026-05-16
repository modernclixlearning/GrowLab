import { Bell } from 'lucide-react'
import { useUnreadCount } from '@/lib/hooks/useNotifications'

interface NotificationBadgeProps {
  onClick?: () => void
}

export function NotificationBadge({ onClick }: NotificationBadgeProps) {
  const count = useUnreadCount()
  const unread = count.data ?? 0

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={unread > 0 ? `${unread} unread notifications` : 'Notifications'}
      className="relative flex items-center justify-center rounded-full p-2 text-fg-3 transition-colors hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      <Bell className="h-5 w-5" strokeWidth={2} />
      {unread > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-bg"
        >
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  )
}
