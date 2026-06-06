/**
 * GrowLab Edit Plant Modal
 *
 * Single-form modal for editing plant data: name, strain type,
 * health status, and notes. Calls PATCH /api/plants/:plantId via
 * the `useUpdatePlant` hook.
 */

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { X, AlertCircle } from 'lucide-react'
import { useUpdatePlant } from '@/lib/hooks/usePlants'
import { getApiErrorToastMessage } from '@/lib/api/errors'
import type { Plant, StrainType, HealthStatus } from '@/types/plants'
import {
  STRAIN_TYPE_CONFIG,
  HEALTH_STATUS_CONFIG,
} from '@/types/plants'

/** Static active-state color class for each health status (Tailwind-safe). */
const HEALTH_ACTIVE_CLASS: Record<HealthStatus, string> = {
  healthy: 'text-status-good',
  stressed: 'text-status-thirsty',
  sick: 'text-status-warn',
  recovering: 'text-status-water',
  dead: 'text-fg-3',
}

interface EditPlantModalProps {
  plant: Plant
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface FormState {
  name: string
  strainType: StrainType
  healthStatus: HealthStatus
  notes: string
}

export function EditPlantModal({ plant, isOpen, onClose, onSuccess }: EditPlantModalProps) {
  const updatePlant = useUpdatePlant()
  const [form, setForm] = useState<FormState>({
    name: plant.name,
    strainType: plant.strainType,
    healthStatus: plant.healthStatus,
    notes: plant.notes ?? '',
  })
  const [formError, setFormError] = useState<string | null>(null)

  // Sync form to current plant values when the plant changes OR when the modal
  // closes (isOpen false→true cycle). Adding isOpen ensures abandoned edits are
  // discarded when the parent closes the modal, regardless of which code path
  // triggered the close (Cancel button, backdrop click, programmatic close).
  useEffect(() => {
    setForm({
      name: plant.name,
      strainType: plant.strainType,
      healthStatus: plant.healthStatus,
      notes: plant.notes ?? '',
    })
    setFormError(null)
  }, [plant.id, plant.name, plant.strainType, plant.healthStatus, plant.notes, isOpen])

  if (!isOpen) return null

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFormError(null)
  }

  const handleClose = () => {
    setFormError(null)
    // Reset to persisted plant values so re-opening always shows current data,
    // not the in-progress edits the user abandoned.
    setForm({
      name: plant.name,
      strainType: plant.strainType,
      healthStatus: plant.healthStatus,
      notes: plant.notes ?? '',
    })
    onClose()
  }

  const validate = (): string | null => {
    if (!form.name.trim()) return 'Plant name is required'
    if (form.name.trim().length > 100) return 'Name must be at most 100 characters'
    return null
  }

  const handleSave = async () => {
    const err = validate()
    if (err) {
      setFormError(err)
      return
    }

    try {
      await updatePlant.mutateAsync({
        plantId: plant.id,
        data: {
          name: form.name.trim(),
          strainType: form.strainType,
          healthStatus: form.healthStatus,
          notes: form.notes.trim() || null,
        },
      })
      toast.success('Plant updated')
      onSuccess?.()
      handleClose()
    } catch (err) {
      const message = getApiErrorToastMessage(err, 'Failed to update plant')
      setFormError(message)
      toast.error(message)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Edit plant"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-bg/85" onClick={handleClose} />

      {/* Modal */}
      <div className="relative mx-auto flex w-full max-w-lg flex-col rounded-t-2xl border-t border-line bg-card shadow-xl animate-gl-modal-in sm:mx-4 sm:rounded-2xl sm:border max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line p-4">
          <button
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-md text-fg transition-colors hover:bg-card-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <span className="font-display text-base font-bold">Edit Plant</span>
          <button
            onClick={handleClose}
            className="rounded-md px-3 h-10 text-sm text-fg-3 transition-colors hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Cancel
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {formError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-md border border-status-warn/40 bg-status-warn/10 p-3 text-status-warn"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{formError}</p>
            </div>
          )}

          {/* Name */}
          <div>
            <label
              htmlFor="editPlantName"
              className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-eyebrow text-fg-2"
            >
              Plant Name
            </label>
            <input
              id="editPlantName"
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              autoFocus
              className="w-full rounded-md border border-line bg-bg-1 px-4 h-12 text-[15px] text-fg placeholder:text-fg-4 outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
              placeholder='e.g., "OG Kush #1"'
            />
          </div>

          {/* Strain Type */}
          <div>
            <label className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-eyebrow text-fg-2">
              Strain Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(STRAIN_TYPE_CONFIG) as [StrainType, { label: string }][]).map(
                ([value, config]) => {
                  const active = form.strainType === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => update('strainType', value)}
                      aria-pressed={active}
                      className={[
                        'rounded-md border-2 px-4 py-3 text-left text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                        active
                          ? 'border-accent bg-accent-soft text-accent'
                          : 'border-line bg-card-2 text-fg hover:bg-card',
                      ].join(' ')}
                    >
                      {config.label}
                    </button>
                  )
                },
              )}
            </div>
          </div>

          {/* Health Status */}
          <div>
            <label className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-eyebrow text-fg-2">
              Health Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(HEALTH_STATUS_CONFIG) as [HealthStatus, { label: string }][]).map(
                ([value, config]) => {
                  const active = form.healthStatus === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => update('healthStatus', value)}
                      aria-pressed={active}
                      className={[
                        'rounded-md border-2 px-4 py-3 text-left text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                        active
                          ? `border-accent bg-accent-soft ${HEALTH_ACTIVE_CLASS[value]}`
                          : 'border-line bg-card-2 text-fg hover:bg-card',
                      ].join(' ')}
                    >
                      {config.label}
                    </button>
                  )
                },
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="editPlantNotes"
              className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-eyebrow text-fg-2"
            >
              Notes <span className="font-normal normal-case tracking-normal text-fg-3">(optional)</span>
            </label>
            <textarea
              id="editPlantNotes"
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={4}
              maxLength={1000}
              className="w-full rounded-md border border-line bg-bg-1 px-4 py-3 text-[15px] text-fg placeholder:text-fg-4 outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40 resize-none"
              placeholder="Any observations, reminders, or grow notes…"
            />
            <p className="mt-1 text-right font-mono text-[10px] text-fg-4">
              {form.notes.length}/1000
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-line bg-card p-4">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex flex-shrink-0 items-center justify-center rounded-full border border-line-2 bg-transparent px-5 h-12 text-sm font-semibold text-fg transition-colors hover:bg-card-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updatePlant.isPending}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-accent px-5 h-12 text-[15px] font-bold text-bg shadow-accent-glow transition-transform hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-60 disabled:hover:scale-100"
          >
            {updatePlant.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
