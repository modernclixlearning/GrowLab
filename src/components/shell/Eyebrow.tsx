/**
 * GrowLab Eyebrow component
 *
 * Small mono uppercase label used above headings/sections.
 * Matches `.gl-eyebrow` from the prototype: JetBrains Mono, 11px,
 * uppercase, eyebrow letter-spacing.
 */

import type { HTMLAttributes, ReactNode } from 'react'

export type EyebrowTone = 'default' | 'muted' | 'accent'

export interface EyebrowProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  tone?: EyebrowTone
}

const TONE_CLASS: Record<EyebrowTone, string> = {
  default: 'text-fg-2',
  muted: 'text-fg-3',
  accent: 'text-accent',
}

export function Eyebrow({
  children,
  tone = 'muted',
  className = '',
  ...rest
}: EyebrowProps) {
  return (
    <span
      {...rest}
      className={[
        'font-mono text-[11px] font-medium uppercase tracking-eyebrow',
        TONE_CLASS[tone],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  )
}
