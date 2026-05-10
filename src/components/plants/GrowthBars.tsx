/**
 * GrowLab GrowthBars (F5)
 *
 * Displays up to 5 vertical bars representing weekly height_cm measurements.
 * Bars are normalized so the highest value = 100 (full height).
 * Each bar shows the week label and an optional delta vs the prior week.
 *
 * Animation: bars rise on mount via the `gl-bar-rise` keyframe.
 *
 * Expert-only: caller is responsible for gating.
 */

import { useGrowthMeasurements } from '@/lib/hooks/useGrowth'
import type { GrowthBar } from '@/types/sensors'

export interface GrowthBarsProps {
  plantId: string
}

interface BarItemProps {
  bar: GrowthBar
  index: number
}

function BarItem({ bar, index }: BarItemProps) {
  const deltaSign = bar.weekDelta !== null && bar.weekDelta > 0 ? '+' : ''
  const deltaColor =
    bar.weekDelta === null
      ? 'text-fg-3'
      : bar.weekDelta > 0
        ? 'text-status-healthy'
        : 'text-status-warn'

  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      {/* Delta label */}
      <p className={`h-4 font-mono text-[10px] ${deltaColor}`}>
        {bar.weekDelta !== null ? `${deltaSign}${bar.weekDelta.toFixed(1)}` : ''}
      </p>

      {/* Bar track */}
      <div className="relative h-24 w-6 overflow-hidden rounded-t-sm bg-card-2">
        <div
          className="absolute bottom-0 left-0 right-0 rounded-t-sm bg-accent animate-gl-bar-rise"
          style={{
            height: `${bar.value}%`,
            animationDelay: `${index * 60}ms`,
          }}
          aria-label={`Week ${bar.weekLabel}: ${bar.value}% of max`}
        />
      </div>

      {/* Week label */}
      <p className="font-mono text-[11px] uppercase tracking-eyebrow text-fg-3">{bar.weekLabel}</p>
    </div>
  )
}

function EmptyGrowthBars() {
  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <p className="font-mono text-[11px] uppercase tracking-eyebrow text-fg-3">Growth (height)</p>
      <p className="mt-3 text-sm text-fg-3">
        No growth data yet. Log your first measurement to see weekly progress.
      </p>
    </div>
  )
}

export function GrowthBars({ plantId }: GrowthBarsProps) {
  const { data, isLoading } = useGrowthMeasurements(plantId, { metric: 'height_cm', limit: 50 })

  if (isLoading) {
    return (
      <div className="rounded-xl border border-line bg-card p-4">
        <p className="font-mono text-[11px] uppercase tracking-eyebrow text-fg-3">Growth (height)</p>
        <div className="mt-3 flex items-end gap-2">
          {[40, 70, 55, 90, 80].map((h, i) => (
            <div key={i} className="h-24 flex-1 animate-pulse rounded bg-card-2" style={{ height: `${h}px` }} />
          ))}
        </div>
      </div>
    )
  }

  const bars: GrowthBar[] = data?.growthBars ?? []

  if (bars.length === 0) return <EmptyGrowthBars />

  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <p className="font-mono text-[11px] uppercase tracking-eyebrow text-fg-3 mb-4">Growth (height)</p>
      <div className="flex items-end gap-2" role="img" aria-label="Weekly growth chart">
        {bars.map((bar, i) => (
          <BarItem key={bar.weekLabel} bar={bar} index={i} />
        ))}
      </div>
    </div>
  )
}
