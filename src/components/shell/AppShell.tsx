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
 * Notes:
 * - Children render inside the scrollable area; the BottomNav is rendered
 *   at the bottom and overlaps via gradient (matches prototype).
 * - The shell sets the dark page background (`bg-bg`) and default text
 *   color (`text-fg`) so consumers do not need to repeat them.
 * - `header` prop is optional — pass JSX to render a top chrome bar above
 *   the scrollable content (e.g. screen title row, action icons).
 */

import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'

export interface AppShellProps {
  children: ReactNode
  /** Optional top chrome rendered above the scrollable content. */
  header?: ReactNode
  /** Hide the bottom nav (e.g. modal-style flows). Defaults to false. */
  hideBottomNav?: boolean
  /** Override the FAB click handler. F0 default is a no-op. */
  onFabClick?: () => void
}

export function AppShell({
  children,
  header,
  hideBottomNav = false,
  onFabClick,
}: AppShellProps) {
  return (
    <div className="relative min-h-screen w-full bg-bg font-body text-fg antialiased">
      {/* Outer centering for desktop / large screens, mobile-first inside */}
      <div className="relative mx-auto min-h-screen w-full max-w-[412px] overflow-hidden bg-bg">
        {header ? <div className="relative z-20">{header}</div> : null}

        <div
          className={[
            'relative w-full overflow-y-auto overflow-x-hidden',
            // leave space for the 92px bottom nav unless hidden
            hideBottomNav ? 'min-h-screen' : 'min-h-[calc(100vh-92px)] pb-[92px]',
          ].join(' ')}
        >
          {children}
        </div>

        {!hideBottomNav && <BottomNav onFabClick={onFabClick} />}
      </div>
    </div>
  )
}
