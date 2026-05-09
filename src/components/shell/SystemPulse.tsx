/**
 * GrowLab SystemPulse indicator
 *
 * Small mono uppercase strip with an animated accent dot. Used on
 * dashboard-style chrome to signal "live" state. The dot uses the
 * `gl-pulse-dot` keyframe defined in the Tailwind theme.
 *
 * Examples:
 *   <SystemPulse />
 *   <SystemPulse count={4} label="ACTIVE PLANTS" />
 */

import type { HTMLAttributes } from 'react'

export interface SystemPulseProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional numeric prefix (e.g. count of active plants). */
  count?: number
  /** Optional label associated with the count, shown uppercase. */
  label?: string
  /** Status text, defaults to "SYSTEM ONLINE". */
  status?: string
}

export function SystemPulse({
  count,
  label,
  status = 'SYSTEM ONLINE',
  className = '',
  ...rest
}: SystemPulseProps) {
  const hasPrefix = typeof count === 'number' && !!label
  return (
    <div
      {...rest}
      className={[
        'inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-eyebrow text-fg-3',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-live="polite"
    >
      <span
        aria-hidden="true"
        className="inline-block h-2 w-2 flex-shrink-0 rounded-full bg-accent shadow-accent-glow animate-gl-pulse-dot"
      />
      {hasPrefix && (
        <span className="text-fg-2">
          {count} {label}
        </span>
      )}
      {hasPrefix && <span className="text-fg-4">·</span>}
      <span className={hasPrefix ? 'text-fg-3' : 'text-fg-2'}>{status}</span>
    </div>
  )
}
