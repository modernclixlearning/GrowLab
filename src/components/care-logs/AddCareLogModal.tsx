/**
 * GrowLab - Add Care Log Modal
 *
 * Modal form for logging a new care activity (water, feed, prune, etc.)
 * on a specific plant.
 * F3: adds scheduledAt datetime input + RecurrenceForm section.
 */

import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateCareLog } from '@/lib/hooks/useCareLogs'
import { getApiErrorToastMessage } from '@/lib/api/errors'
import { CARE_LOG_TYPE_CONFIG } from '@/types/care-logs'
import { H3 } from '@/components/shell'
import type { CareLogType, CreateCareLogRequest } from '@/types/care-logs'
import type { RecurrenceRule } from '@/lib/recurrence'
import { RecurrenceForm } from './RecurrenceForm'

const LOG_TYPES: CareLogType[] = ['water', 'feed', 'prune', 'transplant', 'train', 'other']

interface AddCareLogModalProps {
  plantId: string
  onClose: () => void
  /** Optional pre-selected log type (e.g., from a quick action button) */
  defaultLogType?: CareLogType
}

const labelClasses = 'mb-1 block text-sm font-medium text-fg-2'
const inputClasses =
  'w-full rounded-md border border-line bg-bg-2 px-3 py-2.5 text-sm text-fg placeholder:text-fg-4 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors'

export function AddCareLogModal({ plantId, onClose, defaultLogType }: AddCareLogModalProps) {
  const createCareLog = useCreateCareLog(plantId)
  const [logType, setLogType] = useState<CareLogType>(defaultLogType ?? 'water')
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState('')
  const [notes, setNotes] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const data: CreateCareLogRequest = { logType }

    if (amount) {
      const parsedAmount = parseFloat(amount)
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setError('Amount must be a positive number')
        return
      }
      data.amount = parsedAmount
    }

    if (unit.trim()) data.unit = unit.trim()
    if (notes.trim()) data.notes = notes.trim()

    // F3 scheduling fields
    if (scheduledAt) {
      data.scheduledAt = new Date(scheduledAt).toISOString()
    }
    if (recurrenceRule) {
      data.recurrenceRule = recurrenceRule
    }

    try {
      await createCareLog.mutateAsync(data)
      toast.success('Care activity logged')
      onClose()
    } catch (err) {
      const message = getApiErrorToastMessage(err, 'Failed to log care event')
      toast.error(message)
      setError(message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-bg/80" onClick={onClose} />
      <div className="relative mx-auto w-full max-w-md rounded-t-2xl border-t border-line bg-card p-6 shadow-xl animate-gl-modal-in sm:mx-4 sm:rounded-2xl sm:border">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <H3>Log Care Activity</H3>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-fg-3 transition-colors hover:bg-card-2 hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Log Type Selection */}
          <div>
            <label className={labelClasses}>
              Activity Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {LOG_TYPES.map((type) => {
                const config = CARE_LOG_TYPE_CONFIG[type]
                const active = logType === type
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setLogType(type)}
                    className={[
                      'flex flex-col items-center rounded-md border-2 px-3 py-3 text-xs font-medium transition-colors',
                      active
                        ? 'border-accent bg-accent-soft text-accent'
                        : 'border-line bg-bg-2 text-fg-2 hover:border-line-2 hover:text-fg',
                    ].join(' ')}
                  >
                    <span className="mb-1 text-lg">
                      {type === 'water' && '💧'}
                      {type === 'feed' && '🧪'}
                      {type === 'prune' && '✂️'}
                      {type === 'transplant' && '🪴'}
                      {type === 'train' && '🌿'}
                      {type === 'other' && '📝'}
                    </span>
                    {config.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Amount & Unit (optional) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="amount" className={labelClasses}>
                Amount <span className="text-fg-4">(optional)</span>
              </label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g., 500"
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor="unit" className={labelClasses}>
                Unit <span className="text-fg-4">(optional)</span>
              </label>
              <input
                id="unit"
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g., ml"
                className={inputClasses}
                maxLength={20}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className={labelClasses}>
              Notes <span className="text-fg-4">(optional)</span>
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any observations or details..."
              rows={3}
              className={`${inputClasses} resize-none`}
              maxLength={1000}
            />
          </div>

          {/* F3 — Schedule section */}
          <div>
            <label htmlFor="scheduled-at" className={labelClasses}>
              Schedule for <span className="text-fg-4">(optional)</span>
            </label>
            <input
              id="scheduled-at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className={inputClasses}
            />
          </div>

          {/* F3 — Recurrence */}
          <RecurrenceForm value={recurrenceRule} onChange={setRecurrenceRule} />

          {/* Error */}
          {error && (
            <p className="text-sm text-status-warn">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex flex-1 items-center justify-center rounded-md border border-line bg-card-2 px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createCareLog.isPending}
              className="inline-flex flex-1 items-center justify-center rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-bg shadow-accent-glow transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-60 disabled:hover:scale-100"
            >
              {createCareLog.isPending ? 'Logging...' : 'Log Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
