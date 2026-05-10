/**
 * GrowLab LightCyclePill (F2)
 *
 * Mono uppercase pill that surfaces a plant's `lightSchedule` (e.g.
 * "18/6", "12/12") on Plant Detail. Master Plan §F2.12 says this is
 * Expert-only — Basic users don't see it because the value isn't part
 * of the simplified mental model. The component renders nothing when
 * the schedule is null OR when stageMode === 'basic', keeping callers
 * one if-tree shorter.
 */

import { Sun } from 'lucide-react'
import type { StageMode } from '@/types/auth'

export interface LightCyclePillProps {
  lightSchedule: string | null
  stageMode: StageMode
}

export function LightCyclePill({ lightSchedule, stageMode }: LightCyclePillProps) {
  if (!lightSchedule) return null
  if (stageMode === 'basic') return null

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card-2 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-eyebrow text-fg-2"
      aria-label={`Light cycle: ${lightSchedule}`}
    >
      <Sun className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
      <span>Light · {lightSchedule}</span>
    </span>
  )
}
