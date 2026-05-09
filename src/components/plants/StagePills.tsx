/**
 * GrowLab StagePills
 *
 * Horizontal scrollable filter row for the Garden screen. Renders one
 * pill per growth stage plus a leading "All" pill. F1 always shows the
 * full 7-stage Expert set; the Basic/Expert toggle is deferred to F2
 * (Master Plan §3 / issue 003).
 *
 * Presentational only — selection state is owned by the parent.
 */

import {
  GROWTH_STAGE_CONFIG,
  type GrowthStage,
} from '@/types/plants'

/** Stage filter value — 'all' is the no-op filter. */
export type StageFilter = GrowthStage | 'all'

/** Order shown to the user, matching `GROWTH_STAGES` from the schema. */
const STAGE_ORDER: readonly GrowthStage[] = [
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
   * pill renders the count to the right of the label.
   */
  counts?: Partial<Record<StageFilter, number>>
  className?: string
}

export function StagePills({ selected, onChange, counts, className }: StagePillsProps) {
  const pills: { id: StageFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    ...STAGE_ORDER.map((stage) => ({
      id: stage,
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
