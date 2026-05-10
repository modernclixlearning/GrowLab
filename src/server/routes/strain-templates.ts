/**
 * GrowLab Strain Templates Routes
 *
 * Read-only catalogue exposed to authenticated users so the Add Plant
 * picker can offer named strains with sensible default stage durations and
 * light schedules (Master Plan §4.1 / §F2).
 *
 * No mutation endpoints — the catalogue is curated by maintainers and
 * seeded via `npm run db:seed`.
 */

import { Hono } from 'hono'
import { asc } from 'drizzle-orm'
import { authenticate } from '../lib/auth-middleware'
import { db } from '../db'
import { strainTemplates } from '../db/schema'

export const strainTemplatesRoutes = new Hono()

/** GET /api/strain-templates */
strainTemplatesRoutes.get('/', async (c) => {
  try {
    const auth = await authenticate(c.req.raw)
    if (!auth.authenticated) return auth.response as Response

    const list = await db
      .select()
      .from(strainTemplates)
      .orderBy(asc(strainTemplates.name))

    return c.json({
      success: true,
      data: { strainTemplates: list, total: list.length },
    })
  } catch (error) {
    console.error('List strain templates error:', error)
    return c.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      500,
    )
  }
})
