/**
 * GrowLab BottomNav
 *
 * Mobile-first bottom tab bar with five items and a centered FAB:
 *   [Garden] [Dashboard] [FAB Add] [Schedule] [Profile]
 *
 * Tabs whose route is not yet implemented in the app (Schedule /schedule
 * and Profile /profile) are rendered visually identical to the other
 * tabs but their click handler is a no-op (no navigation, no toast).
 *
 * The FAB is rendered via the standalone `Fab` component and behaves
 * as a no-op in F0 — callers can pass `onFabClick` to wire a custom
 * action when later phases land.
 */

import { useLocation, useNavigate } from 'react-router-dom'
import { LayoutGrid, BarChart3, Calendar, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Fab } from './Fab'

interface NavItem {
  key: string
  label: string
  icon: LucideIcon
  /** Route to navigate to. `undefined` means visual-only (F0 stub). */
  to: string | undefined
}

const ITEMS: NavItem[] = [
  { key: 'garden', label: 'Garden', icon: LayoutGrid, to: '/garden' },
  { key: 'dashboard', label: 'Dashboard', icon: BarChart3, to: '/dashboard' },
  // FAB sits between dashboard and schedule (rendered separately).
  { key: 'schedule', label: 'Schedule', icon: Calendar, to: undefined },
  { key: 'profile', label: 'Profile', icon: User, to: undefined },
]

export interface BottomNavProps {
  /** Optional override for the FAB click handler. */
  onFabClick?: () => void
  /** Aria label for the FAB (defaults to "Add Plant"). */
  fabLabel?: string
}

export function BottomNav({
  onFabClick,
  fabLabel = 'Add Plant',
}: BottomNavProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleNavigate = (item: NavItem) => {
    if (!item.to) return // visual-only stub for routes not yet implemented
    navigate(item.to)
  }

  const handleFab = () => {
    if (onFabClick) {
      onFabClick()
    }
    // F0: no-op when no handler provided. No toast, no error.
  }

  // Render five buttons + FAB in fixed order:
  // Garden, Dashboard, FAB, Schedule, Profile.
  const left = ITEMS.slice(0, 2)
  const right = ITEMS.slice(2)

  return (
    <nav
      aria-label="Primary"
      className="absolute inset-x-0 bottom-0 z-10 flex h-[92px] items-stretch gap-1 px-2 pb-3 pt-2 bg-gradient-to-b from-transparent via-bg/60 to-bg"
    >
      {left.map((item) => (
        <NavButton
          key={item.key}
          item={item}
          isActive={!!item.to && location.pathname.startsWith(item.to)}
          onClick={() => handleNavigate(item)}
        />
      ))}
      <Fab label={fabLabel} onClick={handleFab} />
      {right.map((item) => (
        <NavButton
          key={item.key}
          item={item}
          isActive={!!item.to && location.pathname.startsWith(item.to)}
          onClick={() => handleNavigate(item)}
        />
      ))}
    </nav>
  )
}

interface NavButtonProps {
  item: NavItem
  isActive: boolean
  onClick: () => void
}

function NavButton({ item, isActive, onClick }: NavButtonProps) {
  const { icon: Icon, label, to } = item
  const isStub = to === undefined
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      aria-disabled={isStub || undefined}
      className={[
        'flex flex-1 flex-col items-center justify-center gap-1 border-0 bg-transparent pt-1 text-[11px] font-medium transition-colors',
        isActive ? 'text-accent' : 'text-fg-3',
        // visually identical for stubs; only the click is a no-op
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-md',
      ].join(' ')}
    >
      <Icon className="h-5 w-5" strokeWidth={2} />
      <span>{label}</span>
    </button>
  )
}
