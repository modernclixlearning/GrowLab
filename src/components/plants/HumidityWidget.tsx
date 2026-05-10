/**
 * GrowLab HumidityWidget (F5)
 *
 * Displays the latest humidity reading for a plant.
 * Color coding:
 *   < 40%          → status-warn (amber/red)
 *   40–70%         → status-healthy (green neon)
 *   > 70%          → status-thirsty (orange)
 *
 * Shows a "No sensor" CTA when no reading is available.
 * Expert-only: caller is responsible for gating (Plant Detail checks stageMode).
 */

import { Droplets } from 'lucide-react'
import { useLatestReadings } from '@/lib/hooks/useSensors'

export interface HumidityWidgetProps {
  plantId: string
}

function getHumidityStatus(value: number): {
  label: string
  className: string
} {
  if (value < 40) return { label: 'Low', className: 'text-status-warn' }
  if (value <= 70) return { label: 'Ideal', className: 'text-status-healthy' }
  return { label: 'High', className: 'text-status-thirsty' }
}

export function HumidityWidget({ plantId }: HumidityWidgetProps) {
  const { data, isLoading } = useLatestReadings(plantId, ['humidity'])

  const reading = data?.humidity
  const value = reading ? parseFloat(String(reading.value)) : null

  return (
    <div
      className="flex flex-col gap-2 rounded-xl border border-line bg-card p-4"
      aria-label="Humidity reading"
    >
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-eyebrow text-fg-3">
        <Droplets className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Humidity</span>
      </div>

      {isLoading ? (
        <div className="h-8 w-16 animate-pulse rounded bg-card-2" />
      ) : value !== null ? (
        <>
          <p
            className={`font-display text-3xl font-bold leading-none ${getHumidityStatus(value).className}`}
            aria-label={`${value}% humidity — ${getHumidityStatus(value).label}`}
          >
            {value.toFixed(0)}
            <span className="ml-0.5 font-mono text-base font-normal text-fg-3">%</span>
          </p>
          <p className="font-mono text-[11px] uppercase tracking-eyebrow text-fg-3">
            {getHumidityStatus(value).label}
          </p>
        </>
      ) : (
        <p className="text-sm text-fg-3">
          No sensor —{' '}
          <a href="/profile" className="text-accent underline-offset-2 hover:underline">
            add in Profile
          </a>
        </p>
      )}
    </div>
  )
}
