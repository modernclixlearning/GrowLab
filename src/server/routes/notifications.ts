import { Hono, type Context } from 'hono'
import { authenticate } from '../lib/auth-middleware'
import { listNotificationsQuerySchema } from '../api/notifications/schemas'
import {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllRead,
} from '../api/notifications/service'

export const notificationsRoutes = new Hono()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validationError(c: Context<any>, errors: Record<string, string>) {
  return c.json(
    { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request', fields: errors } },
    400,
  )
}

/** GET /api/notifications */
notificationsRoutes.get('/', async (c) => {
  try {
    const auth = await authenticate(c.req.raw)
    if (!auth.authenticated) return auth.response as Response

    const rawParams = Object.fromEntries(new URL(c.req.raw.url).searchParams.entries())
    const validation = listNotificationsQuerySchema.safeParse(rawParams)
    if (!validation.success) {
      const fields: Record<string, string> = {}
      for (const e of validation.error.errors) fields[e.path.join('.')] = e.message
      return validationError(c, fields)
    }

    const result = await listNotifications(auth.user.userId, validation.data)
    if (!result.success) return c.json({ success: false, error: result.error }, 400)
    return c.json({ success: true, data: result.data })
  } catch (error) {
    console.error('List notifications error:', error)
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500)
  }
})

/** GET /api/notifications/unread-count — must be before /:id */
notificationsRoutes.get('/unread-count', async (c) => {
  try {
    const auth = await authenticate(c.req.raw)
    if (!auth.authenticated) return auth.response as Response

    const result = await getUnreadCount(auth.user.userId)
    if (!result.success) return c.json({ success: false, error: result.error }, 400)
    return c.json({ success: true, data: result.data })
  } catch (error) {
    console.error('Unread count error:', error)
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500)
  }
})

/** PATCH /api/notifications/read-all */
notificationsRoutes.patch('/read-all', async (c) => {
  try {
    const auth = await authenticate(c.req.raw)
    if (!auth.authenticated) return auth.response as Response

    const result = await markAllRead(auth.user.userId)
    if (!result.success) return c.json({ success: false, error: result.error }, 400)
    return c.json({ success: true, updated: result.data.updated })
  } catch (error) {
    console.error('Mark all read error:', error)
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500)
  }
})

/** PATCH /api/notifications/:id/read */
notificationsRoutes.patch('/:id/read', async (c) => {
  try {
    const auth = await authenticate(c.req.raw)
    if (!auth.authenticated) return auth.response as Response

    const result = await markNotificationRead(c.req.param('id'), auth.user.userId)
    if (!result.success) {
      const status = result.error.code === 'NOT_FOUND' ? 404 : 400
      return c.json({ success: false, error: result.error }, status)
    }
    return c.json({ success: true })
  } catch (error) {
    console.error('Mark read error:', error)
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500)
  }
})
