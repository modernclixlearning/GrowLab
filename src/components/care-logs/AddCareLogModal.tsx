/**
 * GrowLab - Add Care Log Modal
 * 
 * Modal form for logging a new care activity (water, feed, prune, etc.)
 * on a specific plant.
 */

import { useState } from 'react'
import { X } from 'lucide-react'
import { useCreateCareLog } from '@/lib/hooks/useCareLogs'
import { CARE_LOG_TYPE_CONFIG } from '@/types/care-logs'
import type { CareLogType, CreateCareLogRequest } from '@/types/care-logs'

const LOG_TYPES: CareLogType[] = ['water', 'feed', 'prune', 'transplant', 'train', 'other']

interface AddCareLogModalProps {
  plantId: string
  onClose: () => void
  /** Optional pre-selected log type (e.g., from a quick action button) */
  defaultLogType?: CareLogType
}

export function AddCareLogModal({ plantId, onClose, defaultLogType }: AddCareLogModalProps) {
  const createCareLog = useCreateCareLog(plantId)
  const [logType, setLogType] = useState<CareLogType>(defaultLogType ?? 'water')
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const data: CreateCareLogRequest = {
      logType,
    }

    if (amount) {
      const parsedAmount = parseFloat(amount)
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setError('Amount must be a positive number')
        return
      }
      data.amount = parsedAmount
    }

    if (unit.trim()) {
      data.unit = unit.trim()
    }

    if (notes.trim()) {
      data.notes = notes.trim()
    }

    try {
      await createCareLog.mutateAsync(data)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log care event')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative mx-auto w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Log Care Activity</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Log Type Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Activity Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {LOG_TYPES.map((type) => {
                const config = CARE_LOG_TYPE_CONFIG[type]
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setLogType(type)}
                    className={`flex flex-col items-center rounded-lg border-2 px-3 py-3 text-xs font-medium transition-colors ${
                      logType === type
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className={`mb-1 text-lg ${logType === type ? '' : config.color}`}>
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
              <label htmlFor="amount" className="mb-1 block text-sm font-medium text-gray-700">
                Amount <span className="text-gray-400">(optional)</span>
              </label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g., 500"
                className="input"
              />
            </div>
            <div>
              <label htmlFor="unit" className="mb-1 block text-sm font-medium text-gray-700">
                Unit <span className="text-gray-400">(optional)</span>
              </label>
              <input
                id="unit"
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g., ml"
                className="input"
                maxLength={20}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="mb-1 block text-sm font-medium text-gray-700">
              Notes <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any observations or details..."
              rows={3}
              className="input resize-none"
              maxLength={1000}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createCareLog.isPending}
              className="btn-primary flex-1"
            >
              {createCareLog.isPending ? 'Logging...' : 'Log Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
