/**
 * GrowLab Profile — TentList (F2)
 *
 * Inline list of the user's tents with edit/delete actions. Used by the
 * Profile screen below the PrefsList. Empty state is handled by the
 * parent (PrefsList shows a counter + Add CTA).
 */

import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'
import { Eyebrow } from '@/components/shell'
import { useDeleteTent } from '@/lib/hooks/useTents'
import { getApiErrorToastMessage } from '@/lib/api/errors'
import type { Tent } from '@/types/tents'

export interface TentListProps {
  tents: Tent[]
  onEdit: (tent: Tent) => void
}

export function TentList({ tents, onEdit }: TentListProps) {
  const deleteTent = useDeleteTent()
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  if (tents.length === 0) return null

  const handleDelete = async (tent: Tent) => {
    if (deleteTent.isPending) return
    setPendingDelete(tent.id)
    try {
      await deleteTent.mutateAsync(tent.id)
      toast.success(`${tent.name} deleted`)
    } catch (err) {
      toast.error(getApiErrorToastMessage(err, 'Failed to delete tent'))
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <section className="px-5 pb-6">
      <Eyebrow tone="muted" className="mb-3 block">Tents</Eyebrow>
      <ul className="space-y-2" aria-label="Tent profiles">
        {tents.map((tent) => (
          <li
            key={tent.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-line bg-card p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-semibold text-fg">
                {tent.name}
              </p>
              <p className="mt-0.5 truncate font-mono text-[11px] uppercase tracking-eyebrow text-fg-3">
                {/* `!= null` instead of truthy: a numeric "0" string is
                    falsy in some Drizzle return paths, which would silently
                    hide a 0% humidity / 0°C reading. Empty-string check
                    only on the free-form text field. */}
                {[
                  tent.lightTarget != null && tent.lightTarget !== ''
                    ? `LIGHT ${tent.lightTarget}`
                    : null,
                  tent.humidityTargetPct != null
                    ? `${tent.humidityTargetPct}% RH`
                    : null,
                  tent.tempTargetC != null
                    ? `${tent.tempTargetC}°C`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'No targets set'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit(tent)}
                aria-label={`Edit ${tent.name}`}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-card-2 text-fg-2 transition-colors hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(tent)}
                disabled={pendingDelete === tent.id}
                aria-label={`Delete ${tent.name}`}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-card-2 text-fg-2 transition-colors hover:text-status-warn hover:border-status-warn/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-status-warn focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
