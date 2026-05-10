/**
 * GrowLab Profile — SensorDevicesSection (F5)
 *
 * Expert-only section on the Profile page that lists the user's sensor devices.
 * Provides Add, Edit, and Delete actions.
 * Follows the same pattern as TentList + TentModal.
 */

import { useState } from 'react'
import { Plus, Pencil, Trash2, Radio } from 'lucide-react'
import { toast } from 'sonner'
import { Eyebrow } from '@/components/shell'
import { useSensorDevices, useDeleteSensorDevice } from '@/lib/hooks/useSensors'
import { getApiErrorToastMessage } from '@/lib/api/errors'
import type { SensorDevice } from '@/types/sensors'
import { SensorModal } from './SensorModal'

const PROVIDER_LABELS: Record<string, string> = {
  govee: 'Govee',
  inkbird: 'Inkbird',
  switchbot: 'SwitchBot',
  manual: 'Manual',
}

function formatLastPoll(iso: string | null): string {
  if (!iso) return 'Never polled'
  const date = new Date(iso)
  const diff = Math.round((Date.now() - date.getTime()) / 60_000)
  if (diff < 1) return 'Just now'
  if (diff < 60) return `${diff}m ago`
  if (diff < 1440) return `${Math.round(diff / 60)}h ago`
  return date.toLocaleDateString()
}

export function SensorDevicesSection() {
  const { data, isLoading } = useSensorDevices()
  const deleteDevice = useDeleteSensorDevice()
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<SensorDevice | null>(null)

  const devices = data?.devices ?? []

  const handleDelete = async (device: SensorDevice) => {
    if (deleteDevice.isPending) return
    setPendingDelete(device.id)
    try {
      await deleteDevice.mutateAsync(device.id)
    } catch (err) {
      toast.error(getApiErrorToastMessage(err, 'Failed to remove sensor'))
    } finally {
      setPendingDelete(null)
    }
  }

  const openCreate = () => {
    setEditingDevice(null)
    setModalOpen(true)
  }

  const openEdit = (device: SensorDevice) => {
    setEditingDevice(device)
    setModalOpen(true)
  }

  return (
    <section className="px-5 pb-6" aria-labelledby="sensors-heading">
      <div className="mb-3 flex items-center justify-between">
        <Eyebrow tone="muted" id="sensors-heading" role="heading" aria-level={2}>
          Sensor Devices
        </Eyebrow>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 font-mono text-[11px] uppercase tracking-eyebrow text-fg-2 hover:bg-card-2"
          aria-label="Add sensor device"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg border border-line bg-card" />
          ))}
        </div>
      ) : devices.length === 0 ? (
        <div className="rounded-lg border border-line bg-card p-4 text-center">
          <Radio className="mx-auto mb-2 h-5 w-5 text-fg-3" aria-hidden="true" />
          <p className="text-sm text-fg-3">
            No sensor devices yet. Add one to start monitoring temperature and humidity.
          </p>
        </div>
      ) : (
        <ul className="space-y-2" aria-label="Sensor devices">
          {devices.map((device) => (
            <li
              key={device.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-line bg-card p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-semibold text-fg">{device.label}</p>
                <p className="mt-0.5 font-mono text-[11px] uppercase tracking-eyebrow text-fg-3">
                  {PROVIDER_LABELS[device.provider] ?? device.provider}
                  {device.lastError && (
                    <span className="ml-2 text-status-warn">· Error</span>
                  )}
                  {!device.lastError && (
                    <span className="ml-2 text-fg-3">· {formatLastPoll(device.lastPollAt)}</span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(device)}
                  className="rounded-lg p-1.5 text-fg-3 hover:bg-card-2 hover:text-fg"
                  aria-label={`Edit ${device.label}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(device)}
                  disabled={pendingDelete === device.id}
                  className="rounded-lg p-1.5 text-fg-3 hover:bg-card-2 hover:text-status-warn disabled:opacity-40"
                  aria-label={`Delete ${device.label}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <SensorModal
        device={editingDevice}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </section>
  )
}
