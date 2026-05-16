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

internalRoutes.post('/poll-sensors', async (c) => {
  try {
    const { pollAndAlert } = await import('../jobs/sensor-poll')
    const result = await pollAndAlert()
    return c.json({ success: true, ...result })
  } catch (error) {
    console.error('[internal/poll-sensors] Error:', error)
    return c.json({ success: false, error: 'poll-sensors failed' }, 500)
  }
})

internalRoutes.post('/check-schedules', async (c) => {
  try {
    const { checkSchedulesDue } = await import('../api/notifications/service')
    const result = await checkSchedulesDue()
    return c.json({ success: true, ...result })
  } catch (error) {
    console.error('[internal/check-schedules] Error:', error)
    return c.json({ success: false, error: 'check-schedules failed' }, 500)
  }
})

internalRoutes.post('/cleanup', async (c) => {
  try {
    const [{ purgeNotifications }, { cleanupOldReadings }] = await Promise.all([
      import('../api/notifications/service'),
      import('../jobs/sensor-poll'),
    ])
    await Promise.all([purgeNotifications(), cleanupOldReadings()])
    return c.json({ success: true, message: 'cleanup complete' })
  } catch (error) {
    console.error('[internal/cleanup] Error:', error)
    return c.json({ success: false, error: 'Cleanup failed' }, 500)
  }
})
