/**
 * GrowLab Plant Card Component
 * 
 * Displays a plant summary in the garden list view.
 */

import { Leaf } from 'lucide-react'
import type { Plant } from '@/types/plants'
import {
  GROWTH_STAGE_CONFIG,
  HEALTH_STATUS_CONFIG,
  STRAIN_TYPE_CONFIG,
  type GrowthStage,
  type HealthStatus,
  type StrainType,
} from '@/types/plants'

interface PlantCardProps {
  plant: Plant
  onClick: () => void
}

/**
 * Calculate days since a date
 */
function daysSince(dateStr: string): number {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

export function PlantCard({ plant, onClick }: PlantCardProps) {
  const stageConfig = GROWTH_STAGE_CONFIG[plant.growthStage as GrowthStage]
  const healthConfig = HEALTH_STATUS_CONFIG[plant.healthStatus as HealthStatus]
  const strainConfig = STRAIN_TYPE_CONFIG[plant.strainType as StrainType]
  const daysInStage = daysSince(plant.stageStartDate)
  const totalAge = daysSince(plant.createdAt)

  return (
    <button
      onClick={onClick}
      className="card w-full text-left transition-shadow hover:shadow-md"
    >
      <div className="flex gap-4">
        {/* Plant Image / Placeholder */}
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50">
          {plant.photoUrl ? (
            <img
              src={plant.photoUrl}
              alt={plant.name}
              className="h-full w-full rounded-lg object-cover"
            />
          ) : (
            <Leaf className="h-8 w-8 text-primary-400" />
          )}
        </div>

        {/* Plant Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-gray-900">
                {plant.name}
              </h3>
              <p className="text-sm text-gray-500">
                {strainConfig?.label ?? plant.strainType}
              </p>
            </div>

            {/* Health Badge */}
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${healthConfig?.bgColor ?? 'bg-gray-100'} ${healthConfig?.color ?? 'text-gray-700'}`}>
              {healthConfig?.label ?? plant.healthStatus}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-3">
            {/* Growth Stage Badge */}
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${stageConfig?.bgColor ?? 'bg-gray-100'} ${stageConfig?.color ?? 'text-gray-700'}`}>
              {stageConfig?.label ?? plant.growthStage}
            </span>

            {/* Days counter */}
            <span className="text-xs text-gray-500">
              Day {daysInStage} in stage
            </span>
            <span className="text-xs text-gray-400">
              {totalAge}d old
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}
