/**
 * GrowLab StageMode Onboarding (F2)
 *
 * Full-screen overlay shown to a user with `hasOnboarded === false`.
 * Two cards (Basic / Expert) explain the trade-off; selecting one
 * fires `PATCH /me { stageMode, hasOnboarded: true }` and dismisses
 * the overlay.
 *
 * The toggle in Profile is independent of `hasOnboarded`, so users can
 * always change their mind later. Hard-disable on submission so a
 * double-tap doesn't fire two patches.
 */

import { useState } from 'react'
import { toast } from 'sonner'
import { Sparkles, Layers, Check } from 'lucide-react'
import { useUpdateMe } from '@/lib/hooks/useUpdateMe'
import { getApiErrorToastMessage } from '@/lib/api/errors'
import { Eyebrow, H1 } from '@/components/shell'
import type { StageMode } from '@/types/auth'

export function StageModeOnboarding() {
  const updateMe = useUpdateMe()
  const [selected, setSelected] = useState<StageMode | null>(null)

  const handleContinue = async () => {
    if (!selected || updateMe.isPending) return
    try {
      await updateMe.mutateAsync({
        stageMode: selected,
        hasOnboarded: true,
      })
      toast.success(
        selected === 'basic'
          ? 'Welcome — Basic mode enabled'
          : 'Welcome — Expert mode enabled',
      )
    } catch (err) {
      toast.error(getApiErrorToastMessage(err, 'Failed to save preference'))
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-bg/95 backdrop-blur-sm animate-gl-modal-in"
      role="dialog"
      aria-modal="true"
      aria-label="Choose your stage mode"
    >
      <div className="relative mx-auto flex h-dvh w-full max-w-[412px] flex-col overflow-y-auto px-5 py-8">
        <header className="mb-8 text-center">
          <Eyebrow tone="accent" className="mb-3 block">Welcome</Eyebrow>
          <H1 className="mb-3 text-[28px]">Pick your view</H1>
          <p className="mx-auto max-w-[300px] text-sm text-fg-3">
            Choose how detailed the growth tracker should be. You can
            switch any time from your Profile.
          </p>
        </header>

        <div className="flex-1 space-y-3">
          <ModeCard
            mode="basic"
            title="Basic"
            tagline="Simple. 4 stages."
            description="Seedling → Veg → Flower → Harvest. Best when you're getting started or growing autoflowers."
            icon={<Layers className="h-7 w-7" />}
            active={selected === 'basic'}
            onSelect={() => setSelected('basic')}
            disabled={updateMe.isPending}
          />
          <ModeCard
            mode="expert"
            title="Expert"
            tagline="Detailed. 7 stages."
            description="Adds harvesting, drying, curing, and completed. Surfaces light cycle, environmental targets, and stage durations."
            icon={<Sparkles className="h-7 w-7" />}
            active={selected === 'expert'}
            onSelect={() => setSelected('expert')}
            disabled={updateMe.isPending}
          />
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={handleContinue}
            disabled={!selected || updateMe.isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 h-12 text-[15px] font-bold text-bg shadow-accent-glow transition-transform hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            {updateMe.isPending ? 'Saving…' : 'Continue'}
          </button>
          <p className="mt-3 text-center text-[11px] text-fg-4">
            Reversible from Profile · Storage is identical for both modes.
          </p>
        </div>
      </div>
    </div>
  )
}

interface ModeCardProps {
  mode: StageMode
  title: string
  tagline: string
  description: string
  icon: React.ReactNode
  active: boolean
  disabled: boolean
  onSelect: () => void
}

function ModeCard({
  title,
  tagline,
  description,
  icon,
  active,
  disabled,
  onSelect,
}: ModeCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={active}
      className={[
        'flex w-full items-start gap-4 rounded-xl border-2 p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        active
          ? 'border-accent bg-accent-soft shadow-[0_0_0_1px_rgb(34_226_106/0.5),0_0_24px_rgba(34,226,106,0.15)]'
          : 'border-line bg-card hover:bg-card-2',
        disabled ? 'opacity-60 cursor-not-allowed' : '',
      ].join(' ')}
    >
      <div
        className={[
          'flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg',
          active ? 'bg-accent text-bg' : 'bg-bg-2 text-fg-3',
        ].join(' ')}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <p className="font-display text-lg font-bold text-fg">{title}</p>
          {active && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-bg">
              <Check className="h-3 w-3" />
            </span>
          )}
        </div>
        <p className="font-mono text-[10px] uppercase tracking-eyebrow text-fg-3">
          {tagline}
        </p>
        <p className="mt-2 text-sm text-fg-2">{description}</p>
      </div>
    </button>
  )
}
