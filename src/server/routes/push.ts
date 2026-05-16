import { Hono, type Context } from 'hono'
import { authenticate } from '../lib/auth-middleware'
import { pushSubscribeSchema, pushUnsubscribeSchema } from '../api/push/schemas'
import { getVapidPublicKey, subscribe, unsubscribe } from '../api/push/service'

export const pushRoutes = new Hono()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validationError(c: Context<any>, errors: Record<string, string>) {
  return c.json(
    { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request', fields: errors } },
    400,
  )
}

/** GET /api/push/vapid-public-key — public endpoint */
pushRoutes.get('/vapid-public-key', (c) => {
  const key = getVapidPublicKey()
  if (!key) {
    return c.json({ success: false, error: { code: 'NOT_CONFIGURED', message: 'Push not configured' } }, 503)
  }
  return c.json({ success: true, key })
})

/** POST /api/push/subscribe */
pushRoutes.post('/subscribe', async (c) => {
  try {
    const auth = await authenticate(c.req.raw)
    if (!auth.authenticated) return auth.response as Response

    const body: unknown = await c.req.json()
    const validation = pushSubscribeSchema.safeParse(body)
    if (!validation.success) {
      const fields: Record<string, string> = {}
      for (const e of validation.error.errors) fields[e.path.join('.')] = e.message
      return validationError(c, fields)
    }

    const result = await subscribe(auth.user.userId, validation.data)
    if (!result.success) return c.json({ success: false, error: result.error }, 400)
    return c.json({ success: true }, 201)
  } catch (error) {
    console.error('Push subscribe error:', error)
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500)
  }
})

/** DELETE /api/push/subscribe */
pushRoutes.delete('/subscribe', async (c) => {
  try {
    const auth = await authenticate(c.req.raw)
    if (!auth.authenticated) return auth.response as Response

    const body: unknown = await c.req.json()
    const validation = pushUnsubscribeSchema.safeParse(body)
    if (!validation.success) {
      const fields: Record<string, string> = {}
      for (const e of validation.error.errors) fields[e.path.join('.')] = e.message
      return validationError(c, fields)
    }

    const result = await unsubscribe(auth.user.userId, validation.data.endpoint)
    if (!result.success) return c.json({ success: false, error: result.error }, 400)
    return c.json({ success: true })
  } catch (error) {
    console.error('Push unsubscribe error:', error)
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500)
  }
})
