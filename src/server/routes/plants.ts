import { Hono } from 'hono'
import { authenticate } from '../lib/auth-middleware'
import { createPlantSchema, listPlantsQuerySchema, updatePlantSchema } from '../api/plants/schemas'
import { listPlants, createPlant, getPlant, updatePlant, deletePlant } from '../api/plants/service'
import { createCareLogSchema, listCareLogsQuerySchema } from '../api/care-logs/schemas'
import { createCareLog, listCareLogs } from '../api/care-logs/service'

export const plantsRoutes = new Hono()

/** GET /api/plants */
plantsRoutes.get('/', async (c) => {
  try {
    const auth = await authenticate(c.req.raw)
    if (!auth.authenticated) return auth.response as Response

    const queryParams = Object.fromEntries(new URL(c.req.raw.url).searchParams.entries())
    const validation = listPlantsQuerySchema.safeParse(queryParams)
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}
      for (const error of validation.error.errors) fieldErrors[error.path.join('.')] = error.message
      return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', fields: fieldErrors } }, 400)
    }

    const result = await listPlants(auth.user.userId, validation.data)
    if (!result.success) return c.json({ success: false, error: result.error }, 400)
    return c.json({ success: true, data: result.data })
  } catch (error) {
    console.error('List plants error:', error)
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500)
  }
})

/** POST /api/plants */
plantsRoutes.post('/', async (c) => {
  try {
    const auth = await authenticate(c.req.raw)
    if (!auth.authenticated) return auth.response as Response

    const body = await c.req.json()
    const validation = createPlantSchema.safeParse(body)
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}
      for (const error of validation.error.errors) fieldErrors[error.path.join('.')] = error.message
      return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', fields: fieldErrors } }, 400)
    }

    const result = await createPlant(auth.user.userId, auth.user.subscriptionTier, validation.data)
    if (!result.success) return c.json({ success: false, error: result.error }, 400)
    return c.json({ success: true, data: { plant: result.data.plant } }, 201)
  } catch (error) {
    console.error('Create plant error:', error)
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500)
  }
})

/** GET /api/plants/:plantId */
plantsRoutes.get('/:plantId', async (c) => {
  try {
    const auth = await authenticate(c.req.raw)
    if (!auth.authenticated) return auth.response as Response

    const result = await getPlant(c.req.param('plantId'), auth.user.userId)
    if (!result.success) {
      const status = result.error.code === 'PLANT_NOT_FOUND' ? 404 : 403
      return c.json({ success: false, error: result.error }, status)
    }
    return c.json({ success: true, data: { plant: result.data.plant } })
  } catch (error) {
    console.error('Get plant error:', error)
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500)
  }
})

/** PATCH /api/plants/:plantId */
plantsRoutes.patch('/:plantId', async (c) => {
  try {
    const auth = await authenticate(c.req.raw)
    if (!auth.authenticated) return auth.response as Response

    const body = await c.req.json()
    const validation = updatePlantSchema.safeParse(body)
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}
      for (const error of validation.error.errors) fieldErrors[error.path.join('.')] = error.message
      return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', fields: fieldErrors } }, 400)
    }

    const result = await updatePlant(c.req.param('plantId'), auth.user.userId, validation.data)
    if (!result.success) {
      const statusMap: Record<string, number> = { PLANT_NOT_FOUND: 404, PLANT_FORBIDDEN: 403, INVALID_STAGE_TRANSITION: 422 }
      return c.json({ success: false, error: result.error }, (statusMap[result.error.code] ?? 400) as never)
    }
    return c.json({ success: true, data: { plant: result.data.plant } })
  } catch (error) {
    console.error('Update plant error:', error)
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500)
  }
})

/** DELETE /api/plants/:plantId */
plantsRoutes.delete('/:plantId', async (c) => {
  try {
    const auth = await authenticate(c.req.raw)
    if (!auth.authenticated) return auth.response as Response

    const result = await deletePlant(c.req.param('plantId'), auth.user.userId)
    if (!result.success) {
      const status = result.error.code === 'PLANT_NOT_FOUND' ? 404 : 403
      return c.json({ success: false, error: result.error }, status)
    }
    return c.json({ success: true, data: result.data })
  } catch (error) {
    console.error('Delete plant error:', error)
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500)
  }
})

/** GET /api/plants/:plantId/logs */
plantsRoutes.get('/:plantId/logs', async (c) => {
  try {
    const auth = await authenticate(c.req.raw)
    if (!auth.authenticated) return auth.response as Response

    const queryParams = Object.fromEntries(new URL(c.req.raw.url).searchParams.entries())
    const validation = listCareLogsQuerySchema.safeParse(queryParams)
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}
      for (const error of validation.error.errors) fieldErrors[error.path.join('.')] = error.message
      return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', fields: fieldErrors } }, 400)
    }

    const result = await listCareLogs(c.req.param('plantId'), auth.user.userId, validation.data)
    if (!result.success) {
      const status = result.error.code === 'PLANT_NOT_FOUND' ? 404 : 403
      return c.json({ success: false, error: result.error }, status)
    }
    return c.json({ success: true, data: result.data })
  } catch (error) {
    console.error('List care logs error:', error)
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500)
  }
})

/** POST /api/plants/:plantId/logs */
plantsRoutes.post('/:plantId/logs', async (c) => {
  try {
    const auth = await authenticate(c.req.raw)
    if (!auth.authenticated) return auth.response as Response

    const body = await c.req.json()
    const validation = createCareLogSchema.safeParse(body)
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}
      for (const error of validation.error.errors) fieldErrors[error.path.join('.')] = error.message
      return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', fields: fieldErrors } }, 400)
    }

    const result = await createCareLog(c.req.param('plantId'), auth.user.userId, validation.data)
    if (!result.success) {
      const status = result.error.code === 'PLANT_NOT_FOUND' ? 404 : 403
      return c.json({ success: false, error: result.error }, status)
    }
    return c.json({ success: true, data: { careLog: result.data.careLog } }, 201)
  } catch (error) {
    console.error('Create care log error:', error)
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500)
  }
})
