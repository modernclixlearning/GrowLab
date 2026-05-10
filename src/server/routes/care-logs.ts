/**
 * GrowLab Care Logs Routes (F3)
 *
 * Standalone `/api/care-logs` router, separate from the per-plant
 * `/api/plants/:plantId/logs` nested routes that existed in F1.
 *
 * Endpoints:
 *   GET  /api/care-logs          — cross-plant scheduled window query
 *   POST /api/care-logs/:id/complete — mark a care log done + spawn next
 */

import { Hono } from 'hono'
import { authenticate } from '../lib/auth-middleware'
import { listScheduledCareLogsQuerySchema } from '../api/care-logs/schemas'
import { listScheduledCareLogs, completeCareLog } from '../api/care-logs/service'

export const careLogsRoutes = new Hono()

/** GET /api/care-logs?plantId=&scheduledFrom=&scheduledTo= */
careLogsRoutes.get('/', async (c) => {
  try {
    const auth = await authenticate(c.req.raw)
    if (!auth.authenticated) return auth.response as Response

    const queryParams = Object.fromEntries(
      new URL(c.req.raw.url).searchParams.entries(),
    )
    const validation = listScheduledCareLogsQuerySchema.safeParse(queryParams)
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}
      for (const error of validation.error.errors)
        fieldErrors[error.path.join('.')] = error.message
      return c.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            fields: fieldErrors,
          },
        },
        400,
      )
    }

    const result = await listScheduledCareLogs(auth.user.userId, validation.data)
    if (!result.success) {
      const status = result.error.code === 'PLANT_NOT_FOUND' ? 404 : 400
      return c.json({ success: false, error: result.error }, status)
    }
    return c.json({ success: true, data: result.data })
  } catch (error) {
    console.error('List scheduled care logs error:', error)
    return c.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      500,
    )
  }
})

/** POST /api/care-logs/:id/complete */
careLogsRoutes.post('/:id/complete', async (c) => {
  try {
    const auth = await authenticate(c.req.raw)
    if (!auth.authenticated) return auth.response as Response

    const result = await completeCareLog(c.req.param('id'), auth.user.userId)
    if (!result.success) {
      const statusMap: Record<string, number> = {
        CARE_LOG_NOT_FOUND: 404,
        CARE_LOG_FORBIDDEN: 403,
      }
      return c.json(
        { success: false, error: result.error },
        (statusMap[result.error.code] ?? 400) as never,
      )
    }
    return c.json({ success: true, data: result.data })
  } catch (error) {
    console.error('Complete care log error:', error)
    return c.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      500,
    )
  }
})
