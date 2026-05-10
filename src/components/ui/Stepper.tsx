/**
 * GrowLab Stepper — multi-step modal progress indicator.
 *
 * Mirrors the prototype's Add Plant header strip:
 *   [Step N of M] [title]            [N/M pill]
 *   ────────────────────────────────────────── (progress bar)
 *
 * Pure presentational, controlled by the parent. Used by the F1
 * `<AddPlantModal>` 3-step flow (Master Plan §3 F1.5).
 */

import type { ReactNode } from 'react'
import { Eyebrow } from '@/components/shell'

export interface StepperProps {
  /** Current step (1-indexed). */
  current: number
  /** Total number of steps. */
  total: number
  /** Title for the current step. */
  title: ReactNode
  className?: string
}

export function Stepper({ current, total, title, className = '' }: StepperProps) {
  const safeCurrent = Math.max(1, Math.min(total, current))
  const pct = Math.round((safeCurrent / total) * 100)
  return (
    <div
      className={['w-full', className].filter(Boolean).join(' ')}
      aria-label={`Step ${safeCurrent} of ${total}: ${typeof title === 'string' ? title : ''}`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <Eyebrow tone="muted" className="mb-1 block">
            Step {safeCurrent} of {total}
          </Eyebrow>
          <p className="font-display text-base font-bold text-fg">{title}</p>
        </div>
        <span
          className="inline-flex items-center rounded-full border border-accent bg-accent-soft px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-eyebrow text-accent"
          aria-hidden="true"
        >
          {safeCurrent}/{total}
        </span>
      </div>
      <div
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-accent shadow-accent-glow transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
