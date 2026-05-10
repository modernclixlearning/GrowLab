/**
 * GrowLab Tents Routes
 *
 * REST handlers under `/api/tents`. Auth required on every handler — the
 * pattern matches `routes/plants.ts` so the same mocking/middleware story
 * applies (Master Plan §F2 / §4.1).
 */

import { Hono } from 'hono'
import { authenticate } from '../lib/auth-middleware'
import {
  createTentSchema,
  updateTentSchema,
  listTentsQuerySchema,
} from '../api/tents/schemas'
import {
  listTents,
  createTent,
  getTent,
  updateTent,
  deleteTent,
} from '../api/tents/service'

export const tentsRoutes = new Hono()

/** GET /api/tents */
tentsRoutes.get('/', async (c) => {
  try {
    const auth = await authenticate(c.req.raw)
    if (!auth.authenticated) return auth.response as Response

    const queryParams = Object.fromEntries(
      new URL(c.req.raw.url).searchParams.entries(),
    )
    const validation = listTentsQuerySchema.safeParse(queryParams)
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

    const result = await listTents(auth.user.userId, validation.data)
    if (!result.success) return c.json({ success: false, error: result.error }, 400)
    return c.json({ success: true, data: result.data })
  } catch (error) {
    console.error('List tents error:', error)
    return c.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      500,
    )
  }
})

/** POST /api/tents */
tentsRoutes.post('/', async (c) => {
  try {
    const auth = await authenticate(c.req.raw)
    if (!auth.authenticated) return auth.response as Response

    const body = await c.req.json()
    const validation = createTentSchema.safeParse(body)
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}
      for (const error of validation.error.errors)
        fieldErrors[error.path.join('.')] = error.message
      return c.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            fields: fieldErrors,
          },
        },
        400,
      )
    }

    const result = await createTent(auth.user.userId, validation.data)
    if (!result.success) return c.json({ success: false, error: result.error }, 400)
    return c.json({ success: true, data: { tent: result.data.tent } }, 201)
  } catch (error) {
    console.error('Create tent error:', error)
    return c.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      500,
    )
  }
})

/** GET /api/tents/:tentId */
tentsRoutes.get('/:tentId', async (c) => {
  try {
    const auth = await authenticate(c.req.raw)
    if (!auth.authenticated) return auth.response as Response

    const result = await getTent(c.req.param('tentId'), auth.user.userId)
    if (!result.success) {
      const status = result.error.code === 'TENT_NOT_FOUND' ? 404 : 403
      return c.json({ success: false, error: result.error }, status)
    }
    return c.json({ success: true, data: { tent: result.data.tent } })
  } catch (error) {
    console.error('Get tent error:', error)
    return c.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      500,
    )
  }
})

/** PATCH /api/tents/:tentId */
tentsRoutes.patch('/:tentId', async (c) => {
  try {
    const auth = await authenticate(c.req.raw)
    if (!auth.authenticated) return auth.response as Response

    const body = await c.req.json()
    const validation = updateTentSchema.safeParse(body)
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}
      for (const error of validation.error.errors)
        fieldErrors[error.path.join('.')] = error.message
      return c.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            fields: fieldErrors,
          },
        },
        400,
      )
    }

    const result = await updateTent(
      c.req.param('tentId'),
      auth.user.userId,
      validation.data,
    )
    if (!result.success) {
      const status = result.error.code === 'TENT_NOT_FOUND' ? 404 : 403
      return c.json({ success: false, error: result.error }, status)
    }
    return c.json({ success: true, data: { tent: result.data.tent } })
  } catch (error) {
    console.error('Update tent error:', error)
    return c.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      500,
    )
  }
})

/** DELETE /api/tents/:tentId */
tentsRoutes.delete('/:tentId', async (c) => {
  try {
    const auth = await authenticate(c.req.raw)
    if (!auth.authenticated) return auth.response as Response

    const result = await deleteTent(c.req.param('tentId'), auth.user.userId)
    if (!result.success) {
      const status = result.error.code === 'TENT_NOT_FOUND' ? 404 : 403
      return c.json({ success: false, error: result.error }, status)
    }
    return c.json({ success: true, data: result.data })
  } catch (error) {
    console.error('Delete tent error:', error)
    return c.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      500,
    )
  }
})
