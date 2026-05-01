/**
 * GrowLab Plant Detail Page
 * 
 * Displays comprehensive information about a single plant including
 * growth stage, health status, and actions.
 * Route: /plants/$plantId
 */

import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import {
  Leaf,
  ArrowLeft,
  Trash2,
  ChevronRight,
  Calendar,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '@/lib/stores/auth'
import { usePlant, useUpdatePlant, useDeletePlant } from '@/lib/hooks/usePlants'
import { CareLogList } from '@/components/care-logs/CareLogList'
import type { GrowthStage, HealthStatus, StrainType } from '@/types/plants'
import {
  GROWTH_STAGE_CONFIG,
  HEALTH_STATUS_CONFIG,
  STRAIN_TYPE_CONFIG,
} from '@/types/plants'

/**
 * Calculate days since a date
 */
function daysSince(dateStr: string): number {
  const date = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Format a date for display
 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Valid next stage transitions */
const NEXT_STAGE: Record<string, GrowthStage | null> = {
  seedling: 'vegetative',
  vegetative: 'flowering',
  flowering: 'harvesting',
  harvesting: 'drying',
  drying: 'curing',
  curing: 'completed',
  completed: null,
}

export default function PlantDetailPage() {
  const navigate = useNavigate()
  const { plantId } = useParams<{ plantId: string }>()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { data: plant, isLoading, error } = usePlant(plantId)
  const updatePlant = useUpdatePlant()
  const deletePlant = useDeletePlant()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Redirect to login if not authenticated
  if (!authLoading && !isAuthenticated) {
    navigate('/login')
    return null
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Leaf className="mx-auto h-12 w-12 animate-pulse text-primary-600" />
          <p className="mt-4 text-gray-600">Loading plant...</p>
        </div>
      </div>
    )
  }

  if (error || !plant) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="card max-w-md text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Plant Not Found</h2>
          <p className="mb-6 text-gray-600">
            This plant doesn't exist or you don't have access to it.
          </p>
          <button
            onClick={() => navigate('/garden')}
            className="btn-primary"
          >
            Back to Garden
          </button>
        </div>
      </div>
    )
  }

  const stageConfig = GROWTH_STAGE_CONFIG[plant.growthStage as GrowthStage]
  const healthConfig = HEALTH_STATUS_CONFIG[plant.healthStatus as HealthStatus]
  const strainConfig = STRAIN_TYPE_CONFIG[plant.strainType as StrainType]
  const daysInStage = daysSince(plant.stageStartDate)
  const totalAge = daysSince(plant.createdAt)
  const nextStage = NEXT_STAGE[plant.growthStage]

  const handleAdvanceStage = async () => {
    if (!nextStage) return
    setActionError(null)
    try {
      await updatePlant.mutateAsync({
        plantId: plant.id,
        data: { growthStage: nextStage },
      })
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to advance stage')
    }
  }

  const handleDelete = async () => {
    setActionError(null)
    try {
      await deletePlant.mutateAsync(plant.id)
      navigate('/garden')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete plant')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <button
            onClick={() => navigate('/garden')}
            className="flex items-center gap-2 rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Garden</span>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Delete plant"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* Error */}
        {actionError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{actionError}</p>
          </div>
        )}

        {/* Hero Section */}
        <div className="card mb-6">
          <div className="flex gap-4">
            {/* Plant Image */}
            <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50">
              {plant.photoUrl ? (
                <img
                  src={plant.photoUrl}
                  alt={plant.name}
                  className="h-full w-full rounded-xl object-cover"
                />
              ) : (
                <Leaf className="h-10 w-10 text-primary-400" />
              )}
            </div>

            {/* Plant Info */}
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{plant.name}</h1>
              <p className="text-gray-500">{strainConfig?.label ?? plant.strainType}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${stageConfig?.bgColor} ${stageConfig?.color}`}>
                  {stageConfig?.label}
                </span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${healthConfig?.bgColor} ${healthConfig?.color}`}>
                  {healthConfig?.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="card text-center">
            <Calendar className="mx-auto mb-1 h-5 w-5 text-gray-400" />
            <p className="text-lg font-bold text-gray-900">{totalAge}</p>
            <p className="text-xs text-gray-500">Days Old</p>
          </div>
          <div className="card text-center">
            <Clock className="mx-auto mb-1 h-5 w-5 text-gray-400" />
            <p className="text-lg font-bold text-gray-900">{daysInStage}</p>
            <p className="text-xs text-gray-500">Days in Stage</p>
          </div>
          <div className="card text-center">
            <Leaf className="mx-auto mb-1 h-5 w-5 text-gray-400" />
            <p className="text-lg font-bold text-gray-900">{stageConfig?.label}</p>
            <p className="text-xs text-gray-500">Current Stage</p>
          </div>
        </div>

        {/* Advance Stage */}
        {nextStage && (
          <div className="card mb-6">
            <h3 className="mb-3 text-sm font-medium text-gray-700">Growth Stage</h3>
            <button
              onClick={handleAdvanceStage}
              disabled={updatePlant.isPending}
              className="flex w-full items-center justify-between rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-left transition-colors hover:bg-primary-100"
            >
              <div>
                <p className="font-medium text-primary-800">
                  {updatePlant.isPending ? 'Advancing...' : `Advance to ${GROWTH_STAGE_CONFIG[nextStage].label}`}
                </p>
                <p className="text-sm text-primary-600">
                  {GROWTH_STAGE_CONFIG[nextStage].description}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-primary-400" />
            </button>
          </div>
        )}

        {/* Details */}
        <div className="card mb-6">
          <h3 className="mb-4 text-sm font-medium text-gray-700">Details</h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Strain</dt>
              <dd className="text-sm font-medium text-gray-900">{strainConfig?.label}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Stage Start</dt>
              <dd className="text-sm font-medium text-gray-900">{formatDate(plant.stageStartDate)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Added</dt>
              <dd className="text-sm font-medium text-gray-900">{formatDate(plant.createdAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Last Updated</dt>
              <dd className="text-sm font-medium text-gray-900">{formatDate(plant.updatedAt)}</dd>
            </div>
          </dl>
        </div>

        {/* Notes */}
        {plant.notes && (
          <div className="card mb-6">
            <h3 className="mb-2 text-sm font-medium text-gray-700">Notes</h3>
            <p className="whitespace-pre-wrap text-sm text-gray-600">{plant.notes}</p>
          </div>
        )}

        {/* Care Logging */}
        <CareLogList plantId={plant.id} />
      </main>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-gray-900">Delete Plant</h3>
            <p className="mb-6 text-sm text-gray-600">
              Are you sure you want to delete <strong>{plant.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deletePlant.isPending}
                className="btn flex-1 bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
              >
                {deletePlant.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
