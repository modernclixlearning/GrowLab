/**
 * GrowLab TempWidget (F5)
 *
 * Displays the latest temperature reading for a plant.
 * Ideal range: 20–28 °C. Adapts to the user's unit preference (C or F).
 *
 * Expert-only: caller is responsible for gating.
 */

import { Thermometer } from 'lucide-react'
import { useLatestReadings } from '@/lib/hooks/useSensors'

export interface TempWidgetProps {
  plantId: string
  /** Temperature unit from user.unitsPreference.temp */
  unit?: 'C' | 'F'
}

function toF(celsius: number) {
  return celsius * 9 / 5 + 32
}

function getTempStatus(celsius: number): {
  label: string
  className: string
} {
  if (celsius < 16) return { label: 'Too cold', className: 'text-status-warn' }
  if (celsius <= 28) return { label: 'Ideal', className: 'text-status-healthy' }
  return { label: 'Too warm', className: 'text-status-thirsty' }
}

export function TempWidget({ plantId, unit = 'C' }: TempWidgetProps) {
  const { data, isLoading } = useLatestReadings(plantId, ['temperature'])

  const reading = data?.temperature
  const celsius = reading ? parseFloat(String(reading.value)) : null
  const displayValue = celsius !== null
    ? (unit === 'F' ? toF(celsius) : celsius)
    : null

  return (
    <div
      className="flex flex-col gap-2 rounded-xl border border-line bg-card p-4"
      aria-label="Temperature reading"
    >
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-eyebrow text-fg-3">
        <Thermometer className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Temperature</span>
      </div>

      {isLoading ? (
        <div className="h-8 w-16 animate-pulse rounded bg-card-2" />
      ) : displayValue !== null && celsius !== null ? (
        <>
          <p
            className={`font-display text-3xl font-bold leading-none ${getTempStatus(celsius).className}`}
            aria-label={`${displayValue.toFixed(1)}°${unit} — ${getTempStatus(celsius).label}`}
          >
            {displayValue.toFixed(1)}
            <span className="ml-0.5 font-mono text-base font-normal text-fg-3">°{unit}</span>
          </p>
          <p className="font-mono text-[11px] uppercase tracking-eyebrow text-fg-3">
            {getTempStatus(celsius).label}
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
