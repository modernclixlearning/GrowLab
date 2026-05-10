/**
 * GrowLab Profile — ToggleStageMode (F2)
 *
 * Two-state toggle (Basic / Expert) wired to `useUpdateMe`. Optimistic
 * UX: while pending we show the target value as active and disable both
 * buttons. Sonner toasts on success/error per CLAUDE.md UI Feedback
 * Standard.
 */

import { useState } from 'react'
import { toast } from 'sonner'
import { useUpdateMe } from '@/lib/hooks/useUpdateMe'
import { getApiErrorToastMessage } from '@/lib/api/errors'
import type { StageMode } from '@/types/auth'

export interface ToggleStageModeProps {
  current: StageMode
}

export function ToggleStageMode({ current }: ToggleStageModeProps) {
  const updateMe = useUpdateMe()
  const [pendingTarget, setPendingTarget] = useState<StageMode | null>(null)

  const display: StageMode = pendingTarget ?? current

  const handleSelect = async (next: StageMode) => {
    if (next === current || updateMe.isPending) return
    setPendingTarget(next)
    try {
      await updateMe.mutateAsync({ stageMode: next })
      toast.success(
        next === 'basic'
          ? 'Stage mode set to Basic'
          : 'Stage mode set to Expert',
      )
    } catch (err) {
      toast.error(getApiErrorToastMessage(err, 'Failed to update stage mode'))
    } finally {
      setPendingTarget(null)
    }
  }

  return (
    <div
      className="inline-flex items-center rounded-full border border-line bg-bg-1 p-1"
      role="group"
      aria-label="Stage mode"
    >
      <ToggleButton
        active={display === 'basic'}
        disabled={updateMe.isPending}
        onClick={() => handleSelect('basic')}
        label="Basic"
      />
      <ToggleButton
        active={display === 'expert'}
        disabled={updateMe.isPending}
        onClick={() => handleSelect('expert')}
        label="Expert"
      />
    </div>
  )
}

function ToggleButton({
  active,
  disabled,
  onClick,
  label,
}: {
  active: boolean
  disabled: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={[
        'rounded-full px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-eyebrow transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        active
          ? 'bg-accent-soft text-accent shadow-accent-glow'
          : 'text-fg-3 hover:text-fg',
        disabled ? 'opacity-60 cursor-not-allowed' : '',
      ].join(' ')}
    >
      {label}
    </button>
  )
}
