/**
 * GrowLab AI Image Service (F4)
 *
 * Generates plant images via OpenAI gpt-image-1 and stores the result in
 * R2.  The AI provider is selected by the AI_PROVIDER env var (only 'openai'
 * is implemented; stub surface for future providers).
 *
 * Quotas:
 *   Basic  — 1 AI-generated image per plant lifetime
 *   Expert — 5 AI-generated images per plant lifetime
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { nanoid } from 'nanoid'
import { db } from '@/server/db'
import { env } from '@/server/lib/env'
import { plants } from '@/server/db/schema'
import { eq } from 'drizzle-orm'
import { buildPrompt } from '@/server/ai/stage-presets'
import { countAiPhotos, aiQuota, savePhoto } from '@/server/api/uploads/service'
import type { GenerateImageInput } from './schemas'

export type AiError =
  | 'PLANT_NOT_FOUND'
  | 'PLANT_FORBIDDEN'
  | 'QUOTA_EXCEEDED'
  | 'AI_CONFIG_MISSING'
  | 'AI_PROVIDER_ERROR'
  | 'R2_CONFIG_MISSING'

export type AiResult<T> =
  | { success: true; data: T }
  | { success: false; error: AiError; message: string }

function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT ?? '',
    credentials: {
      accessKeyId:     process.env.R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    },
  })
}

async function verifyPlantOwnership(plantId: string, userId: string) {
  const [plant] = await db.select().from(plants).where(eq(plants.id, plantId)).limit(1)
  if (!plant) return { ok: false as const, error: 'PLANT_NOT_FOUND' as AiError }
  if (plant.userId !== userId) return { ok: false as const, error: 'PLANT_FORBIDDEN' as AiError }
  return { ok: true as const, plant }
}

// ─── OpenAI adapter ───────────────────────────────────────────────────────────

async function generateWithOpenAi(prompt: string): Promise<{ url?: string; b64?: string }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('AI_CONFIG_MISSING')

  // Model: gpt-image-1 (dall-e-3 was deprecated — "model does not exist").
  // gpt-image-1 does NOT accept `response_format` (that was the original 400)
  // and always returns `b64_json`. `quality: 'medium'` keeps the per-image
  // cost (~$0.04) close to the old dall-e-3 'standard' instead of the
  // pricier 'auto'/high default. We still accept a `url` too (see reuploadToR2)
  // so the adapter is resilient to either response shape.
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model:   'gpt-image-1',
      prompt,
      n:       1,
      size:    '1024x1024',
      quality: 'medium',
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`OpenAI error ${res.status}: ${body}`)
  }

  const json = (await res.json()) as { data: { url?: string; b64_json?: string }[] }
  const item = json.data[0]
  if (item?.url) return { url: item.url }
  if (item?.b64_json) return { b64: item.b64_json }
  throw new Error('OpenAI returned no image data')
}

// ─── Download remote image and upload to R2 ───────────────────────────────────

async function reuploadToR2(
  source: { url?: string; b64?: string },
  userId: string,
  plantId: string,
  stage: string,
): Promise<string> {
  if (!process.env.R2_ENDPOINT || !process.env.R2_BUCKET_NAME) {
    throw new Error('R2_CONFIG_MISSING')
  }

  // Resolve the image bytes from whichever shape OpenAI returned.
  let buffer: Buffer
  let contentType: string
  if (source.url) {
    const imgRes = await fetch(source.url)
    if (!imgRes.ok) throw new Error('Failed to download AI image')
    buffer = Buffer.from(await imgRes.arrayBuffer())
    contentType = imgRes.headers.get('content-type') ?? 'image/png'
  } else if (source.b64) {
    buffer = Buffer.from(source.b64, 'base64')
    contentType = 'image/png' // images endpoint returns PNG
  } else {
    throw new Error('No image data to store')
  }

  const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'png'

  const key = `users/${userId}/plants/${plantId}/${stage}/ai-${nanoid()}.${ext}`
  const client = getR2Client()
  await client.send(
    new PutObjectCommand({
      Bucket:      process.env.R2_BUCKET_NAME,
      Key:         key,
      Body:        buffer,
      ContentType: contentType,
    }),
  )

  return `${process.env.R2_PUBLIC_BASE_URL ?? ''}/${key}`
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateAiImage(
  input: GenerateImageInput,
  userId: string,
  stageMode: string,
): Promise<AiResult<{ photo: { id: string; url: string; stage: string; sourceType: string } }>> {
  const ownership = await verifyPlantOwnership(input.plantId, userId)
  if (!ownership.ok) {
    return {
      success: false,
      error: ownership.error,
      message: ownership.error === 'PLANT_NOT_FOUND' ? 'Plant not found' : 'Access denied',
    }
  }

  // Quota check
  const used  = await countAiPhotos(input.plantId)
  const quota = aiQuota(stageMode)
  if (used >= quota) {
    return {
      success: false,
      error: 'QUOTA_EXCEEDED',
      message: `AI generation limit of ${quota} images per plant reached`,
    }
  }

  // Resolve the effective style ONCE (REG-1 default) so the persisted
  // ai_style matches the modifier actually applied — never null when a
  // concrete style was used.
  const style = input.style ?? 'photorealistic'

  // Resolve prompt — single pure composition point (stage/free + style modifier).
  // The style modifier is concatenated here, after schema validation, so it
  // never consumes the user's 500-char budget (REG-5).
  const prompt = buildPrompt({
    stage:       input.stage,
    stagePreset: input.stagePreset,
    prompt:      input.prompt,
    style,
  })

  // Generate
  let imageSource: { url?: string; b64?: string }
  try {
    const provider = env.AI_PROVIDER
    if (provider === 'openai') {
      imageSource = await generateWithOpenAi(prompt)
    } else {
      return { success: false, error: 'AI_CONFIG_MISSING', message: `Unsupported AI provider: ${provider}` }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message === 'AI_CONFIG_MISSING') {
      return { success: false, error: 'AI_CONFIG_MISSING', message: 'AI service is not configured' }
    }
    return { success: false, error: 'AI_PROVIDER_ERROR', message: `AI generation failed: ${message}` }
  }

  // Re-upload to R2 (OpenAI URLs expire after 1 hour; b64 is inlined directly)
  let publicUrl: string
  try {
    publicUrl = await reuploadToR2(imageSource, userId, input.plantId, input.stage)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message === 'R2_CONFIG_MISSING') {
      return { success: false, error: 'R2_CONFIG_MISSING', message: 'R2 storage is not configured' }
    }
    return { success: false, error: 'AI_PROVIDER_ERROR', message: `Failed to store AI image: ${message}` }
  }

  // Persist record
  const saveResult = await savePhoto(
    { plantId: input.plantId, stage: input.stage, url: publicUrl },
    userId,
    'ai',
    { prompt, provider: env.AI_PROVIDER, style },
  )

  if (!saveResult.success) {
    return { success: false, error: saveResult.error as AiError, message: saveResult.message }
  }

  return {
    success: true,
    data: {
      photo: saveResult.data.photo,
    },
  }
}
