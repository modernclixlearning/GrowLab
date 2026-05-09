/**
 * GrowLab StatCard — Dashboard tile.
 *
 * Mirrors the prototype's `.gl-stat` block: eyebrow uppercase label,
 * large display value, optional delta badge underneath. Variants:
 *   - `tone="default"` plain card.
 *   - `tone="accent"` greenish gradient and accent border (matches
 *     `.gl-stat--accent` from `prototype/styles.css`).
 *
 * Pure presentational — F1 callers compute the value/delta from real
 * `usePlants()` data; F5+ swaps in environmental aggregates.
 */

import type { ReactNode } from 'react'
import { Eyebrow } from '@/components/shell'

export type StatCardTone = 'default' | 'accent' | 'veg' | 'seedling' | 'flower'

export interface StatCardProps {
  /** Mono uppercase label — shown above the value. */
  label: string
  /** Main display value (string or formatted number). */
  value: string | number
  /** Optional secondary line under the value (mono, smaller). */
  sub?: ReactNode
  /** Optional delta badge (e.g. "+1 wk"). Rendered next to the value. */
  delta?: string
  /** Optional leading icon — small accent square. */
  icon?: ReactNode
  /** Visual tone — tinted variants for stage-coded stats. */
  tone?: StatCardTone
  className?: string
}

const TONE_CARD: Record<StatCardTone, string> = {
  default: 'border-line bg-card',
  accent:
    'border-accent-dark bg-gradient-to-b from-accent/10 via-card to-card',
  veg: 'border-line bg-card',
  seedling: 'border-line bg-card',
  flower: 'border-line bg-card',
}

const TONE_ICON: Record<StatCardTone, string> = {
  default: 'bg-card-2 text-fg-2',
  accent: 'bg-accent-soft text-accent',
  veg: 'bg-stage-veg/15 text-stage-veg',
  seedling: 'bg-stage-seedling/15 text-stage-seedling',
  flower: 'bg-stage-flower/15 text-stage-flower',
}

const TONE_EYEBROW: Record<StatCardTone, 'default' | 'muted' | 'accent'> = {
  default: 'muted',
  accent: 'accent',
  veg: 'muted',
  seedling: 'muted',
  flower: 'muted',
}

export function StatCard({
  label,
  value,
  sub,
  delta,
  icon,
  tone = 'default',
  className = '',
}: StatCardProps) {
  return (
    <div
      className={[
        'rounded-lg border p-4',
        TONE_CARD[tone],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div
            className={[
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md',
              TONE_ICON[tone],
            ].join(' ')}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <Eyebrow tone={TONE_EYEBROW[tone]}>{label}</Eyebrow>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold leading-none text-fg">
              {value}
            </span>
            {delta && (
              <span className="font-mono text-[12px] font-semibold text-accent">
                {delta}
              </span>
            )}
          </div>
          {sub && (
            <div className="mt-2 font-mono text-[11px] uppercase tracking-eyebrow text-fg-3">
              {sub}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
