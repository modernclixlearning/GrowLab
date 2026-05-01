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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl mx-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
              <Leaf className="h-5 w-5 text-primary-700" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Add New Plant</h2>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close add plant modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Plant Name */}
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
              Plant Name
            </label>
            <input
              {...register('name')}
              type="text"
              id="name"
              className={`input ${errors.name ? 'input-error' : ''}`}
              placeholder='e.g., "OG Kush #1"'
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Strain Type */}
          <div>
            <label htmlFor="strainType" className="mb-2 block text-sm font-medium text-gray-700">
              Strain Type
            </label>
            <select
              {...register('strainType')}
              id="strainType"
              className={`input ${errors.strainType ? 'input-error' : ''}`}
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
              <p className="mt-1 text-sm text-red-600">{errors.strainType.message}</p>
            )}
          </div>

          {/* Growth Stage */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
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
                    <div className="rounded-lg border-2 border-gray-200 p-3 text-center transition-colors peer-checked:border-primary-500 peer-checked:bg-primary-50 hover:border-gray-300">
                      <p className="text-sm font-medium text-gray-900">
                        {config.label}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
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
            <label htmlFor="notes" className="mb-2 block text-sm font-medium text-gray-700">
              Notes <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              {...register('notes')}
              id="notes"
              rows={3}
              className="input resize-none"
              placeholder="Any notes about this plant..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPlant.isPending}
              className="btn-primary flex-1"
            >
              {createPlant.isPending ? 'Creating...' : 'Add Plant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
