/**
 * GrowLab Uploads Routes (F4)
 *
 * POST /api/uploads/presigned   — generate a presigned R2 PUT URL
 * POST /api/uploads/photos      — save a photo record after upload completes
 * GET  /api/uploads/photos/:plantId — list all photos for a plant
 */

import { Hono } from 'hono'
import { authenticate } from '@/server/lib/auth-middleware'
import { presignedUrlSchema, createPhotoSchema } from '@/server/api/uploads/schemas'
import {
  generatePresignedUrl,
  savePhoto,
  listPhotos,
} from '@/server/api/uploads/service'
import { db } from '@/server/db'
import { users } from '@/server/db/schema'
import { eq } from 'drizzle-orm'

const uploadsRoutes = new Hono()

// POST /api/uploads/presigned
uploadsRoutes.post('/presigned', async (c) => {
  const auth = await authenticate(c.req.raw)
  if (!auth.authenticated) return auth.response as Response

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } }, 400)
  }

  const parsed = presignedUrlSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const [field, msgs] of Object.entries(parsed.error.flatten().fieldErrors)) {
      fieldErrors[field] = msgs?.[0] ?? 'Invalid value'
    }
    return c.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', fields: fieldErrors } },
      400,
    )
  }

  const [userRow] = await db
    .select({ stageMode: users.stageMode })
    .from(users)
    .where(eq(users.id, auth.user.userId))
    .limit(1)
  const stageMode = userRow?.stageMode ?? 'expert'

  const result = await generatePresignedUrl(
    parsed.data,
    auth.user.userId,
    stageMode,
  )

  if (!result.success) {
    const statusMap: Record<string, 400 | 403 | 404 | 422 | 503> = {
      PLANT_NOT_FOUND:  404,
      PLANT_FORBIDDEN:  403,
      QUOTA_EXCEEDED:   422,
      R2_CONFIG_MISSING: 503,
    }
    const status = statusMap[result.error] ?? 400
    return c.json({ success: false, error: { code: result.error, message: result.message } }, status)
  }

  return c.json({ success: true, data: result.data })
})

// POST /api/uploads/photos
uploadsRoutes.post('/photos', async (c) => {
  const auth = await authenticate(c.req.raw)
  if (!auth.authenticated) return auth.response as Response

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } }, 400)
  }

  const parsed = createPhotoSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const [field, msgs] of Object.entries(parsed.error.flatten().fieldErrors)) {
      fieldErrors[field] = msgs?.[0] ?? 'Invalid value'
    }
    return c.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', fields: fieldErrors } },
      400,
    )
  }

  const result = await savePhoto(parsed.data, auth.user.userId, 'upload')
  if (!result.success) {
    const statusMap: Record<string, 400 | 403 | 404> = {
      PLANT_NOT_FOUND: 404,
      PLANT_FORBIDDEN: 403,
    }
    const status = statusMap[result.error] ?? 400
    return c.json({ success: false, error: { code: result.error, message: result.message } }, status)
  }

  return c.json({ success: true, data: result.data }, 201)
})

// GET /api/uploads/photos/:plantId
uploadsRoutes.get('/photos/:plantId', async (c) => {
  const auth = await authenticate(c.req.raw)
  if (!auth.authenticated) return auth.response as Response

  const { plantId } = c.req.param()
  const result = await listPhotos(plantId, auth.user.userId)

  if (!result.success) {
    const statusMap: Record<string, 400 | 403 | 404> = {
      PLANT_NOT_FOUND: 404,
      PLANT_FORBIDDEN: 403,
    }
    const status = statusMap[result.error] ?? 400
    return c.json({ success: false, error: { code: result.error, message: result.message } }, status)
  }

  return c.json({ success: true, data: result.data })
})

export { uploadsRoutes }
