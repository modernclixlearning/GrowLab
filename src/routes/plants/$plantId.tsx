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
import { Eyebrow, H1, H2, H3 } from '@/components/shell'
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
  const { data: plant, isLoading, error } = usePlant(plantId ?? '')
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
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="text-center">
          <Leaf className="mx-auto h-12 w-12 animate-pulse text-accent" />
          <p className="mt-4 text-fg-3">Loading plant...</p>
        </div>
      </div>
    )
  }

  if (error || !plant) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-lg border border-line bg-card max-w-md p-6 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-status-warn" />
          <H2 className="mb-2">Plant Not Found</H2>
          <p className="mb-6 text-sm text-fg-3">
            This plant doesn't exist or you don't have access to it.
          </p>
          <button
            onClick={() => navigate('/garden')}
            className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-bg shadow-accent-glow transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
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
    <div className="min-h-full">
      {/* Header */}
      <header className="border-b border-line/60 px-5 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/garden')}
            className="flex items-center gap-2 rounded-md p-2 text-fg-2 transition-colors hover:bg-card hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Garden</span>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-md p-2 text-fg-3 transition-colors hover:bg-status-warn/15 hover:text-status-warn focus:outline-none focus-visible:ring-2 focus-visible:ring-status-warn focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            aria-label="Delete plant"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="px-5 py-5">
        {/* Error */}
        {actionError && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-status-warn/40 bg-status-warn/10 p-3 text-status-warn">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{actionError}</p>
          </div>
        )}

        {/* Hero Section */}
        <div className="mb-5 rounded-lg border border-line bg-card p-5">
          <div className="flex gap-4">
            {/* Plant Image */}
            <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-lg bg-card-2 border border-line">
              {plant.photoUrl ? (
                <img
                  src={plant.photoUrl}
                  alt={plant.name}
                  className="h-full w-full rounded-lg object-cover"
                />
              ) : (
                <Leaf className="h-10 w-10 text-fg-3" />
              )}
            </div>

            {/* Plant Info */}
            <div className="min-w-0 flex-1">
              <Eyebrow tone="muted">{strainConfig?.label ?? plant.strainType}</Eyebrow>
              <H1 className="text-[26px] mt-0.5">{plant.name}</H1>
              <div className="mt-2 flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-eyebrow ${stageConfig?.bgColor} ${stageConfig?.color}`}
                >
                  {stageConfig?.label}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-eyebrow ${healthConfig?.bgColor} ${healthConfig?.color}`}
                >
                  {healthConfig?.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          <StatTile
            icon={<Calendar className="h-5 w-5" />}
            value={String(totalAge)}
            label="Days Old"
          />
          <StatTile
            icon={<Clock className="h-5 w-5" />}
            value={String(daysInStage)}
            label="In Stage"
          />
          <StatTile
            icon={<Leaf className="h-5 w-5" />}
            value={stageConfig?.label ?? '—'}
            label="Stage"
          />
        </div>

        {/* Advance Stage */}
        {nextStage && (
          <div className="mb-5 rounded-lg border border-line bg-card p-4">
            <Eyebrow tone="accent" className="mb-2 block">Growth Stage</Eyebrow>
            <button
              onClick={handleAdvanceStage}
              disabled={updatePlant.isPending}
              className="flex w-full items-center justify-between rounded-md border border-accent/40 bg-accent-soft px-4 py-3 text-left transition-colors hover:bg-accent-soft/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-60"
            >
              <div>
                <p className="font-semibold text-accent">
                  {updatePlant.isPending ? 'Advancing...' : `Advance to ${GROWTH_STAGE_CONFIG[nextStage].label}`}
                </p>
                <p className="mt-0.5 text-sm text-fg-2">
                  {GROWTH_STAGE_CONFIG[nextStage].description}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-accent" />
            </button>
          </div>
        )}

        {/* Details */}
        <div className="mb-5 rounded-lg border border-line bg-card p-4">
          <Eyebrow tone="muted" className="mb-3 block">Details</Eyebrow>
          <dl className="space-y-3">
            <DetailRow term="Strain" value={strainConfig?.label ?? plant.strainType} />
            <DetailRow term="Stage Start" value={formatDate(plant.stageStartDate)} />
            <DetailRow term="Added" value={formatDate(plant.createdAt)} />
            <DetailRow term="Last Updated" value={formatDate(plant.updatedAt)} />
          </dl>
        </div>

        {/* Notes */}
        {plant.notes && (
          <div className="mb-5 rounded-lg border border-line bg-card p-4">
            <Eyebrow tone="muted" className="mb-2 block">Notes</Eyebrow>
            <p className="whitespace-pre-wrap text-sm text-fg-2">{plant.notes}</p>
          </div>
        )}

        {/* Care Logging */}
        <CareLogList plantId={plant.id} />
      </main>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-bg/80"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative w-full max-w-sm rounded-xl border border-line bg-card p-6 shadow-xl animate-gl-modal-in">
            <H3 className="mb-2">Delete Plant</H3>
            <p className="mb-6 text-sm text-fg-2">
              Are you sure you want to delete <strong className="text-fg">{plant.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="inline-flex flex-1 items-center justify-center rounded-md border border-line bg-card-2 px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deletePlant.isPending}
                className="inline-flex flex-1 items-center justify-center rounded-md bg-status-warn px-4 py-2.5 text-sm font-semibold text-fg transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-status-warn focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-60"
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

interface StatTileProps {
  icon: React.ReactNode
  value: string
  label: string
}

function StatTile({ icon, value, label }: StatTileProps) {
  return (
    <div className="rounded-lg border border-line bg-card p-3 text-center">
      <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center text-fg-3">
        {icon}
      </div>
      <p className="font-display text-lg font-bold text-fg">{value}</p>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-eyebrow text-fg-3">
        {label}
      </p>
    </div>
  )
}

interface DetailRowProps {
  term: string
  value: string
}

function DetailRow({ term, value }: DetailRowProps) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-sm text-fg-3">{term}</dt>
      <dd className="text-sm font-medium text-fg text-right">{value}</dd>
    </div>
  )
}
