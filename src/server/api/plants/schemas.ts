/**
 * GrowLab Plant Validation Schemas
 * 
 * Zod schemas for runtime validation of plant management inputs.
 */

import { z } from 'zod'
import { GROWTH_STAGES, HEALTH_STATUSES, STRAIN_TYPES } from '@/server/db/schema/plants'

/**
 * Create plant request validation schema
 */
export const createPlantSchema = z.object({
  name: z
    .string()
    .min(1, 'Plant name is required')
    .max(100, 'Plant name must be at most 100 characters'),
  strainType: z.enum(STRAIN_TYPES, {
    errorMap: () => ({ message: `Strain type must be one of: ${STRAIN_TYPES.join(', ')}` }),
  }),
  growthStage: z.enum(GROWTH_STAGES, {
    errorMap: () => ({ message: `Growth stage must be one of: ${GROWTH_STAGES.join(', ')}` }),
  }).default('seedling'),
  stageStartDate: z
    .string()
    .datetime({ message: 'Stage start date must be a valid ISO 8601 date' })
    .optional(),
  photoUrl: z.string().url('Photo URL must be a valid URL').optional(),
  notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional(),
})

/**
 * Update plant request validation schema (all fields optional)
 */
export const updatePlantSchema = z.object({
  name: z
    .string()
    .min(1, 'Plant name is required')
    .max(100, 'Plant name must be at most 100 characters')
    .optional(),
  strainType: z.enum(STRAIN_TYPES, {
    errorMap: () => ({ message: `Strain type must be one of: ${STRAIN_TYPES.join(', ')}` }),
  }).optional(),
  growthStage: z.enum(GROWTH_STAGES, {
    errorMap: () => ({ message: `Growth stage must be one of: ${GROWTH_STAGES.join(', ')}` }),
  }).optional(),
  healthStatus: z.enum(HEALTH_STATUSES, {
    errorMap: () => ({ message: `Health status must be one of: ${HEALTH_STATUSES.join(', ')}` }),
  }).optional(),
  photoUrl: z.string().url('Photo URL must be a valid URL').nullable().optional(),
  notes: z.string().max(1000, 'Notes must be at most 1000 characters').nullable().optional(),
})

/**
 * Query parameters for listing plants
 */
export const listPlantsQuerySchema = z.object({
  stage: z.enum(GROWTH_STAGES).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'growthStage', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
})

/** TypeScript types inferred from schemas */
export type CreatePlantInput = z.infer<typeof createPlantSchema>
export type UpdatePlantInput = z.infer<typeof updatePlantSchema>
export type ListPlantsQuery = z.infer<typeof listPlantsQuerySchema>
