/**
 * GrowLab Plant Card Component
 *
 * Displays a plant summary in the garden list view.
 *
 * F1 enhancements:
 *   - 96×96 plant photo (square, rounded-md) with stage tint fallback.
 *   - Mono uppercase eyebrow above the name showing strain · stage week.
 *   - Optional `careTag` prop (derived by parent via `deriveCareTag`).
 *   - Stage color border-l-4 preserved from F0 re-skin.
 *
 * The component remains presentational; data hooks live in the parent.
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
import { Eyebrow } from '@/components/shell'
import { CARE_TAG_TONE_CLASS, type CareTag } from '@/lib/careTag'

interface PlantCardProps {
  plant: Plant
  onClick: () => void
  /**
   * Care tag derived from the plant's care log history (parent computes
   * via `deriveCareTag`). When omitted, the card simply hides the row.
   */
  careTag?: CareTag
  /** Compact layout — preserved from earlier API for callers that need it. */
  compact?: boolean
}

/** Calculate days since a date */
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

/** Stage label for the eyebrow row, mirrors prototype's "STAGE · WEEK N" pattern. */
const STAGE_SHORT_LABEL: Record<GrowthStage, string> = {
  seedling: 'SEEDLING',
  vegetative: 'VEG',
  flowering: 'FLOWER',
  harvesting: 'HARVEST',
  drying: 'DRY',
  curing: 'CURE',
  completed: 'DONE',
}

export function PlantCard({ plant, onClick, careTag, compact = false }: PlantCardProps) {
  const stage = plant.growthStage as GrowthStage
  const stageConfig = GROWTH_STAGE_CONFIG[stage]
  const healthConfig = HEALTH_STATUS_CONFIG[plant.healthStatus as HealthStatus]
  const strainConfig = STRAIN_TYPE_CONFIG[plant.strainType as StrainType]
  const daysInStage = daysSince(plant.stageStartDate)
  const totalAge = daysSince(plant.createdAt)
  const stageBorder = STAGE_BORDER[stage] ?? 'border-l-fg-4'
  const weekOfStage = Math.max(1, Math.floor(daysInStage / 7) + 1)
  const stageLabel = STAGE_SHORT_LABEL[stage] ?? stage.toUpperCase()
  const photoSize = compact ? 'h-16 w-16' : 'h-24 w-24'

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
        {/* Plant Image / Placeholder — 96×96 in default layout */}
        <div
          className={[
            'flex flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-card-2',
            photoSize,
          ].join(' ')}
        >
          {plant.photoUrl ? (
            <img
              src={plant.photoUrl}
              alt={plant.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Leaf className="h-8 w-8 text-fg-3" />
          )}
        </div>

        {/* Plant Info */}
        <div className="min-w-0 flex-1">
          {/* Eyebrow row: strain · stage · week */}
          <div className="flex items-center justify-between gap-2">
            <Eyebrow tone="muted" className="truncate">
              {strainConfig?.label ?? plant.strainType} &middot; {stageLabel} &middot; WEEK {weekOfStage}
            </Eyebrow>
            {healthConfig && (
              <span
                className={`inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-eyebrow ${healthConfig.bgColor} ${healthConfig.color}`}
              >
                {healthConfig.label}
              </span>
            )}
          </div>

          <h3 className="mt-1 truncate font-display text-base font-bold text-fg">
            {plant.name}
          </h3>

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

          {/* Care tag row (F1) */}
          {careTag && (
            <div className="mt-2">
              <span
                className={[
                  'font-mono text-[11px] font-medium uppercase tracking-eyebrow',
                  CARE_TAG_TONE_CLASS[careTag.tone],
                ].join(' ')}
              >
                {careTag.label}
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
