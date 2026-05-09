/**
 * GrowLab MiniChart — Dashboard "Tent Growth" placeholder.
 *
 * F1 placeholder: derives 5 weekly buckets from `plant.createdAt` ages
 * (no real growth measurements until F5). The component renders inline
 * SVG bars to keep the bundle small and avoid pulling recharts for what
 * is, today, an aesthetic tile. F5 swaps the data source for actual
 * `growth_measurements` derived deltas (Master Plan §3 F5).
 *
 * The bars animate via the `animate-gl-bar-rise` token so we keep visual
 * parity with the prototype.
 */

import { useMemo } from 'react'
import type { Plant } from '@/types/plants'
import { Eyebrow } from '@/components/shell'

export interface MiniChartProps {
  /** Plants used to derive the placeholder buckets. */
  plants: Plant[]
  /** Optional override label. */
  label?: string
  className?: string
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const BUCKETS = 5

/**
 * Build 5 placeholder buckets from `createdAt` ages of the plants. The
 * bucket index represents weeks-ago (0 = oldest, 4 = current week). Each
 * bar's height is the count of plants that were alive that week.
 */
function buildBuckets(plants: Plant[], now: Date = new Date()): number[] {
  const buckets = new Array(BUCKETS).fill(0)
  for (const p of plants) {
    const created = new Date(p.createdAt).getTime()
    if (Number.isNaN(created)) continue
    // For each of the last 5 weeks, count plant as alive if it was created
    // before that week ended.
    for (let w = 0; w < BUCKETS; w++) {
      const weekEnd = now.getTime() - (BUCKETS - 1 - w) * WEEK_MS
      if (created <= weekEnd) buckets[w] += 1
    }
  }
  return buckets
}

export function MiniChart({
  plants,
  label = 'Tent Growth',
  className = '',
}: MiniChartProps) {
  const buckets = useMemo(() => buildBuckets(plants), [plants])
  const max = Math.max(1, ...buckets)
  const labels = ['W-4', 'W-3', 'W-2', 'W-1', 'NOW']

  return (
    <div
      className={[
        'rounded-lg border border-line bg-card p-4',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <Eyebrow tone="muted">{label}</Eyebrow>
        <Eyebrow tone="accent">Last 5 wk</Eyebrow>
      </div>
      <div
        className="grid h-[120px] grid-cols-5 items-end gap-2"
        role="img"
        aria-label={`${label} chart`}
      >
        {buckets.map((value, idx) => {
          const heightPct = Math.round((value / max) * 100)
          const isCurrent = idx === BUCKETS - 1
          return (
            <div
              key={idx}
              className="flex h-full flex-col items-center justify-end gap-2"
            >
              <span className="font-mono text-[10px] text-fg-3">{value}</span>
              <div
                className={[
                  'w-full origin-bottom rounded-t-md animate-gl-bar-rise',
                  isCurrent
                    ? 'bg-accent shadow-accent-glow'
                    : 'bg-accent-dark',
                ].join(' ')}
                style={{ height: `${Math.max(6, heightPct)}%` }}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-2 grid grid-cols-5 gap-2">
        {labels.map((l) => (
          <span
            key={l}
            className="text-center font-mono text-[10px] uppercase tracking-eyebrow text-fg-3"
          >
            {l}
          </span>
        ))}
      </div>
    </div>
  )
}

// Exported for tests
export { buildBuckets }
