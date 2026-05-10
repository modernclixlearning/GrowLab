/**
 * GrowLab AI Routes (F4)
 *
 * POST /api/ai/generate-image  — generate an AI plant image
 */

import { Hono } from 'hono'
import { authenticate } from '@/server/lib/auth-middleware'
import { generateImageSchema } from '@/server/api/ai/schemas'
import { generateAiImage } from '@/server/api/ai/service'

const aiRoutes = new Hono()

// POST /api/ai/generate-image
aiRoutes.post('/generate-image', async (c) => {
  const auth = await authenticate(c.req.raw)
  if (!auth.authenticated) return auth.response as Response

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } }, 400)
  }

  const parsed = generateImageSchema.safeParse(body)
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

  const result = await generateAiImage(
    parsed.data,
    auth.user.userId,
    auth.user.subscriptionTier,
  )

  if (!result.success) {
    const statusMap: Record<string, 400 | 403 | 404 | 422 | 500 | 503> = {
      PLANT_NOT_FOUND:    404,
      PLANT_FORBIDDEN:    403,
      QUOTA_EXCEEDED:     422,
      AI_CONFIG_MISSING:  503,
      AI_PROVIDER_ERROR:  500,
      R2_CONFIG_MISSING:  503,
    }
    const status = statusMap[result.error] ?? 500
    return c.json({ success: false, error: { code: result.error, message: result.message } }, status)
  }

  return c.json({ success: true, data: result.data }, 201)
})

export { aiRoutes }
