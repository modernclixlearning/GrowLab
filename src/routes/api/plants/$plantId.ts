/**
 * GrowLab Plants API - Single Plant Endpoints
 * 
 * GET    /api/plants/:plantId - Get plant details
 * PATCH  /api/plants/:plantId - Update plant
 * DELETE /api/plants/:plantId - Delete plant
 */

import { createAPIFileRoute } from '@tanstack/start/api'
import { authenticate } from '@/server/lib/auth-middleware'
import { updatePlantSchema } from '@/server/api/plants/schemas'
import { getPlant, updatePlant, deletePlant } from '@/server/api/plants/service'

export const Route = createAPIFileRoute('/api/plants/$plantId')({
  /**
   * GET /api/plants/:plantId
   * 
   * Get a single plant by ID.
   * Verifies ownership before returning data.
   */
  GET: async ({ request, params }) => {
    try {
      // Authenticate
      const auth = await authenticate(request)
      if (!auth.authenticated) return auth.response

      const result = await getPlant(params.plantId, auth.user.userId)

      if (!result.success) {
        const status = result.error.code === 'PLANT_NOT_FOUND' ? 404 : 403
        return Response.json({ success: false, error: result.error }, { status })
      }

      return Response.json({
        success: true,
        data: { plant: result.data.plant },
      })
    } catch (error) {
      console.error('Get plant error:', error)
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
   * PATCH /api/plants/:plantId
   * 
   * Update a plant's details.
   * Validates growth stage transitions and verifies ownership.
   * 
   * Request body (all optional):
   *   - name?: string
   *   - strainType?: strain type
   *   - growthStage?: growth stage (validated transition)
   *   - healthStatus?: health status
   *   - photoUrl?: string | null
   *   - notes?: string | null
   */
  PATCH: async ({ request, params }) => {
    try {
      // Authenticate
      const auth = await authenticate(request)
      if (!auth.authenticated) return auth.response

      // Parse request body
      const body = await request.json()

      // Validate input
      const validation = updatePlantSchema.safeParse(body)
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

      // Update plant
      const result = await updatePlant(params.plantId, auth.user.userId, validation.data)

      if (!result.success) {
        const statusMap: Record<string, number> = {
          PLANT_NOT_FOUND: 404,
          PLANT_FORBIDDEN: 403,
          INVALID_STAGE_TRANSITION: 422,
        }
        const status = statusMap[result.error.code] ?? 400

        return Response.json({ success: false, error: result.error }, { status })
      }

      return Response.json({
        success: true,
        data: { plant: result.data.plant },
      })
    } catch (error) {
      console.error('Update plant error:', error)
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
   * DELETE /api/plants/:plantId
   * 
   * Delete a plant (hard delete).
   * Verifies ownership before deletion. Cascade deletes related records.
   */
  DELETE: async ({ request, params }) => {
    try {
      // Authenticate
      const auth = await authenticate(request)
      if (!auth.authenticated) return auth.response

      const result = await deletePlant(params.plantId, auth.user.userId)

      if (!result.success) {
        const status = result.error.code === 'PLANT_NOT_FOUND' ? 404 : 403
        return Response.json({ success: false, error: result.error }, { status })
      }

      return Response.json({
        success: true,
        data: result.data,
      })
    } catch (error) {
      console.error('Delete plant error:', error)
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
