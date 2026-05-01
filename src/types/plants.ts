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
 * Strain type values
 */
export type StrainType = 'indica' | 'sativa' | 'hybrid' | 'auto'

/**
 * Plant entity (matches server Plant type)
 */
export interface Plant {
  id: string
  userId: string
  name: string
  strainType: StrainType
  growthStage: GrowthStage
  stageStartDate: string
  healthStatus: HealthStatus
  photoUrl: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Request types
 */
export interface CreatePlantRequest {
  name: string
  strainType: StrainType
  growthStage?: GrowthStage
  stageStartDate?: string
  photoUrl?: string
  notes?: string
}

export interface UpdatePlantRequest {
  name?: string
  strainType?: StrainType
  growthStage?: GrowthStage
  healthStatus?: HealthStatus
  photoUrl?: string | null
  notes?: string | null
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
    color: 'text-lime-700',
    bgColor: 'bg-lime-100',
    description: 'First leaves & early growth',
  },
  vegetative: {
    label: 'Vegetative',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    description: 'Leafy growth & stem development',
  },
  flowering: {
    label: 'Flowering',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    description: 'Bud formation & ripening',
  },
  harvesting: {
    label: 'Harvesting',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    description: 'Ready for harvest',
  },
  drying: {
    label: 'Drying',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    description: 'Drying after harvest',
  },
  curing: {
    label: 'Curing',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    description: 'Curing for quality',
  },
  completed: {
    label: 'Completed',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
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
  healthy: { label: 'Healthy', color: 'text-green-700', bgColor: 'bg-green-100' },
  stressed: { label: 'Stressed', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  sick: { label: 'Sick', color: 'text-red-700', bgColor: 'bg-red-100' },
  recovering: { label: 'Recovering', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  dead: { label: 'Dead', color: 'text-gray-700', bgColor: 'bg-gray-200' },
}

/**
 * Strain type display configuration
 */
export const STRAIN_TYPE_CONFIG: Record<StrainType, { label: string }> = {
  indica: { label: 'Indica' },
  sativa: { label: 'Sativa' },
  hybrid: { label: 'Hybrid' },
  auto: { label: 'Auto-flowering' },
}
