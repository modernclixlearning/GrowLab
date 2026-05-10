/**
 * GrowLab StagePills
 *
 * Horizontal scrollable filter row for the Garden screen.
 *
 * F2 (Master Plan §F2 / issue 003): the component is now reactive to a
 * `stageMode` prop:
 *   - `'expert'` (default, backward-compatible) renders the 7-stage
 *     filter we shipped in F1.
 *   - `'basic'` renders the 4 Basic buckets (seedling, veg, flower,
 *     harvest) plus the leading "All" pill.
 *
 * Selection state is owned by the parent in BOTH modes — when the user
 * toggles between Basic/Expert in Profile, the Garden pages decide
 * whether to reset the active filter (e.g., basic 'flower' ≠ expert
 * 'flowering' literally; reset is the safest default).
 */

import {
  GROWTH_STAGE_CONFIG,
  type GrowthStage,
} from '@/types/plants'
import {
  BASIC_STAGE_BUCKETS,
  BASIC_STAGE_LABEL,
  type BasicStage,
} from '@/lib/stage-mapping'
import type { StageMode } from '@/types/auth'

/**
 * Filter values:
 *   - Expert mode: `'all' | GrowthStage` (7 stages).
 *   - Basic mode: `'all' | BasicStage` (4 buckets).
 *
 * Both share the leading `'all'` sentinel so consumers can keep one
 * state slot and only re-narrow when they read the value.
 */
export type StageFilter = GrowthStage | BasicStage | 'all'

/** Order shown to the user in Expert mode, matching `GROWTH_STAGES`. */
const EXPERT_STAGE_ORDER: readonly GrowthStage[] = [
  'seedling',
  'vegetative',
  'flowering',
  'harvesting',
  'drying',
  'curing',
  'completed',
]

export interface StagePillsProps {
  selected: StageFilter
  onChange: (stage: StageFilter) => void
  /**
   * Optional per-stage counts (and an `all` total). When provided, each
   * pill renders the count to the right of the label. Keys must match
   * the active mode's filter values.
   */
  counts?: Partial<Record<StageFilter, number>>
  /**
   * F2 — switches between Expert (7 stages) and Basic (4 buckets).
   * Defaults to `'expert'` so callers that haven't been migrated keep
   * the F1 behaviour.
   */
  stageMode?: StageMode
  className?: string
}

export function StagePills({
  selected,
  onChange,
  counts,
  stageMode = 'expert',
  className,
}: StagePillsProps) {
  const pills: { id: StageFilter; label: string }[] =
    stageMode === 'basic'
      ? [
          { id: 'all', label: 'All' },
          ...BASIC_STAGE_BUCKETS.map((bucket) => ({
            id: bucket as StageFilter,
            label: BASIC_STAGE_LABEL[bucket],
          })),
        ]
      : [
          { id: 'all', label: 'All' },
          ...EXPERT_STAGE_ORDER.map((stage) => ({
            id: stage as StageFilter,
            label: GROWTH_STAGE_CONFIG[stage].label,
          })),
        ]

  return (
    <div
      className={[
        'flex gap-2 overflow-x-auto pb-1.5',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="tablist"
      aria-label="Filter plants by growth stage"
    >
      {pills.map(({ id, label }) => {
        const active = selected === id
        const count = counts?.[id]
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={[
              'inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5',
              'font-mono text-[11px] font-medium uppercase tracking-eyebrow transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
              active
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-line bg-card text-fg-2 hover:bg-card-2 hover:text-fg',
            ].join(' ')}
          >
            <span>{label}</span>
            {typeof count === 'number' && (
              <span className={active ? 'text-accent/70' : 'text-fg-3'}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
