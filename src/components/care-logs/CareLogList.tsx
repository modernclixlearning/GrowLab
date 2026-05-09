/**
 * GrowLab - Care Log List Component
 *
 * Displays a chronological list of care log entries for a plant.
 * Includes quick action buttons for common care activities.
 */

import { useState } from 'react'
import { Droplets, FlaskConical, Scissors, ArrowRightLeft, Move, CircleDot, Plus } from 'lucide-react'
import { useCareLogs } from '@/lib/hooks/useCareLogs'
import { CARE_LOG_TYPE_CONFIG } from '@/types/care-logs'
import { Eyebrow } from '@/components/shell'
import type { CareLogType, CareLog } from '@/types/care-logs'
import { AddCareLogModal } from './AddCareLogModal'

/**
 * Icon component lookup for care log types
 */
const LOG_TYPE_ICONS: Record<CareLogType, React.ElementType> = {
  water: Droplets,
  feed: FlaskConical,
  prune: Scissors,
  transplant: ArrowRightLeft,
  train: Move,
  other: CircleDot,
}

interface CareLogListProps {
  plantId: string
}

/**
 * Format a care log timestamp for display
 */
function formatLogDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format amount and unit for display
 */
function formatAmount(log: CareLog): string | null {
  if (!log.amount) return null
  const amount = parseFloat(log.amount)
  if (isNaN(amount)) return null
  const formatted = Number.isInteger(amount) ? amount.toString() : amount.toFixed(1)
  return log.unit ? `${formatted} ${log.unit}` : formatted
}

const QUICK_ACTION_BASE =
  'inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg'

export function CareLogList({ plantId }: CareLogListProps) {
  const { data, isLoading } = useCareLogs(plantId)
  const [showAddModal, setShowAddModal] = useState(false)
  const [defaultLogType, setDefaultLogType] = useState<CareLogType | undefined>()

  const handleQuickAction = (type: CareLogType) => {
    setDefaultLogType(type)
    setShowAddModal(true)
  }

  const handleOpenGeneral = () => {
    setDefaultLogType(undefined)
    setShowAddModal(true)
  }

  return (
    <div>
      {/* Quick Action Buttons */}
      <div className="mb-4 rounded-lg border border-line bg-card p-4">
        <Eyebrow tone="muted" className="mb-3 block">Quick Actions</Eyebrow>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleQuickAction('water')}
            className={`${QUICK_ACTION_BASE} border-status-water/40 bg-status-water/10 text-status-water hover:bg-status-water/20`}
          >
            <Droplets className="h-4 w-4" />
            Water
          </button>
          <button
            onClick={() => handleQuickAction('feed')}
            className={`${QUICK_ACTION_BASE} border-status-thirsty/40 bg-status-thirsty/10 text-status-thirsty hover:bg-status-thirsty/20`}
          >
            <FlaskConical className="h-4 w-4" />
            Feed
          </button>
          <button
            onClick={() => handleQuickAction('prune')}
            className={`${QUICK_ACTION_BASE} border-stage-seedling/40 bg-stage-seedling/10 text-stage-seedling hover:bg-stage-seedling/20`}
          >
            <Scissors className="h-4 w-4" />
            Prune
          </button>
          <button
            onClick={handleOpenGeneral}
            className={`${QUICK_ACTION_BASE} border-line bg-card-2 text-fg-2 hover:bg-card hover:text-fg`}
          >
            <Plus className="h-4 w-4" />
            More
          </button>
        </div>
      </div>

      {/* Care Log Timeline */}
      <div className="rounded-lg border border-line bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <Eyebrow tone="muted">Care History</Eyebrow>
          {data && data.total > 0 && (
            <span className="font-mono text-[11px] text-fg-3">{data.total} entries</span>
          )}
        </div>

        {isLoading ? (
          <div className="py-8 text-center">
            <p className="text-sm text-fg-3">Loading care history...</p>
          </div>
        ) : !data || data.careLogs.length === 0 ? (
          <div className="py-8 text-center">
            <CircleDot className="mx-auto mb-2 h-8 w-8 text-fg-4" />
            <p className="text-sm text-fg-3">No care events logged yet</p>
            <p className="mt-1 text-xs text-fg-4">Use the quick actions above to start tracking</p>
          </div>
        ) : (
          <div className="space-y-1">
            {data.careLogs.map((log) => {
              const config = CARE_LOG_TYPE_CONFIG[log.logType as CareLogType]
              const Icon = LOG_TYPE_ICONS[log.logType as CareLogType] ?? CircleDot
              const amountStr = formatAmount(log)

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-card-2"
                >
                  {/* Icon */}
                  <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${config?.bgColor ?? 'bg-card-2'}`}>
                    <Icon className={`h-4 w-4 ${config?.color ?? 'text-fg-2'}`} />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-fg">
                        {config?.label ?? log.logType}
                        {amountStr && (
                          <span className="ml-1 font-normal text-fg-3">
                            &middot; {amountStr}
                          </span>
                        )}
                      </p>
                      <span className="flex-shrink-0 font-mono text-[10px] text-fg-3">
                        {formatLogDate(log.loggedAt)}
                      </span>
                    </div>
                    {log.notes && (
                      <p className="mt-0.5 text-xs text-fg-3">{log.notes}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Care Log Modal */}
      {showAddModal && (
        <AddCareLogModal
          plantId={plantId}
          onClose={() => setShowAddModal(false)}
          defaultLogType={defaultLogType}
        />
      )}
    </div>
  )
}
