/**
 * GrowLab Add Plant Modal — F1 3-step flow.
 *
 * Master Plan §3 F1 deliverable: refactor the previous single-form modal
 * into a 3-step `<Stepper>` flow:
 *   1. Photo (URL temporary, F4 swaps in R2 upload)
 *   2. Strain + name
 *   3. Growth stage selection (cards)
 *
 * Constraints respected:
 *   - 7 stages still exposed (Basic/Expert toggle is F2).
 *   - No light cycle (F2 Expert).
 *   - Sonner success/error toasts on create.
 *   - Schema enums match the existing API (`strainType`, `growthStage`).
 *
 * The form state is hand-rolled (not react-hook-form) because each step
 * owns a small slice of fields and we want forward/back nav without
 * losing partial data — a state machine is overkill for 3 fields.
 */

import { useState } from 'react'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  Camera,
  Image as ImageIcon,
  AlertCircle,
  Sprout,
  Leaf,
  Flower2,
  Scissors,
  Wind,
  Package,
  CheckCircle2,
} from 'lucide-react'
import { useCreatePlant } from '@/lib/hooks/usePlants'
import { getApiErrorToastMessage } from '@/lib/api/errors'
import { Stepper } from '@/components/ui/Stepper'
import type { GrowthStage, StrainType } from '@/types/plants'
import {
  GROWTH_STAGE_CONFIG,
  STRAIN_TYPE_CONFIG,
} from '@/types/plants'

/** Stages a user may select when creating a plant (excluding `completed`). */
const CREATABLE_STAGES: GrowthStage[] = [
  'seedling',
  'vegetative',
  'flowering',
  'harvesting',
  'drying',
  'curing',
]

const STAGE_ICON: Record<GrowthStage, React.ComponentType<{ className?: string }>> = {
  seedling: Sprout,
  vegetative: Leaf,
  flowering: Flower2,
  harvesting: Scissors,
  drying: Wind,
  curing: Package,
  completed: CheckCircle2,
}

/** Optional URL validator — empty string is allowed (no photo yet). */
const optionalUrl = z
  .string()
  .trim()
  .refine(
    (v) => v === '' || /^https?:\/\/\S+\.\S+/.test(v),
    'Enter a valid http(s) URL or leave blank',
  )

interface AddPlantModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface FormState {
  photoUrl: string
  name: string
  strainType: StrainType | ''
  growthStage: GrowthStage
}

const INITIAL: FormState = {
  photoUrl: '',
  name: '',
  strainType: '',
  growthStage: 'seedling',
}

const TOTAL_STEPS = 3

export function AddPlantModal({ isOpen, onClose, onSuccess }: AddPlantModalProps) {
  const createPlant = useCreatePlant()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(INITIAL)
  const [stepError, setStepError] = useState<string | null>(null)

  if (!isOpen) return null

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setStepError(null)
  }

  const reset = () => {
    setForm(INITIAL)
    setStep(1)
    setStepError(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  /** Validate the active step before allowing forward navigation. */
  const validateStep = (n: number): string | null => {
    if (n === 1) {
      const parsed = optionalUrl.safeParse(form.photoUrl)
      if (!parsed.success) return parsed.error.issues[0]?.message ?? 'Invalid URL'
      return null
    }
    if (n === 2) {
      if (!form.name.trim()) return 'Plant name is required'
      if (form.name.trim().length > 100) return 'Name too long'
      if (!form.strainType) return 'Select a strain type'
      return null
    }
    if (n === 3) {
      if (!CREATABLE_STAGES.includes(form.growthStage)) return 'Pick a stage'
      return null
    }
    return null
  }

  const handleNext = async () => {
    const err = validateStep(step)
    if (err) {
      setStepError(err)
      return
    }

    if (step < TOTAL_STEPS) {
      setStep(step + 1)
      return
    }

    // Final step — submit.
    if (!form.strainType) return // type narrowing, validateStep already gated.
    try {
      await createPlant.mutateAsync({
        name: form.name.trim(),
        strainType: form.strainType,
        growthStage: form.growthStage,
        photoUrl: form.photoUrl.trim() || undefined,
      })
      toast.success(`${form.name.trim()} added to your garden`)
      onSuccess?.()
      reset()
      onClose()
    } catch (err) {
      const message = getApiErrorToastMessage(err, 'Failed to create plant')
      setStepError(message)
      toast.error(message)
    }
  }

  const handleBack = () => {
    setStepError(null)
    if (step > 1) setStep(step - 1)
    else handleClose()
  }

  const stepTitle =
    step === 1 ? 'Plant Photo' : step === 2 ? 'Strain & Name' : 'Growth Stage'

  const isFinal = step === TOTAL_STEPS
  const submitting = createPlant.isPending

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Add new plant"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-bg/85" onClick={handleClose} />

      {/* Modal */}
      <div className="relative mx-auto flex w-full max-w-lg flex-col rounded-t-2xl border-t border-line bg-card shadow-xl animate-gl-modal-in sm:mx-4 sm:rounded-2xl sm:border max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line p-4">
          <button
            onClick={handleBack}
            className="flex h-10 w-10 items-center justify-center rounded-md text-fg transition-colors hover:bg-card-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            aria-label={step === 1 ? 'Close' : 'Previous step'}
          >
            {step === 1 ? <X className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          </button>
          <span className="font-display text-base font-bold">Add New Plant</span>
          <button
            onClick={handleClose}
            className="rounded-md px-3 h-10 text-sm text-fg-3 transition-colors hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Cancel
          </button>
        </div>

        {/* Stepper */}
        <div className="px-5 pt-5">
          <Stepper current={step} total={TOTAL_STEPS} title={stepTitle} />
        </div>

        {/* Step body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {stepError && (
            <div
              role="alert"
              className="mb-4 flex items-center gap-2 rounded-md border border-status-warn/40 bg-status-warn/10 p-3 text-status-warn"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{stepError}</p>
            </div>
          )}

          {step === 1 && <Step1Photo form={form} update={update} />}
          {step === 2 && <Step2Details form={form} update={update} />}
          {step === 3 && <Step3Stage form={form} update={update} />}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-line bg-card p-4">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex flex-shrink-0 items-center justify-center rounded-full border border-line-2 bg-transparent px-5 h-12 text-sm font-semibold text-fg transition-colors hover:bg-card-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={submitting}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-accent px-5 h-12 text-[15px] font-bold text-bg shadow-accent-glow transition-transform hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-60 disabled:hover:scale-100"
          >
            {submitting ? (
              'Creating...'
            ) : isFinal ? (
              <>
                Add to Garden <Check className="h-4 w-4" />
              </>
            ) : (
              <>
                Continue <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Step 1 — Photo
// ─────────────────────────────────────────────────────────────
function Step1Photo({
  form,
  update,
}: {
  form: FormState
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
}) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-fg-2">
        Paste a photo URL — uploads coming soon. We'll use this for the plant
        card and detail hero.
      </p>

      {/* Upload zone preview */}
      <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-line-2 bg-bg-1 px-5 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-accent">
          {form.photoUrl ? (
            <ImageIcon className="h-7 w-7" />
          ) : (
            <Camera className="h-7 w-7" />
          )}
        </div>
        {form.photoUrl ? (
          <img
            src={form.photoUrl}
            alt="Plant preview"
            className="max-h-40 w-full rounded-md object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <>
            <p className="font-display text-base font-bold text-fg">Plant Photo</p>
            <p className="text-sm text-fg-3 max-w-xs">
              Optional. Add a link to track visual growth from day one.
            </p>
          </>
        )}
      </div>

      <div>
        <label
          htmlFor="photoUrl"
          className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-eyebrow text-fg-2"
        >
          Photo URL
        </label>
        <input
          id="photoUrl"
          type="url"
          value={form.photoUrl}
          onChange={(e) => update('photoUrl', e.target.value)}
          className="w-full rounded-md border border-line bg-bg-1 px-4 h-12 text-[15px] text-fg placeholder:text-fg-4 outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
          placeholder="https://..."
        />
        <p className="mt-2 text-xs text-fg-3">
          Uploads coming soon — F4 wires direct upload to Cloudflare R2.
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Step 2 — Strain + name
// ─────────────────────────────────────────────────────────────
function Step2Details({
  form,
  update,
}: {
  form: FormState
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
}) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-fg-2">
        Every great harvest starts with a name. We'll use this on the garden
        cards and care logs.
      </p>

      <div>
        <label
          htmlFor="plantName"
          className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-eyebrow text-fg-2"
        >
          Plant Name
        </label>
        <input
          id="plantName"
          type="text"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          autoFocus
          className="w-full rounded-md border border-line bg-bg-1 px-4 h-12 text-[15px] text-fg placeholder:text-fg-4 outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
          placeholder='e.g., "OG Kush #1"'
        />
      </div>

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
        <p className="mt-2 text-xs text-fg-3">
          Strain catalog with named templates lands in F2.
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Step 3 — Stage selection
// ─────────────────────────────────────────────────────────────
function Step3Stage({
  form,
  update,
}: {
  form: FormState
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-fg-2">
        Pick the current development phase. We'll calibrate tracking from here.
      </p>
      <div className="space-y-2">
        {CREATABLE_STAGES.map((stage) => {
          const config = GROWTH_STAGE_CONFIG[stage]
          const Icon = STAGE_ICON[stage]
          const active = form.growthStage === stage
          return (
            <button
              key={stage}
              type="button"
              onClick={() => update('growthStage', stage)}
              aria-pressed={active}
              className={[
                'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                active
                  ? 'border-accent bg-accent-soft shadow-[0_0_0_1px_rgb(34_226_106/0.5),0_0_24px_rgba(34,226,106,0.15)]'
                  : 'border-line bg-card hover:bg-card-2',
              ].join(' ')}
            >
              <div
                className={[
                  'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md',
                  active ? 'bg-accent-soft text-accent' : 'bg-bg-2 text-fg-3',
                ].join(' ')}
                aria-hidden="true"
              >
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-bold text-fg">
                  {config.label}
                </p>
                <p className="mt-0.5 text-xs text-fg-3">{config.description}</p>
              </div>
              <span
                className={[
                  'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border',
                  active
                    ? 'border-transparent bg-accent text-bg'
                    : 'border-line-2 bg-transparent',
                ].join(' ')}
                aria-hidden="true"
              >
                {active && <Check className="h-4 w-4" />}
              </span>
            </button>
          )
        })}
      </div>
      <p className="pt-1 text-xs text-fg-3">
        Light cycle and tent assignment ship with F2 (Expert).
      </p>
    </div>
  )
}

// Exported for tests (pure validators).
export { CREATABLE_STAGES }
