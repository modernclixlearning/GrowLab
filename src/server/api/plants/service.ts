/**
 * GrowLab Plant Service
 * 
 * Business logic for plant management operations.
 * Handles CRUD, ownership verification, and growth stage validation.
 */

import { eq, and, ilike, asc, desc, sql, count, inArray } from 'drizzle-orm'
import { db } from '@/server/db'
import {
  plants,
  type Plant,
  GROWTH_STAGES,
  type GrowthStage,
  strainTemplates,
  tents,
} from '@/server/db/schema'
import type { CreatePlantInput, UpdatePlantInput, ListPlantsQuery } from './schemas'
import {
  derivePlantStats,
  type DerivedPlantStats,
} from '@/server/lib/derivePlantStats'

/**
 * Plant returned by the API — base columns plus the server-derived
 * `weekOfStage` and `totalWeeks` (issue 003 / Master Plan §F2.12).
 */
export type ApiPlant = Plant & DerivedPlantStats

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
 * Enrich a Plant row with the derived weekOfStage / totalWeeks tuple.
 * Looks up the strain template (if any) so the durations cascade
 * `override → template → null` works without forcing every caller to
 * preload the template.
 */
async function enrichPlant(plant: Plant): Promise<ApiPlant> {
  let templateDurations: ApiPlant['stageDurationOverride'] | null = null
  if (plant.strainTemplateId) {
    const template = await db.query.strainTemplates.findFirst({
      where: eq(strainTemplates.id, plant.strainTemplateId),
      columns: { stageDurations: true },
    })
    templateDurations = template?.stageDurations ?? null
  }

  const stats = derivePlantStats({
    growthStage: plant.growthStage as GrowthStage,
    stageStartDate: plant.stageStartDate,
    stageDurationOverride: plant.stageDurationOverride,
    templateStageDurations: templateDurations,
  })

  return { ...plant, ...stats }
}

/**
 * Batch-enrich a list of plants in a single round-trip for the templates.
 * Avoids N+1 queries when listing the garden.
 */
async function enrichPlants(rows: Plant[]): Promise<ApiPlant[]> {
  if (rows.length === 0) return []

  const templateIds = Array.from(
    new Set(rows.map((p) => p.strainTemplateId).filter((id): id is string => !!id)),
  )

  const templates = templateIds.length
    ? await db
        .select({
          id: strainTemplates.id,
          stageDurations: strainTemplates.stageDurations,
        })
        .from(strainTemplates)
        .where(inArray(strainTemplates.id, templateIds))
    : []

  const byId = new Map(templates.map((t) => [t.id, t.stageDurations]))

  return rows.map((p) => {
    const template = p.strainTemplateId ? byId.get(p.strainTemplateId) : null
    const stats = derivePlantStats({
      growthStage: p.growthStage as GrowthStage,
      stageStartDate: p.stageStartDate,
      stageDurationOverride: p.stageDurationOverride,
      templateStageDurations: template ?? null,
    })
    return { ...p, ...stats }
  })
}

/**
 * Verify a tent belongs to the user. Used during plant create/update
 * before linking `tentId`. Returns boolean — callers map to API error.
 */
async function verifyTentOwnership(
  tentId: string,
  userId: string,
): Promise<boolean> {
  const tent = await db.query.tents.findFirst({
    where: eq(tents.id, tentId),
    columns: { id: true, userId: true },
  })
  return !!tent && tent.userId === userId
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
): Promise<PlantResult<{ plants: ApiPlant[]; total: number }>> {
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

  const enriched = await enrichPlants(plantsList)

  return {
    success: true,
    data: {
      plants: enriched,
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
): Promise<PlantResult<{ plant: ApiPlant }>> {
  const result = await findPlantByIdAndOwner(plantId, userId)
  if (!result.success) return result
  const enriched = await enrichPlant(result.data.plant)
  return { success: true, data: { plant: enriched } }
}

/**
 * Create a new plant
 */
export async function createPlant(
  userId: string,
  subscriptionTier: string,
  input: CreatePlantInput
): Promise<PlantResult<{ plant: ApiPlant }>> {
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

  // F2: ownership check on tent if provided.
  if (input.tentId) {
    const ok = await verifyTentOwnership(input.tentId, userId)
    if (!ok) {
      return {
        success: false,
        error: {
          code: 'TENT_FORBIDDEN',
          message: 'Tent does not belong to this user',
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
      floweringType: input.floweringType ?? 'photoperiod',
      growthStage: input.growthStage ?? 'seedling',
      stageStartDate,
      healthStatus: 'healthy',
      photoUrl: input.photoUrl ?? null,
      notes: input.notes ?? null,
      // F2 fields — null when caller omits.
      tentId: input.tentId ?? null,
      strainTemplateId: input.strainTemplateId ?? null,
      strainName: input.strainName ?? null,
      stageDurationOverride: input.stageDurationOverride ?? null,
      lightSchedule: input.lightSchedule ?? null,
      heroPhotoUrl: input.heroPhotoUrl ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  const enriched = await enrichPlant(createdPlant)
  return {
    success: true,
    data: { plant: enriched },
  }
}

/**
 * Update an existing plant
 */
export async function updatePlant(
  plantId: string,
  userId: string,
  input: UpdatePlantInput
): Promise<PlantResult<{ plant: ApiPlant }>> {
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

  // F2: ownership check on tent (when set to a non-null id)
  if (input.tentId) {
    const ok = await verifyTentOwnership(input.tentId, userId)
    if (!ok) {
      return {
        success: false,
        error: {
          code: 'TENT_FORBIDDEN',
          message: 'Tent does not belong to this user',
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
  if (input.floweringType !== undefined) updateValues.floweringType = input.floweringType
  if (input.healthStatus !== undefined) updateValues.healthStatus = input.healthStatus
  if (input.photoUrl !== undefined) updateValues.photoUrl = input.photoUrl
  if (input.notes !== undefined) updateValues.notes = input.notes
  // F2 fields
  if (input.tentId !== undefined) updateValues.tentId = input.tentId
  if (input.strainTemplateId !== undefined) updateValues.strainTemplateId = input.strainTemplateId
  if (input.strainName !== undefined) updateValues.strainName = input.strainName
  if (input.stageDurationOverride !== undefined) updateValues.stageDurationOverride = input.stageDurationOverride
  if (input.lightSchedule !== undefined) updateValues.lightSchedule = input.lightSchedule
  if (input.heroPhotoUrl !== undefined) updateValues.heroPhotoUrl = input.heroPhotoUrl

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

  const enriched = await enrichPlant(updatedPlant)
  return {
    success: true,
    data: { plant: enriched },
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
