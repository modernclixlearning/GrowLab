/**
 * GrowLab CareTaskCard — Dashboard care log tile.
 *
 * Read-only summary of a recent care log entry (last 48h or pending).
 * F1 leans on `loggedAt` since `scheduledAt` arrives in F3 (Master Plan §3
 * F3) — we display these as historical "recent activity" tiles. F3 will
 * extend the same component to render true scheduled tasks (`scheduledAt
 * <= today AND completedAt IS NULL`).
 *
 * Visual: based on prototype's `.gl-care-row` — 60×60 plant photo,
 * title + action sub-line, chevron. Click navigates to plant detail.
 */

import type { ReactNode } from 'react'
import {
  ChevronRight,
  Droplets,
  FlaskConical,
  Scissors,
  ArrowRightLeft,
  Move,
  CircleDot,
  Leaf,
} from 'lucide-react'
import { Eyebrow } from '@/components/shell'
import { CARE_LOG_TYPE_CONFIG, type CareLogType } from '@/types/care-logs'
import type { Plant } from '@/types/plants'

export interface CareTaskCardProps {
  plant: Pick<Plant, 'id' | 'name' | 'photoUrl'>
  logType: CareLogType
  /** ISO date string of the source `loggedAt` (F1) — F3 swaps in `scheduledAt`. */
  occurredAt: string
  /** Optional amount/unit summary (e.g. "400 ml"). */
  amount?: string | null
  /** Optional click handler — typically navigates to plant detail. */
  onClick?: () => void
  className?: string
}

const LOG_TYPE_ICON: Record<CareLogType, React.ComponentType<{ className?: string }>> = {
  water: Droplets,
  feed: FlaskConical,
  prune: Scissors,
  transplant: ArrowRightLeft,
  train: Move,
  other: CircleDot,
}

function formatRelative(dateStr: string, now: Date = new Date()): string {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  const diffMs = now.getTime() - d.getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function CareTaskCard({
  plant,
  logType,
  occurredAt,
  amount,
  onClick,
  className = '',
}: CareTaskCardProps): ReactNode {
  const config = CARE_LOG_TYPE_CONFIG[logType]
  const Icon = LOG_TYPE_ICON[logType] ?? CircleDot
  const interactive = typeof onClick === 'function'

  return (
    <button
      type={interactive ? 'button' : 'button'}
      onClick={onClick}
      disabled={!interactive}
      className={[
        'flex w-full items-center gap-3 rounded-md border border-line bg-card p-3 text-left transition-colors',
        interactive
          ? 'hover:bg-card-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg cursor-pointer'
          : 'cursor-default',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={`${config?.label ?? logType} for ${plant.name}`}
    >
      {/* Plant photo / placeholder */}
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-card-2">
        {plant.photoUrl ? (
          <img
            src={plant.photoUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <Leaf className="h-5 w-5 text-fg-3" aria-hidden="true" />
        )}
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={[
              'inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full',
              config?.bgColor ?? 'bg-card-2',
            ].join(' ')}
            aria-hidden="true"
          >
            <Icon className={`h-3.5 w-3.5 ${config?.color ?? 'text-fg-2'}`} />
          </span>
          <span className="truncate text-sm font-medium text-fg">
            {plant.name}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <Eyebrow tone="muted">
            {config?.label ?? logType}
            {amount ? ` · ${amount}` : ''}
          </Eyebrow>
          <span className="text-fg-4" aria-hidden="true">·</span>
          <span className="font-mono text-[11px] text-fg-3">
            {formatRelative(occurredAt)}
          </span>
        </div>
      </div>

      {interactive && (
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-fg-3" aria-hidden="true" />
      )}
    </button>
  )
}
