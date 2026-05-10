/**
 * GrowLab Sensors Routes (F5)
 *
 * Endpoints:
 *   GET    /api/sensors              — list sensor devices (user-owned)
 *   POST   /api/sensors              — create sensor device
 *   GET    /api/sensors/readings     — list sensor readings (plant or tent)
 *   GET    /api/sensors/:id          — get a single device
 *   PATCH  /api/sensors/:id          — update device
 *   DELETE /api/sensors/:id          — delete device
 *
 * NOTE: /readings must be registered BEFORE /:id to avoid the pattern
 * matching "readings" as an id param.
 *
 * Security: apiKeyEncrypted is NEVER returned to the client (stripped in service).
 */

import { Hono, type Context } from 'hono'
import { authenticate } from '../lib/auth-middleware'
import {
  createSensorDeviceSchema,
  updateSensorDeviceSchema,
  listReadingsQuerySchema,
  createSensorDevice,
  listSensorDevices,
  getSensorDevice,
  updateSensorDevice,
  deleteSensorDevice,
  listReadings,
  SensorErrorCodes,
} from '../api/sensors'

export const sensorsRoutes = new Hono()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validationError(c: Context<any>, errors: Record<string, string>) {
  return c.json(
    {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid request', fields: errors },
    },
    400,
  )
}

/** GET /api/sensors */
sensorsRoutes.get('/', async (c) => {
  try {
    const auth = await authenticate(c.req.raw)
    if (!auth.authenticated) return auth.response as Response

    const result = await listSensorDevices(auth.user.userId)
    if (!result.success) return c.json({ success: false, error: result.error }, 400)
    return c.json({ success: true, data: result.data })
  } catch (error) {
    console.error('List sensor devices error:', error)
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500)
  }
})

/** GET /api/sensors/readings — must come BEFORE /:id */
sensorsRoutes.get('/readings', async (c) => {
  try {
    const auth = await authenticate(c.req.raw)
    if (!auth.authenticated) return auth.response as Response

    const rawParams = Object.fromEntries(new URL(c.req.raw.url).searchParams.entries())
    const validation = listReadingsQuerySchema.safeParse(rawParams)
    if (!validation.success) {
      const fields: Record<string, string> = {}
      for (const e of validation.error.errors) fields[e.path.join('.')] = e.message
      return validationError(c, fields)
    }

    const result = await listReadings(auth.user.userId, validation.data)
    if (!result.success) {
      const status = result.error.code === SensorErrorCodes.PLANT_NOT_FOUND
        || result.error.code === SensorErrorCodes.TENT_NOT_FOUND ? 404 : 400
      return c.json({ success: false, error: result.error }, status)
    }
    return c.json({ success: true, data: result.data })
  } catch (error) {
    console.error('List sensor readings error:', error)
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500)
  }
})

/** POST /api/sensors */
sensorsRoutes.post('/', async (c) => {
  try {
    const auth = await authenticate(c.req.raw)
    if (!auth.authenticated) return auth.response as Response

    const body: unknown = await c.req.json()
    const validation = createSensorDeviceSchema.safeParse(body)
    if (!validation.success) {
      const fields: Record<string, string> = {}
      for (const e of validation.error.errors) fields[e.path.join('.')] = e.message
      return validationError(c, fields)
    }

    const result = await createSensorDevice(auth.user.userId, validation.data)
    if (!result.success) {
      const status = result.error.code.includes('NOT_FOUND') ? 404 : 400
      return c.json({ success: false, error: result.error }, status)
    }
    return c.json({ success: true, data: result.data }, 201)
  } catch (error) {
    console.error('Create sensor device error:', error)
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500)
  }
})

/** GET /api/sensors/:id */
sensorsRoutes.get('/:id', async (c) => {
  try {
    const auth = await authenticate(c.req.raw)
    if (!auth.authenticated) return auth.response as Response

    const result = await getSensorDevice(c.req.param('id'), auth.user.userId)
    if (!result.success) {
      const status = result.error.code === SensorErrorCodes.DEVICE_NOT_FOUND ? 404 : 403
      return c.json({ success: false, error: result.error }, status)
    }
    return c.json({ success: true, data: result.data })
  } catch (error) {
    console.error('Get sensor device error:', error)
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500)
  }
})

/** PATCH /api/sensors/:id */
sensorsRoutes.patch('/:id', async (c) => {
  try {
    const auth = await authenticate(c.req.raw)
    if (!auth.authenticated) return auth.response as Response

    const body: unknown = await c.req.json()
    const validation = updateSensorDeviceSchema.safeParse(body)
    if (!validation.success) {
      const fields: Record<string, string> = {}
      for (const e of validation.error.errors) fields[e.path.join('.')] = e.message
      return validationError(c, fields)
    }

    const result = await updateSensorDevice(c.req.param('id'), auth.user.userId, validation.data)
    if (!result.success) {
      const status = result.error.code === SensorErrorCodes.DEVICE_NOT_FOUND ? 404 : 403
      return c.json({ success: false, error: result.error }, status)
    }
    return c.json({ success: true, data: result.data })
  } catch (error) {
    console.error('Update sensor device error:', error)
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500)
  }
})

/** DELETE /api/sensors/:id */
sensorsRoutes.delete('/:id', async (c) => {
  try {
    const auth = await authenticate(c.req.raw)
    if (!auth.authenticated) return auth.response as Response

    const result = await deleteSensorDevice(c.req.param('id'), auth.user.userId)
    if (!result.success) {
      const status = result.error.code === SensorErrorCodes.DEVICE_NOT_FOUND ? 404 : 403
      return c.json({ success: false, error: result.error }, status)
    }
    return c.json({ success: true, data: result.data })
  } catch (error) {
    console.error('Delete sensor device error:', error)
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500)
  }
})
