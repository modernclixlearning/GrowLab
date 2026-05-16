import { Hono } from 'hono'
import { env } from '../lib/env'

export const internalRoutes = new Hono()

internalRoutes.use('/*', async (c, next) => {
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token || token !== env.INTERNAL_CRON_SECRET) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }
  await next()
})

internalRoutes.post('/poll-sensors', (c) => {
  return c.json({ success: true, message: 'stub — F6c' })
})

internalRoutes.post('/check-schedules', (c) => {
  return c.json({ success: true, message: 'stub — F6b/F6c' })
})

internalRoutes.post('/cleanup', (c) => {
  return c.json({ success: true, message: 'stub — F6b/F6c' })
})
