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
      <div className="card mb-4">
        <h3 className="mb-3 text-sm font-medium text-gray-700">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleQuickAction('water')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
          >
            <Droplets className="h-4 w-4" />
            Water
          </button>
          <button
            onClick={() => handleQuickAction('feed')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
          >
            <FlaskConical className="h-4 w-4" />
            Feed
          </button>
          <button
            onClick={() => handleQuickAction('prune')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-100"
          >
            <Scissors className="h-4 w-4" />
            Prune
          </button>
          <button
            onClick={handleOpenGeneral}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            <Plus className="h-4 w-4" />
            More
          </button>
        </div>
      </div>

      {/* Care Log Timeline */}
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Care History</h3>
          {data && data.total > 0 && (
            <span className="text-xs text-gray-400">{data.total} entries</span>
          )}
        </div>

        {isLoading ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-400">Loading care history...</p>
          </div>
        ) : !data || data.careLogs.length === 0 ? (
          <div className="py-8 text-center">
            <CircleDot className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-400">No care events logged yet</p>
            <p className="mt-1 text-xs text-gray-400">Use the quick actions above to start tracking</p>
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
                  className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-gray-50"
                >
                  {/* Icon */}
                  <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${config?.bgColor ?? 'bg-gray-100'}`}>
                    <Icon className={`h-4 w-4 ${config?.color ?? 'text-gray-600'}`} />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {config?.label ?? log.logType}
                        {amountStr && (
                          <span className="ml-1 font-normal text-gray-500">
                            &middot; {amountStr}
                          </span>
                        )}
                      </p>
                      <span className="flex-shrink-0 text-xs text-gray-400">
                        {formatLogDate(log.loggedAt)}
                      </span>
                    </div>
                    {log.notes && (
                      <p className="mt-0.5 text-xs text-gray-500">{log.notes}</p>
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
