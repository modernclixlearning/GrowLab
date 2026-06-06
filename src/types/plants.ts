/**
 * GrowLab - Frontend Types for Plants
 * 
 * TypeScript types matching backend API responses for plant management.
 */

/**
 * Growth stage values
 */
export type GrowthStage = 'seedling' | 'vegetative' | 'flowering' | 'harvesting' | 'drying' | 'curing' | 'completed'

/**
 * Health status values
 */
export type HealthStatus = 'healthy' | 'stressed' | 'sick' | 'recovering' | 'dead'

/**
 * Strain type values — genetic dominance
 */
export type StrainType = 'indica' | 'sativa' | 'hybrid'

/**
 * Flowering type values — mechanism (orthogonal to strainType)
 * A plant can be auto-indica, auto-hybrid, photo-sativa, etc.
 */
export type FloweringType = 'photoperiod' | 'auto'

/**
 * Per-stage duration overrides (days). All keys optional.
 */
export interface PlantStageDurationOverride {
  seedling?: number
  vegetative?: number
  flowering?: number
  harvesting?: number
  drying?: number
  curing?: number
}

/**
 * Plant entity (matches server ApiPlant type — base columns + derived stats)
 */
export interface Plant {
  id: string
  userId: string
  name: string
  strainType: StrainType
  floweringType: FloweringType
  growthStage: GrowthStage
  stageStartDate: string
  healthStatus: HealthStatus
  photoUrl: string | null
  notes: string | null
  // F2 additions
  tentId: string | null
  strainTemplateId: string | null
  strainName: string | null
  stageDurationOverride: PlantStageDurationOverride | null
  lightSchedule: string | null
  heroPhotoUrl: string | null
  weekDeltaCache: string | null
  // Derived on the server (Master Plan §F2.12)
  weekOfStage: number
  totalWeeks: number | null
  createdAt: string
  updatedAt: string
}

/**
 * Request types
 */
export interface CreatePlantRequest {
  name: string
  strainType: StrainType
  floweringType?: FloweringType
  growthStage?: GrowthStage
  stageStartDate?: string
  photoUrl?: string
  notes?: string
  // F2 additions
  tentId?: string
  strainTemplateId?: string
  strainName?: string
  stageDurationOverride?: PlantStageDurationOverride
  lightSchedule?: string
  heroPhotoUrl?: string
}

export interface UpdatePlantRequest {
  name?: string
  strainType?: StrainType
  floweringType?: FloweringType
  growthStage?: GrowthStage
  healthStatus?: HealthStatus
  photoUrl?: string | null
  notes?: string | null
  // F2 additions — null clears
  tentId?: string | null
  strainTemplateId?: string | null
  strainName?: string | null
  stageDurationOverride?: PlantStageDurationOverride | null
  lightSchedule?: string | null
  heroPhotoUrl?: string | null
}

export interface ListPlantsParams {
  stage?: GrowthStage
  search?: string
  sortBy?: 'name' | 'createdAt' | 'growthStage' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

/**
 * Response types
 */
export interface PlantResponse {
  plant: Plant
}

export interface PlantsListResponse {
  plants: Plant[]
  total: number
}

export interface DeletePlantResponse {
  message: string
}

/**
 * Growth stage display configuration
 */
export const GROWTH_STAGE_CONFIG: Record<GrowthStage, {
  label: string
  color: string
  bgColor: string
  description: string
}> = {
  seedling: {
    label: 'Seedling',
    color: 'text-stage-seedling',
    bgColor: 'bg-stage-seedling/15',
    description: 'First leaves & early growth',
  },
  vegetative: {
    label: 'Vegetative',
    color: 'text-stage-veg',
    bgColor: 'bg-stage-veg/15',
    description: 'Leafy growth & stem development',
  },
  flowering: {
    label: 'Flowering',
    color: 'text-stage-flower',
    bgColor: 'bg-stage-flower/15',
    description: 'Bud formation & ripening',
  },
  harvesting: {
    label: 'Harvesting',
    color: 'text-status-alert',
    bgColor: 'bg-status-alert/15',
    description: 'Ready for harvest',
  },
  drying: {
    label: 'Drying',
    color: 'text-status-alert',
    bgColor: 'bg-status-alert/15',
    description: 'Drying after harvest',
  },
  curing: {
    label: 'Curing',
    color: 'text-status-thirsty',
    bgColor: 'bg-status-thirsty/15',
    description: 'Curing for quality',
  },
  completed: {
    label: 'Completed',
    color: 'text-fg-3',
    bgColor: 'bg-card-2',
    description: 'Lifecycle complete',
  },
}

/**
 * Health status display configuration
 */
export const HEALTH_STATUS_CONFIG: Record<HealthStatus, {
  label: string
  color: string
  bgColor: string
}> = {
  healthy: { label: 'Healthy', color: 'text-status-good', bgColor: 'bg-status-good/15' },
  stressed: { label: 'Stressed', color: 'text-status-thirsty', bgColor: 'bg-status-thirsty/15' },
  sick: { label: 'Sick', color: 'text-status-warn', bgColor: 'bg-status-warn/15' },
  recovering: { label: 'Recovering', color: 'text-status-water', bgColor: 'bg-status-water/15' },
  dead: { label: 'Dead', color: 'text-fg-3', bgColor: 'bg-card-2' },
}

/**
 * Strain type display configuration (genetic dominance)
 */
export const STRAIN_TYPE_CONFIG: Record<StrainType, { label: string }> = {
  indica: { label: 'Indica' },
  sativa: { label: 'Sativa' },
  hybrid: { label: 'Hybrid' },
}

/**
 * Flowering type display configuration (mechanism)
 */
export const FLOWERING_TYPE_CONFIG: Record<FloweringType, { label: string; shortLabel: string }> = {
  photoperiod: { label: 'Photoperiod', shortLabel: 'Photo' },
  auto: { label: 'Auto-flowering', shortLabel: 'Auto' },
}
