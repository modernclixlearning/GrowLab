/**
 * GrowLab Profile — SensorModal (F5)
 *
 * Create/edit modal for a sensor device.
 * Follows the same modal shell pattern as TentModal.
 */

import { useEffect, useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { useCreateSensorDevice, useUpdateSensorDevice } from '@/lib/hooks/useSensors'
import { getApiErrorToastMessage } from '@/lib/api/errors'
import type { SensorDevice, SensorProvider } from '@/types/sensors'

export interface SensorModalProps {
  device: SensorDevice | null
  isOpen: boolean
  onClose: () => void
  /** Plant or tent ID to pre-select when creating */
  targetPlantId?: string
  targetTentId?: string
}

interface FormState {
  provider: SensorProvider
  apiKey: string
  label: string
  targetPlantId: string
  targetTentId: string
}

const EMPTY: FormState = {
  provider: 'govee',
  apiKey: '',
  label: '',
  targetPlantId: '',
  targetTentId: '',
}

function deviceToForm(device: SensorDevice | null, targetPlantId?: string, targetTentId?: string): FormState {
  if (!device) {
    return {
      ...EMPTY,
      targetPlantId: targetPlantId ?? '',
      targetTentId: targetTentId ?? '',
    }
  }
  return {
    provider: device.provider,
    apiKey: '',
    label: device.label,
    targetPlantId: device.targetPlantId ?? '',
    targetTentId: device.targetTentId ?? '',
  }
}

const PROVIDERS: { value: SensorProvider; label: string }[] = [
  { value: 'govee', label: 'Govee' },
  { value: 'inkbird', label: 'Inkbird' },
  { value: 'switchbot', label: 'SwitchBot' },
  { value: 'manual', label: 'Manual (no cloud sync)' },
]

export function SensorModal({ device, isOpen, onClose, targetPlantId, targetTentId }: SensorModalProps) {
  const createDevice = useCreateSensorDevice()
  const updateDevice = useUpdateSensorDevice(device?.id ?? '')
  const isEdit = device !== null

  const [form, setForm] = useState<FormState>(() => deviceToForm(device, targetPlantId, targetTentId))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setForm(deviceToForm(device, targetPlantId, targetTentId))
      setError(null)
    }
  }, [isOpen, device, targetPlantId, targetTentId])

  if (!isOpen) return null

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError(null)
  }

  const validate = (): string | null => {
    if (!form.label.trim()) return 'Label is required'
    if (form.label.trim().length > 100) return 'Label too long'
    if (form.provider !== 'manual' && !isEdit && !form.apiKey.trim()) {
      return 'API key is required for this provider'
    }
    return null
  }

  const handleSubmit = async () => {
    const err = validate()
    if (err) {
      setError(err)
      return
    }

    try {
      if (isEdit && device) {
        await updateDevice.mutateAsync({
          provider: form.provider,
          apiKey: form.apiKey || undefined,
          label: form.label.trim(),
          targetPlantId: form.targetPlantId || null,
          targetTentId: form.targetTentId || null,
        })
      } else {
        await createDevice.mutateAsync({
          provider: form.provider,
          apiKey: form.apiKey || undefined,
          label: form.label.trim(),
          targetPlantId: form.targetPlantId || undefined,
          targetTentId: form.targetTentId || undefined,
        })
      }
      onClose()
    } catch (err) {
      setError(getApiErrorToastMessage(err, 'Failed to save sensor device'))
    }
  }

  const isPending = createDevice.isPending || updateDevice.isPending

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-bg/80 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sensor-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md animate-gl-modal-in rounded-t-2xl border border-line bg-bg p-6 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <h2 id="sensor-modal-title" className="font-display text-xl font-semibold text-fg">
            {isEdit ? 'Edit Sensor' : 'Add Sensor Device'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-fg-3 hover:bg-card-2 hover:text-fg"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Label */}
          <div>
            <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-eyebrow text-fg-3">
              Label
            </label>
            <input
              type="text"
              value={form.label}
              onChange={(e) => update('label', e.target.value)}
              placeholder="e.g. Tent A – Govee Sensor"
              maxLength={100}
              className="w-full rounded-lg border border-line bg-card px-3 py-2.5 text-sm text-fg placeholder:text-fg-3 focus:border-accent focus:outline-none"
            />
          </div>

          {/* Provider */}
          <div>
            <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-eyebrow text-fg-3">
              Provider
            </label>
            <select
              value={form.provider}
              onChange={(e) => update('provider', e.target.value as SensorProvider)}
              className="w-full rounded-lg border border-line bg-card px-3 py-2.5 text-sm text-fg focus:border-accent focus:outline-none"
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* API Key (not shown for manual) */}
          {form.provider !== 'manual' && (
            <div>
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-eyebrow text-fg-3">
                API Key {isEdit && <span className="normal-case text-fg-3">(leave blank to keep existing)</span>}
              </label>
              <input
                type="password"
                value={form.apiKey}
                onChange={(e) => update('apiKey', e.target.value)}
                placeholder={isEdit ? '••••••••' : 'Paste your API key'}
                autoComplete="new-password"
                className="w-full rounded-lg border border-line bg-card px-3 py-2.5 text-sm text-fg placeholder:text-fg-3 focus:border-accent focus:outline-none"
              />
            </div>
          )}

          {/* Target plant or tent (IDs provided by caller via props — here we display them) */}
          {(form.targetPlantId || form.targetTentId) && (
            <div className="rounded-lg border border-line bg-card-2 px-3 py-2.5">
              <p className="font-mono text-[11px] uppercase tracking-eyebrow text-fg-3">Target</p>
              <p className="mt-1 text-sm text-fg">
                {form.targetPlantId ? `Plant ID: ${form.targetPlantId}` : `Tent ID: ${form.targetTentId}`}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-status-warn/40 bg-status-warn/10 p-3 text-sm text-status-warn">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-line bg-card px-4 py-2.5 text-sm font-semibold text-fg hover:bg-card-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg hover:bg-accent/90 disabled:opacity-60"
          >
            {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Sensor'}
          </button>
        </div>
      </div>
    </div>
  )
}
