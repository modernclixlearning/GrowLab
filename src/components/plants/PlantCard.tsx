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

/** Tailwind border class per growth stage (matches prototype's stage color border) */
const STAGE_BORDER: Record<GrowthStage, string> = {
  seedling: 'border-l-stage-seedling',
  vegetative: 'border-l-stage-veg',
  flowering: 'border-l-stage-flower',
  harvesting: 'border-l-status-alert',
  drying: 'border-l-status-alert',
  curing: 'border-l-status-thirsty',
  completed: 'border-l-fg-4',
}

export function PlantCard({ plant, onClick }: PlantCardProps) {
  const stageConfig = GROWTH_STAGE_CONFIG[plant.growthStage as GrowthStage]
  const healthConfig = HEALTH_STATUS_CONFIG[plant.healthStatus as HealthStatus]
  const strainConfig = STRAIN_TYPE_CONFIG[plant.strainType as StrainType]
  const daysInStage = daysSince(plant.stageStartDate)
  const totalAge = daysSince(plant.createdAt)
  const stageBorder = STAGE_BORDER[plant.growthStage as GrowthStage] ?? 'border-l-fg-4'

  return (
    <button
      onClick={onClick}
      className={[
        'block w-full rounded-lg border border-line border-l-4 bg-card p-4 text-left transition-colors',
        'hover:bg-card-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        stageBorder,
      ].join(' ')}
    >
      <div className="flex gap-4">
        {/* Plant Image / Placeholder */}
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-md bg-card-2 border border-line">
          {plant.photoUrl ? (
            <img
              src={plant.photoUrl}
              alt={plant.name}
              className="h-full w-full rounded-md object-cover"
            />
          ) : (
            <Leaf className="h-8 w-8 text-fg-3" />
          )}
        </div>

        {/* Plant Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-display text-base font-bold text-fg">
                {plant.name}
              </h3>
              <p className="text-sm text-fg-3 italic">
                {strainConfig?.label ?? plant.strainType}
              </p>
            </div>

            {/* Health Badge */}
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-eyebrow ${healthConfig?.bgColor ?? 'bg-card-2'} ${healthConfig?.color ?? 'text-fg-3'}`}
            >
              {healthConfig?.label ?? plant.healthStatus}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            {/* Growth Stage Badge */}
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-eyebrow ${stageConfig?.bgColor ?? 'bg-card-2'} ${stageConfig?.color ?? 'text-fg-3'}`}
            >
              {stageConfig?.label ?? plant.growthStage}
            </span>

            {/* Days counter */}
            <span className="font-mono text-[11px] text-fg-3">
              D{daysInStage} in stage
            </span>
            <span className="font-mono text-[11px] text-fg-4">
              {totalAge}d old
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}
