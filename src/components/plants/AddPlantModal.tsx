/**
 * GrowLab Add Plant Modal
 *
 * Modal form for creating a new plant with name, strain type,
 * growth stage, and optional notes.
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { X, Leaf, AlertCircle } from 'lucide-react'
import { useCreatePlant } from '@/lib/hooks/usePlants'
import { getApiErrorToastMessage } from '@/lib/api/errors'
import { H2 } from '@/components/shell'
import type { GrowthStage, StrainType } from '@/types/plants'
import { GROWTH_STAGE_CONFIG, STRAIN_TYPE_CONFIG } from '@/types/plants'

const addPlantSchema = z.object({
  name: z.string().min(1, 'Plant name is required').max(100, 'Name too long'),
  strainType: z.enum(['indica', 'sativa', 'hybrid', 'auto'] as const, {
    errorMap: () => ({ message: 'Select a strain type' }),
  }),
  growthStage: z.enum([
    'seedling', 'vegetative', 'flowering', 'harvesting', 'drying', 'curing',
  ] as const).default('seedling'),
  notes: z.string().max(1000).optional(),
})

type AddPlantFormData = z.infer<typeof addPlantSchema>

interface AddPlantModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

/** Stages available when creating a new plant (can't start as completed) */
const CREATABLE_STAGES: GrowthStage[] = ['seedling', 'vegetative', 'flowering', 'harvesting', 'drying', 'curing']

const labelClasses = 'mb-2 block text-sm font-medium text-fg-2'
const inputClasses =
  'w-full rounded-md border bg-bg-2 px-3 py-2.5 text-sm text-fg placeholder:text-fg-4 focus:outline-none focus:ring-1 transition-colors'
const inputBorderOk = 'border-line focus:border-accent focus:ring-accent'
const inputBorderErr = 'border-status-warn focus:border-status-warn focus:ring-status-warn'

export function AddPlantModal({ isOpen, onClose, onSuccess }: AddPlantModalProps) {
  const createPlant = useCreatePlant()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddPlantFormData>({
    resolver: zodResolver(addPlantSchema),
    defaultValues: {
      growthStage: 'seedling',
    },
  })

  const onSubmit = async (data: AddPlantFormData) => {
    setError(null)
    try {
      await createPlant.mutateAsync({
        name: data.name,
        strainType: data.strainType,
        growthStage: data.growthStage,
        notes: data.notes || undefined,
      })
      toast.success(`${data.name} added to your garden`)
      reset()
      onSuccess?.()
      onClose()
    } catch (err) {
      const message = getApiErrorToastMessage(err, 'Failed to create plant')
      setError(message)
      toast.error(message)
    }
  }

  const handleClose = () => {
    reset()
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-bg/80"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative mx-auto w-full max-w-lg rounded-t-2xl border-t border-line bg-card p-6 shadow-xl animate-gl-modal-in sm:mx-4 sm:rounded-2xl sm:border">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-soft text-accent">
              <Leaf className="h-5 w-5" />
            </div>
            <H2 className="text-[20px]">Add New Plant</H2>
          </div>
          <button
            onClick={handleClose}
            className="rounded-md p-2 text-fg-3 transition-colors hover:bg-card-2 hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            aria-label="Close add plant modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-md border border-status-warn/40 bg-status-warn/10 p-3 text-status-warn">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Plant Name */}
          <div>
            <label htmlFor="name" className={labelClasses}>
              Plant Name
            </label>
            <input
              {...register('name')}
              type="text"
              id="name"
              className={`${inputClasses} ${errors.name ? inputBorderErr : inputBorderOk}`}
              placeholder='e.g., "OG Kush #1"'
            />
            {errors.name && (
              <p className="mt-1 text-sm text-status-warn">{errors.name.message}</p>
            )}
          </div>

          {/* Strain Type */}
          <div>
            <label htmlFor="strainType" className={labelClasses}>
              Strain Type
            </label>
            <select
              {...register('strainType')}
              id="strainType"
              className={`${inputClasses} ${errors.strainType ? inputBorderErr : inputBorderOk}`}
            >
              <option value="">Select strain type...</option>
              {(Object.entries(STRAIN_TYPE_CONFIG) as [StrainType, { label: string }][]).map(
                ([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                )
              )}
            </select>
            {errors.strainType && (
              <p className="mt-1 text-sm text-status-warn">{errors.strainType.message}</p>
            )}
          </div>

          {/* Growth Stage */}
          <div>
            <label className={labelClasses}>
              Current Growth Stage
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CREATABLE_STAGES.map((stage) => {
                const config = GROWTH_STAGE_CONFIG[stage]
                return (
                  <label
                    key={stage}
                    className="cursor-pointer"
                  >
                    <input
                      {...register('growthStage')}
                      type="radio"
                      value={stage}
                      className="peer sr-only"
                    />
                    <div className="rounded-md border-2 border-line bg-bg-2 p-3 text-center transition-colors peer-checked:border-accent peer-checked:bg-accent-soft hover:border-line-2">
                      <p className="text-sm font-medium text-fg">
                        {config.label}
                      </p>
                      <p className="mt-0.5 text-xs text-fg-3">
                        {config.description}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className={labelClasses}>
              Notes <span className="text-fg-4">(optional)</span>
            </label>
            <textarea
              {...register('notes')}
              id="notes"
              rows={3}
              className={`${inputClasses} ${inputBorderOk} resize-none`}
              placeholder="Any notes about this plant..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex flex-1 items-center justify-center rounded-md border border-line bg-card-2 px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPlant.isPending}
              className="inline-flex flex-1 items-center justify-center rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-bg shadow-accent-glow transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-60 disabled:hover:scale-100"
            >
              {createPlant.isPending ? 'Creating...' : 'Add Plant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
