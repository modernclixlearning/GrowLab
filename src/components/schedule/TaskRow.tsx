/**
 * TaskRow — Schedule screen row card.
 *
 * Shows a single care log task: icon, HH:mm time, plant name (link),
 * amount+unit summary, a VIEW button → plant detail, and a Complete
 * button. Renders a "Completed" badge when completedAt is set.
 */

import {
  Droplets,
  FlaskConical,
  Scissors,
  ArrowRightLeft,
  Move,
  CircleDot,
  CheckCircle2,
  ExternalLink,
  Check,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CareLog, CareLogType } from '@/types/care-logs'

interface TaskRowProps {
  careLog: CareLog
  plantName: string
  onComplete?: (id: string) => void
  isCompleting?: boolean
}

const ICON_MAP: Record<CareLogType, React.ComponentType<{ className?: string }>> = {
  water: Droplets,
  feed: FlaskConical,
  prune: Scissors,
  transplant: ArrowRightLeft,
  train: Move,
  other: CircleDot,
}

const ICON_COLOR: Record<CareLogType, string> = {
  water: 'text-status-water',
  feed: 'text-status-thirsty',
  prune: 'text-stage-seedling',
  transplant: 'text-status-alert',
  train: 'text-stage-flower',
  other: 'text-fg-2',
}

function formatTime(isoStr: string | null): string {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function TaskRow({ careLog, plantName, onComplete, isCompleting }: TaskRowProps) {
  const Icon = ICON_MAP[careLog.logType as CareLogType] ?? CircleDot
  const iconColor = ICON_COLOR[careLog.logType as CareLogType] ?? 'text-fg-2'
  const isCompleted = !!careLog.completedAt
  const time = formatTime(careLog.scheduledAt)
  const amountLabel =
    careLog.amount && careLog.unit
      ? `${careLog.amount} ${careLog.unit}`
      : careLog.amount ?? null

  return (
    <div
      className={[
        'flex items-center gap-3 rounded-xl border p-3 transition-opacity',
        isCompleted
          ? 'border-border/40 bg-card-2/50 opacity-60'
          : 'border-border bg-card-2',
      ].join(' ')}
    >
      {/* Icon */}
      <div className={['flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card-1', iconColor].join(' ')}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5 truncate">
          {time && (
            <span className="shrink-0 font-mono text-xs text-fg-2">{time}</span>
          )}
          <span className="truncate text-sm font-medium text-fg-1">{plantName}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-fg-2">
          <span className="capitalize">{careLog.logType}</span>
          {amountLabel && (
            <>
              <span>·</span>
              <span>{amountLabel}</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        {isCompleted ? (
          <span className="flex items-center gap-1 rounded-full bg-status-healthy/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-status-healthy">
            <CheckCircle2 className="h-3 w-3" />
            Done
          </span>
        ) : (
          <>
            <Link
              to={`/plants/${careLog.plantId}`}
              aria-label={`View ${plantName}`}
              className="rounded-lg border border-border bg-card-1 px-2 py-1 text-xs font-medium text-fg-2 transition-colors hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <ExternalLink className="h-3 w-3" />
            </Link>
            {onComplete && (
              <button
                type="button"
                disabled={isCompleting}
                onClick={() => onComplete(careLog.id)}
                aria-label="Mark as complete"
                className="flex items-center gap-1 rounded-lg border border-accent/40 bg-accent/10 px-2 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
              >
                <Check className="h-3 w-3" />
                Done
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
