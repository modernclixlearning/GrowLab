/**
 * GrowLab Profile — TentModal (F2)
 *
 * Lightweight create/edit form for `tents`. Same modal shell pattern as
 * `<AddPlantModal>` (rounded sheet, backdrop, animate-gl-modal-in) but
 * single-step and form-only — strain catalog/photo flows belong to the
 * plant modal.
 *
 * Sonner toasts on success/error (CLAUDE.md UI Feedback Standard).
 */

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { X, AlertCircle } from 'lucide-react'
import { useCreateTent, useUpdateTent } from '@/lib/hooks/useTents'
import { getApiErrorToastMessage } from '@/lib/api/errors'
import type { Tent } from '@/types/tents'

export interface TentModalProps {
  /** When non-null we open in edit mode; otherwise create. */
  tent: Tent | null
  /** When true the modal is mounted/visible; controls open state. */
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface FormState {
  name: string
  lightTarget: string
  humidityTargetPct: string
  tempTargetC: string
  notes: string
}

const EMPTY: FormState = {
  name: '',
  lightTarget: '',
  humidityTargetPct: '',
  tempTargetC: '',
  notes: '',
}

function tentToForm(tent: Tent | null): FormState {
  if (!tent) return EMPTY
  return {
    name: tent.name,
    lightTarget: tent.lightTarget ?? '',
    humidityTargetPct: tent.humidityTargetPct ?? '',
    tempTargetC: tent.tempTargetC ?? '',
    notes: tent.notes ?? '',
  }
}

export function TentModal({ tent, isOpen, onClose, onSuccess }: TentModalProps) {
  const createTent = useCreateTent()
  const updateTent = useUpdateTent()
  const isEdit = tent !== null

  const [form, setForm] = useState<FormState>(() => tentToForm(tent))
  const [error, setError] = useState<string | null>(null)

  // Reset form whenever the dialog opens with a different tent. Avoids
  // stale state across consecutive Edit clicks.
  useEffect(() => {
    if (isOpen) {
      setForm(tentToForm(tent))
      setError(null)
    }
  }, [isOpen, tent])

  if (!isOpen) return null

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError(null)
  }

  const validate = (): string | null => {
    if (!form.name.trim()) return 'Tent name is required'
    if (form.name.trim().length > 100) return 'Name too long'
    if (form.humidityTargetPct) {
      const n = Number(form.humidityTargetPct)
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        return 'Humidity must be between 0 and 100'
      }
    }
    if (form.tempTargetC) {
      const n = Number(form.tempTargetC)
      if (!Number.isFinite(n) || n < -50 || n > 60) {
        return 'Temperature must be between -50 and 60 °C'
      }
    }
    if (form.lightTarget && form.lightTarget.length > 20) {
      return 'Light target too long'
    }
    return null
  }

  const handleSubmit = async () => {
    const err = validate()
    if (err) {
      setError(err)
      return
    }

    const payload = {
      name: form.name.trim(),
      lightTarget: form.lightTarget.trim() || undefined,
      humidityTargetPct: form.humidityTargetPct
        ? Number(form.humidityTargetPct)
        : undefined,
      tempTargetC: form.tempTargetC ? Number(form.tempTargetC) : undefined,
      notes: form.notes.trim() || undefined,
    }

    try {
      if (isEdit && tent) {
        await updateTent.mutateAsync({
          tentId: tent.id,
          data: {
            name: payload.name,
            // For PATCH, send `null` to clear instead of `undefined`,
            // which the API would interpret as "leave alone".
            lightTarget: payload.lightTarget ?? null,
            humidityTargetPct: payload.humidityTargetPct ?? null,
            tempTargetC: payload.tempTargetC ?? null,
            notes: payload.notes ?? null,
          },
        })
        toast.success(`${payload.name} updated`)
      } else {
        await createTent.mutateAsync(payload)
        toast.success(`${payload.name} created`)
      }
      onSuccess?.()
      onClose()
    } catch (e) {
      const message = getApiErrorToastMessage(e, 'Failed to save tent')
      setError(message)
      toast.error(message)
    }
  }

  const submitting = createTent.isPending || updateTent.isPending

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Edit tent' : 'Add tent'}
    >
      <div className="absolute inset-0 bg-bg/85" onClick={onClose} />

      <div className="relative mx-auto flex w-full max-w-lg flex-col rounded-t-2xl border-t border-line bg-card shadow-xl animate-gl-modal-in sm:mx-4 sm:rounded-2xl sm:border max-h-[92vh]">
        <div className="flex items-center justify-between border-b border-line p-4">
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-md text-fg transition-colors hover:bg-card-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <span className="font-display text-base font-bold">
            {isEdit ? 'Edit Tent' : 'Add Tent'}
          </span>
          <span className="w-10" aria-hidden="true" />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {error && (
            <div
              role="alert"
              className="mb-4 flex items-center gap-2 rounded-md border border-status-warn/40 bg-status-warn/10 p-3 text-status-warn"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <Field id="tent-name" label="Tent Name" required>
              <input
                id="tent-name"
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                autoFocus
                placeholder='e.g., "Tent A" or "Veg room"'
                className="w-full rounded-md border border-line bg-bg-1 px-4 h-12 text-[15px] text-fg placeholder:text-fg-4 outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
              />
            </Field>
            <Field id="tent-light" label="Light Target">
              <input
                id="tent-light"
                type="text"
                value={form.lightTarget}
                onChange={(e) => update('lightTarget', e.target.value)}
                placeholder="18/6 · 12/12 · auto"
                className="w-full rounded-md border border-line bg-bg-1 px-4 h-12 text-[15px] text-fg placeholder:text-fg-4 outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field id="tent-humidity" label="Humidity %">
                <input
                  id="tent-humidity"
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  inputMode="decimal"
                  value={form.humidityTargetPct}
                  onChange={(e) =>
                    update('humidityTargetPct', e.target.value)
                  }
                  placeholder="55"
                  className="w-full rounded-md border border-line bg-bg-1 px-4 h-12 text-[15px] text-fg placeholder:text-fg-4 outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
                />
              </Field>
              <Field id="tent-temp" label="Temp °C">
                <input
                  id="tent-temp"
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  value={form.tempTargetC}
                  onChange={(e) => update('tempTargetC', e.target.value)}
                  placeholder="24"
                  className="w-full rounded-md border border-line bg-bg-1 px-4 h-12 text-[15px] text-fg placeholder:text-fg-4 outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
                />
              </Field>
            </div>
            <Field id="tent-notes" label="Notes">
              <textarea
                id="tent-notes"
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="Strain, schedule, anything worth remembering."
                rows={3}
                className="w-full rounded-md border border-line bg-bg-1 px-4 py-3 text-[15px] text-fg placeholder:text-fg-4 outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
              />
            </Field>
          </div>
        </div>

        <div className="flex gap-3 border-t border-line bg-card p-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex flex-shrink-0 items-center justify-center rounded-full border border-line bg-transparent px-5 h-12 text-sm font-semibold text-fg transition-colors hover:bg-card-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-accent px-5 h-12 text-[15px] font-bold text-bg shadow-accent-glow transition-transform hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-60 disabled:hover:scale-100"
          >
            {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Tent'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface FieldProps {
  id: string
  label: string
  required?: boolean
  children: React.ReactNode
}

function Field({ id, label, required, children }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-eyebrow text-fg-2"
      >
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
      </label>
      {children}
    </div>
  )
}
