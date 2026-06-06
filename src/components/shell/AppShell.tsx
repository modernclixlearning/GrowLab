/**
 * GrowLab AppShell
 *
 * Mobile-first wrapper for authenticated screens. Mirrors the prototype's
 * `.gl-shell` + `.gl-scroll` + `.gl-tabbar` composition:
 *
 *   [scrollable content area]
 *   [bottom tab bar with FAB] (sticky)
 *
 * Auth screens (login/register) bypass AppShell to remain full-bleed.
 *
 * Layout (responsive):
 * - **Mobile (base)**: shell pins to `h-dvh`; scrolling is contained inside
 *   the content div (`overflow-y-auto`) so the absolutely-positioned
 *   BottomNav stays anchored at the bottom without being pushed off-screen.
 * - **Desktop (md+)**: containers open up (`h-auto`, `overflow-visible`) and
 *   the browser's native page scroll takes over — scrollbar appears at the
 *   viewport edge. BottomNav switches to `fixed` so it stays anchored while
 *   the page scrolls.
 * - The shell sets the dark page background (`bg-bg`) and default text
 *   color (`text-fg`) so consumers do not need to repeat them.
 * - `header` prop is optional — pass JSX to render a top chrome bar above
 *   the scrollable content (e.g. screen title row, action icons).
 */

import { type ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { useAuth } from '@/lib/stores/auth'
import { StageModeOnboarding } from '@/components/onboarding/StageModeOnboarding'
import { NotificationBadge } from '@/components/notifications/NotificationBadge'
import { NotificationDrawer } from '@/components/notifications/NotificationDrawer'
import {
  NotificationDrawerProvider,
  useNotificationDrawer,
} from '@/lib/stores/notification-drawer'
import { FabActionProvider, useFabAction } from '@/lib/stores/fab-action'

export interface AppShellProps {
  children: ReactNode
  /** Optional top chrome rendered above the scrollable content. */
  header?: ReactNode
  /** Hide the bottom nav (e.g. modal-style flows). Defaults to false. */
  hideBottomNav?: boolean
  /** Override the FAB click handler. F0 default is a no-op. */
  onFabClick?: () => void
  /**
   * Render the absolutely-positioned notification bell in the top-right
   * corner. Defaults to false — every screen owns its inline bell.
   * Only pass `true` for screens with no header of their own.
   */
  showAbsoluteBell?: boolean
}

function AppShellInner({
  children,
  header,
  hideBottomNav = false,
  onFabClick,
  showAbsoluteBell = false,
}: AppShellProps) {
  const { user, isAuthenticated } = useAuth()
  const { isOpen: notifOpen, open: openNotif, close: closeNotif } =
    useNotificationDrawer()
  const { trigger: fabTrigger, hasAction } = useFabAction()

  const showOnboarding =
    isAuthenticated && user !== null && user.hasOnboarded === false

  return (
    // Mobile: h-dvh so the inner scroll stays within the viewport.
    // Desktop (md+): min-h-dvh so the background extends with the content
    // and the native page scroll takes over — scrollbar at viewport edge.
    <div className="relative h-dvh w-full bg-bg font-body text-fg antialiased md:h-auto md:min-h-dvh">
      {/* Mobile-first column. md+ removes the fixed height and overflow clip
          so the browser's native scroll is used instead of the inner div's. */}
      <div className="relative mx-auto flex h-dvh w-full max-w-[412px] flex-col overflow-hidden bg-bg md:h-auto md:max-w-3xl md:overflow-visible lg:max-w-4xl">
        {isAuthenticated && showAbsoluteBell && (
          <div className="absolute right-3 top-3 z-20">
            <NotificationBadge onClick={openNotif} />
          </div>
        )}
        {header ? <div className="relative z-20 flex-shrink-0">{header}</div> : null}

        <div
          className={[
            // Mobile: flex-1 + overflow-y-auto confines scroll to this div.
            // Desktop (md+): both axes must be explicitly cleared. Tailwind's
            // md:overflow-visible expands to overflow-x/y:visible but the base
            // overflow-x:hidden (a separate property) still wins in specificity.
            // Setting md:overflow-x-visible alongside md:overflow-y-visible
            // ensures neither axis creates an inner scroll container.
            'relative w-full flex-1 overflow-y-auto overflow-x-hidden md:flex-none md:overflow-x-visible md:overflow-y-visible',
            hideBottomNav ? '' : 'pb-[92px]',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {children}
        </div>

        {!hideBottomNav && (
          <BottomNav
            onFabClick={onFabClick ?? fabTrigger}
            hideFab={!hasAction && !onFabClick}
          />
        )}
      </div>

      {showOnboarding && <StageModeOnboarding />}
      <NotificationDrawer open={notifOpen} onClose={closeNotif} />
    </div>
  )
}

export function AppShell(props: AppShellProps) {
  return (
    <NotificationDrawerProvider>
      <FabActionProvider>
        <AppShellInner {...props} />
      </FabActionProvider>
    </NotificationDrawerProvider>
  )
}
