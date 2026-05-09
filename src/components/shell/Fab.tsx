/**
 * GrowLab FAB (floating action button)
 *
 * Circular accent button used as the centerpiece of the BottomNav.
 * In F0 it does NOT open the Add Plant modal (that comes in F1/F4).
 * Default behavior is a no-op handler that can be overridden via
 * the `onClick` prop.
 *
 * Visual: 64x64 circle, accent fill, accent-glow shadow, plus icon.
 */

import { Plus } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

export interface FabProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Accessible label for the button. Defaults to "Add". */
  label?: string
  /** Optional custom icon override. */
  icon?: ReactNode
}

export function Fab({
  label = 'Add',
  icon,
  onClick,
  className = '',
  type = 'button',
  ...rest
}: FabProps) {
  return (
    <button
      {...rest}
      type={type}
      aria-label={label}
      onClick={onClick}
      className={[
        // shape
        'flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full',
        // visuals (accent + glow + drop shadow)
        'bg-accent text-bg shadow-accent-glow',
        // float over tabbar — center button overlaps the bar
        'self-center -mt-5',
        // interactions
        'transition-transform duration-100 active:scale-95',
        // focus ring uses accent token
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon ?? <Plus className="h-7 w-7" strokeWidth={2.6} />}
    </button>
  )
}
