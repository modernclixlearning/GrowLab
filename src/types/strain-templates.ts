/**
 * GrowLab - Frontend Types for Strain Templates (F2)
 */

import type { StrainType } from './plants'

export interface StrainStageDurations {
  seedling?: number
  vegetative?: number
  flowering?: number
  harvesting?: number
  drying?: number
  curing?: number
}

export interface StrainLightSchedule {
  veg?: string
  flower?: string
}

export interface StrainTemplate {
  id: string
  name: string
  strainType: StrainType
  stageDurations: StrainStageDurations | null
  defaultLightSchedule: StrainLightSchedule | null
  description: string | null
  createdAt: string
}

export interface StrainTemplatesListResponse {
  strainTemplates: StrainTemplate[]
  total: number
}
