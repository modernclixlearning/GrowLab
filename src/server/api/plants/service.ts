/**
 * GrowLab Plant Service
 * 
 * Business logic for plant management operations.
 * Handles CRUD, ownership verification, and growth stage validation.
 */

import { eq, and, ilike, asc, desc, sql, count } from 'drizzle-orm'
import { db } from '@/server/db'
import { plants, type Plant, GROWTH_STAGES, type GrowthStage } from '@/server/db/schema'
import type { CreatePlantInput, UpdatePlantInput, ListPlantsQuery } from './schemas'

/**
 * Error codes for plant operations
 */
export const PlantErrorCodes = {
  NOT_FOUND: 'PLANT_NOT_FOUND',
  FORBIDDEN: 'PLANT_FORBIDDEN',
  INVALID_STAGE_TRANSITION: 'INVALID_STAGE_TRANSITION',
  PLANT_LIMIT_REACHED: 'PLANT_LIMIT_REACHED',
} as const

/**
 * Plant operation result type
 */
export type PlantResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }

/**
 * Valid growth stage transitions (sequential only, no going back)
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  seedling: ['vegetative'],
  vegetative: ['flowering'],
  flowering: ['harvesting'],
  harvesting: ['drying'],
  drying: ['curing'],
  curing: ['completed'],
  completed: [],
}

/**
 * Max active plants for free tier users
 */
const FREE_TIER_MAX_PLANTS = 5

/**
 * Validate a growth stage transition
 */
function isValidStageTransition(currentStage: string, newStage: string): boolean {
  return VALID_TRANSITIONS[currentStage]?.includes(newStage) ?? false
}

/**
 * Get a plant by ID and verify ownership
 */
async function findPlantByIdAndOwner(
  plantId: string,
  userId: string
): Promise<PlantResult<{ plant: Plant }>> {
  const plant = await db.query.plants.findFirst({
    where: eq(plants.id, plantId),
  })

  if (!plant) {
    return {
      success: false,
      error: {
        code: PlantErrorCodes.NOT_FOUND,
        message: 'Plant not found',
      },
    }
  }

  if (plant.userId !== userId) {
    return {
      success: false,
      error: {
        code: PlantErrorCodes.FORBIDDEN,
        message: 'You do not have permission to access this plant',
      },
    }
  }

  return { success: true, data: { plant } }
}

/**
 * List plants for a user with optional filtering and sorting
 */
export async function listPlants(
  userId: string,
  query: ListPlantsQuery
): Promise<PlantResult<{ plants: Plant[]; total: number }>> {
  const { stage, search, sortBy, sortOrder, limit, offset } = query

  // Build where conditions
  const conditions = [eq(plants.userId, userId)]

  if (stage) {
    conditions.push(eq(plants.growthStage, stage))
  }

  if (search) {
    conditions.push(
      ilike(plants.name, `%${search}%`)
    )
  }

  const whereClause = and(...conditions)

  // Sort order
  const orderColumn = {
    name: plants.name,
    createdAt: plants.createdAt,
    growthStage: plants.growthStage,
    updatedAt: plants.updatedAt,
  }[sortBy]

  const orderFn = sortOrder === 'asc' ? asc : desc

  // Execute query and count in parallel
  const [plantsList, [countResult]] = await Promise.all([
    db
      .select()
      .from(plants)
      .where(whereClause)
      .orderBy(orderFn(orderColumn))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(plants)
      .where(whereClause),
  ])

  return {
    success: true,
    data: {
      plants: plantsList,
      total: countResult.count,
    },
  }
}

/**
 * Get a single plant by ID (with ownership check)
 */
export async function getPlant(
  plantId: string,
  userId: string
): Promise<PlantResult<{ plant: Plant }>> {
  return findPlantByIdAndOwner(plantId, userId)
}

/**
 * Create a new plant
 */
export async function createPlant(
  userId: string,
  subscriptionTier: string,
  input: CreatePlantInput
): Promise<PlantResult<{ plant: Plant }>> {
  // Check plant limit for free tier
  if (subscriptionTier === 'free') {
    const [countResult] = await db
      .select({ count: count() })
      .from(plants)
      .where(
        and(
          eq(plants.userId, userId),
          // Don't count completed plants toward limit
          sql`${plants.growthStage} != 'completed'`
        )
      )

    if (countResult.count >= FREE_TIER_MAX_PLANTS) {
      return {
        success: false,
        error: {
          code: PlantErrorCodes.PLANT_LIMIT_REACHED,
          message: `Free tier is limited to ${FREE_TIER_MAX_PLANTS} active plants. Upgrade to premium for unlimited plants.`,
        },
      }
    }
  }

  const now = new Date()
  const stageStartDate = input.stageStartDate
    ? new Date(input.stageStartDate)
    : now

  const [createdPlant] = await db
    .insert(plants)
    .values({
      userId,
      name: input.name,
      strainType: input.strainType,
      growthStage: input.growthStage ?? 'seedling',
      stageStartDate,
      healthStatus: 'healthy',
      photoUrl: input.photoUrl ?? null,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  return {
    success: true,
    data: { plant: createdPlant },
  }
}

/**
 * Update an existing plant
 */
export async function updatePlant(
  plantId: string,
  userId: string,
  input: UpdatePlantInput
): Promise<PlantResult<{ plant: Plant }>> {
  // Verify ownership
  const findResult = await findPlantByIdAndOwner(plantId, userId)
  if (!findResult.success) return findResult

  const existingPlant = findResult.data.plant

  // Validate growth stage transition if stage is being changed
  if (input.growthStage && input.growthStage !== existingPlant.growthStage) {
    if (!isValidStageTransition(existingPlant.growthStage, input.growthStage)) {
      const currentIdx = GROWTH_STAGES.indexOf(existingPlant.growthStage as GrowthStage)
      const nextStage = GROWTH_STAGES[currentIdx + 1]
      return {
        success: false,
        error: {
          code: PlantErrorCodes.INVALID_STAGE_TRANSITION,
          message: `Cannot transition from '${existingPlant.growthStage}' to '${input.growthStage}'. ${nextStage ? `Next valid stage is '${nextStage}'.` : 'Plant lifecycle is complete.'}`,
        },
      }
    }
  }

  // Build update values
  const updateValues: Record<string, unknown> = {
    updatedAt: new Date(),
  }

  if (input.name !== undefined) updateValues.name = input.name
  if (input.strainType !== undefined) updateValues.strainType = input.strainType
  if (input.healthStatus !== undefined) updateValues.healthStatus = input.healthStatus
  if (input.photoUrl !== undefined) updateValues.photoUrl = input.photoUrl
  if (input.notes !== undefined) updateValues.notes = input.notes

  // If growth stage changed, update stage start date too
  if (input.growthStage && input.growthStage !== existingPlant.growthStage) {
    updateValues.growthStage = input.growthStage
    updateValues.stageStartDate = new Date()
  }

  const [updatedPlant] = await db
    .update(plants)
    .set(updateValues)
    .where(eq(plants.id, plantId))
    .returning()

  return {
    success: true,
    data: { plant: updatedPlant },
  }
}

/**
 * Delete a plant (hard delete with cascade)
 */
export async function deletePlant(
  plantId: string,
  userId: string
): Promise<PlantResult<{ message: string }>> {
  // Verify ownership
  const findResult = await findPlantByIdAndOwner(plantId, userId)
  if (!findResult.success) return findResult

  await db.delete(plants).where(eq(plants.id, plantId))

  return {
    success: true,
    data: { message: 'Plant deleted successfully' },
  }
}

/**
 * Get plant count for a user (for dashboard stats)
 */
export async function getPlantStats(userId: string): Promise<{
  total: number
  byStage: Record<string, number>
}> {
  const results = await db
    .select({
      growthStage: plants.growthStage,
      count: count(),
    })
    .from(plants)
    .where(eq(plants.userId, userId))
    .groupBy(plants.growthStage)

  const byStage: Record<string, number> = {}
  let total = 0

  for (const row of results) {
    byStage[row.growthStage] = row.count
    total += row.count
  }

  return { total, byStage }
}
