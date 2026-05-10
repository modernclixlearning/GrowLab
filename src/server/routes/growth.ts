/**
 * GrowLab Growth Routes (F5)
 *
 * Endpoints:
 *   GET  /api/plants/:plantId/growth — list growth measurements
 *   POST /api/plants/:plantId/growth — create growth measurement
 */

import { Hono } from 'hono'
import { authenticate } from '../lib/auth-middleware'
import {
  createGrowthMeasurementSchema,
  listGrowthMeasurementsQuerySchema,
  createGrowthMeasurement,
  listGrowthMeasurements,
  deriveGrowthBars,
} from '../api/growth'
import { GrowthErrorCodes } from '../api/growth/service'

export const growthRoutes = new Hono()

/** GET /api/plants/:plantId/growth */
growthRoutes.get('/:plantId/growth', async (c) => {
  try {
    const auth = await authenticate(c.req.raw)
    if (!auth.authenticated) return auth.response as Response

    const rawParams = Object.fromEntries(new URL(c.req.raw.url).searchParams.entries())
    const plantId = c.req.param('plantId')
    const validation = listGrowthMeasurementsQuerySchema.safeParse({ ...rawParams, plantId })
    if (!validation.success) {
      const fields: Record<string, string> = {}
      for (const e of validation.error.errors) fields[e.path.join('.')] = e.message
      return c.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid query', fields } },
        400,
      )
    }

    const result = await listGrowthMeasurements(auth.user.userId, validation.data)
    if (!result.success) {
      const status = result.error.code === GrowthErrorCodes.PLANT_NOT_FOUND ? 404 : 400
      return c.json({ success: false, error: result.error }, status)
    }

    const growthBars = deriveGrowthBars(result.data.measurements)
    return c.json({ success: true, data: { measurements: result.data.measurements, growthBars } })
  } catch (error) {
    console.error('List growth measurements error:', error)
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500)
  }
})

/** POST /api/plants/:plantId/growth */
growthRoutes.post('/:plantId/growth', async (c) => {
  try {
    const auth = await authenticate(c.req.raw)
    if (!auth.authenticated) return auth.response as Response

    const plantId = c.req.param('plantId')
    const body = (await c.req.json()) as Record<string, unknown>
    const validation = createGrowthMeasurementSchema.safeParse({ ...body, plantId })
    if (!validation.success) {
      const fields: Record<string, string> = {}
      for (const e of validation.error.errors) fields[e.path.join('.')] = e.message
      return c.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request', fields } },
        400,
      )
    }

    const result = await createGrowthMeasurement(auth.user.userId, validation.data)
    if (!result.success) {
      const status = result.error.code === GrowthErrorCodes.PLANT_NOT_FOUND ? 404 : 400
      return c.json({ success: false, error: result.error }, status)
    }
    return c.json({ success: true, data: result.data }, 201)
  } catch (error) {
    console.error('Create growth measurement error:', error)
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500)
  }
})
