/**
 * GrowLab Plants API - List & Create Endpoints
 * 
 * GET  /api/plants - List user's plants with optional filters
 * POST /api/plants - Create a new plant
 */

import { createAPIFileRoute } from '@tanstack/start/api'
import { authenticate } from '@/server/lib/auth-middleware'
import { createPlantSchema, listPlantsQuerySchema } from '@/server/api/plants/schemas'
import { listPlants, createPlant } from '@/server/api/plants/service'

export const Route = createAPIFileRoute('/api/plants')({
  /**
   * GET /api/plants
   * 
   * List authenticated user's plants with optional filtering and sorting.
   * 
   * Query params:
   *   - stage: Filter by growth stage
   *   - search: Search by plant name
   *   - sortBy: Sort field (name, createdAt, growthStage, updatedAt)
   *   - sortOrder: Sort direction (asc, desc)
   *   - limit: Page size (1-100, default 50)
   *   - offset: Page offset (default 0)
   */
  GET: async ({ request }) => {
    try {
      // Authenticate
      const auth = await authenticate(request)
      if (!auth.authenticated) return auth.response

      // Parse query parameters
      const url = new URL(request.url)
      const queryParams = Object.fromEntries(url.searchParams.entries())
      const validation = listPlantsQuerySchema.safeParse(queryParams)

      if (!validation.success) {
        const fieldErrors: Record<string, string> = {}
        for (const error of validation.error.errors) {
          const field = error.path.join('.')
          fieldErrors[field] = error.message
        }

        return Response.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid query parameters',
              fields: fieldErrors,
            },
          },
          { status: 400 }
        )
      }

      const result = await listPlants(auth.user.userId, validation.data)

      if (!result.success) {
        return Response.json({ success: false, error: result.error }, { status: 400 })
      }

      return Response.json({
        success: true,
        data: result.data,
      })
    } catch (error) {
      console.error('List plants error:', error)
      return Response.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
          },
        },
        { status: 500 }
      )
    }
  },

  /**
   * POST /api/plants
   * 
   * Create a new plant for the authenticated user.
   * 
   * Request body:
   *   - name: string (required)
   *   - strainType: 'indica' | 'sativa' | 'hybrid' | 'auto' (required)
   *   - growthStage?: growth stage (default 'seedling')
   *   - stageStartDate?: ISO 8601 date string
   *   - photoUrl?: string URL
   *   - notes?: string
   */
  POST: async ({ request }) => {
    try {
      // Authenticate
      const auth = await authenticate(request)
      if (!auth.authenticated) return auth.response

      // Parse request body
      const body = await request.json()

      // Validate input
      const validation = createPlantSchema.safeParse(body)
      if (!validation.success) {
        const fieldErrors: Record<string, string> = {}
        for (const error of validation.error.errors) {
          const field = error.path.join('.')
          fieldErrors[field] = error.message
        }

        return Response.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid input data',
              fields: fieldErrors,
            },
          },
          { status: 400 }
        )
      }

      // Create plant
      const result = await createPlant(
        auth.user.userId,
        auth.user.subscriptionTier,
        validation.data
      )

      if (!result.success) {
        const status = result.error.code === 'PLANT_LIMIT_REACHED' ? 403 : 400
        return Response.json({ success: false, error: result.error }, { status })
      }

      return Response.json(
        {
          success: true,
          data: { plant: result.data.plant },
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('Create plant error:', error)
      return Response.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
          },
        },
        { status: 500 }
      )
    }
  },
})
