/**
 * GrowLab Upload Service (F4)
 *
 * Generates R2 presigned PUT URLs and persists photo records.
 *
 * Quotas (enforced at presigned-URL generation time):
 *   Basic tier  — 2 uploaded photos per stage, 1 AI-generated per plant
 *   Expert tier — 5 uploaded photos per stage, 5 AI-generated per plant
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { nanoid } from 'nanoid'
import { db } from '@/server/db'
import { plantPhotos, plants } from '@/server/db/schema'
import { eq, and, count } from 'drizzle-orm'
import type { PresignedUrlInput, CreatePhotoInput } from './schemas'

// ─── Quota constants ──────────────────────────────────────────────────────────

const UPLOAD_QUOTA: Record<string, number> = { basic: 2, expert: 5 }
const AI_QUOTA:     Record<string, number> = { basic: 1, expert: 5 }

function uploadQuota(tier: string) { return UPLOAD_QUOTA[tier] ?? UPLOAD_QUOTA.basic }
function aiQuota(tier: string)     { return AI_QUOTA[tier]     ?? AI_QUOTA.basic }

// ─── R2 client (lazy — only constructed when env vars are present) ────────────

function getR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT ?? '',
    credentials: {
      accessKeyId:     process.env.R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    },
  })
}

// ─── Error codes ─────────────────────────────────────────────────────────────

export type UploadError =
  | 'PLANT_NOT_FOUND'
  | 'PLANT_FORBIDDEN'
  | 'QUOTA_EXCEEDED'
  | 'R2_CONFIG_MISSING'

export type UploadResult<T> =
  | { success: true; data: T }
  | { success: false; error: UploadError; message: string }

// ─── Helper: verify plant ownership ──────────────────────────────────────────

async function verifyPlantOwnership(
  plantId: string,
  userId: string,
): Promise<{ ok: true; plant: typeof plants.$inferSelect } | { ok: false; error: UploadError }> {
  const [plant] = await db.select().from(plants).where(eq(plants.id, plantId)).limit(1)
  if (!plant) return { ok: false, error: 'PLANT_NOT_FOUND' }
  if (plant.userId !== userId) return { ok: false, error: 'PLANT_FORBIDDEN' }
  return { ok: true, plant }
}

// ─── generatePresignedUrl ─────────────────────────────────────────────────────

export interface PresignedUrlResult {
  uploadUrl: string
  publicUrl: string
  key:       string
  expiresIn: number
}

export async function generatePresignedUrl(
  input: PresignedUrlInput,
  userId: string,
  subscriptionTier: string,
): Promise<UploadResult<PresignedUrlResult>> {
  if (!process.env.R2_ENDPOINT || !process.env.R2_BUCKET_NAME) {
    return { success: false, error: 'R2_CONFIG_MISSING', message: 'R2 storage is not configured' }
  }

  const ownership = await verifyPlantOwnership(input.plantId, userId)
  if (!ownership.ok) {
    return {
      success: false,
      error: ownership.error,
      message: ownership.error === 'PLANT_NOT_FOUND' ? 'Plant not found' : 'Access denied',
    }
  }

  // Quota check: count uploaded photos for this plant+stage
  const [row] = await db
    .select({ total: count() })
    .from(plantPhotos)
    .where(
      and(
        eq(plantPhotos.plantId, input.plantId),
        eq(plantPhotos.stage, input.stage),
        eq(plantPhotos.sourceType, 'upload'),
      ),
    )
  const existing = Number(row?.total ?? 0)
  const quota = uploadQuota(subscriptionTier)
  if (existing >= quota) {
    return {
      success: false,
      error: 'QUOTA_EXCEEDED',
      message: `Upload limit of ${quota} photos per stage reached`,
    }
  }

  // Derive extension from content type
  const ext = input.contentType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
  const key = `users/${userId}/plants/${input.plantId}/${input.stage}/${nanoid()}.${ext}`
  const bucket = process.env.R2_BUCKET_NAME

  const client = getR2Client()
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: input.contentType,
    ContentLength: input.sizeBytes,
  })

  const expiresIn = 300 // 5 minutes
  const uploadUrl = await getSignedUrl(client, command, { expiresIn })
  const publicUrl = `${process.env.R2_PUBLIC_BASE_URL ?? ''}/${key}`

  return { success: true, data: { uploadUrl, publicUrl, key, expiresIn } }
}

// ─── savePhoto ────────────────────────────────────────────────────────────────

export interface SavePhotoResult {
  photo: typeof plantPhotos.$inferSelect
}

export async function savePhoto(
  input: CreatePhotoInput,
  userId: string,
  sourceType: 'upload' | 'ai' = 'upload',
  aiMeta?: { prompt?: string; provider?: string },
): Promise<UploadResult<SavePhotoResult>> {
  const ownership = await verifyPlantOwnership(input.plantId, userId)
  if (!ownership.ok) {
    return {
      success: false,
      error: ownership.error,
      message: ownership.error === 'PLANT_NOT_FOUND' ? 'Plant not found' : 'Access denied',
    }
  }

  const [photo] = await db
    .insert(plantPhotos)
    .values({
      plantId:    input.plantId,
      stage:      input.stage,
      url:        input.url,
      sourceType,
      aiPrompt:   aiMeta?.prompt,
      aiProvider: aiMeta?.provider,
      width:      input.width,
      height:     input.height,
    })
    .returning()

  // Update heroPhotoUrl on the plant so cards show the latest photo
  // without a JOIN. We overwrite unconditionally — most-recent wins.
  await db
    .update(plants)
    .set({ heroPhotoUrl: input.url, updatedAt: new Date() })
    .where(eq(plants.id, input.plantId))

  return { success: true, data: { photo: photo! } }
}

// ─── listPhotos ───────────────────────────────────────────────────────────────

export async function listPhotos(
  plantId: string,
  userId: string,
): Promise<UploadResult<{ photos: typeof plantPhotos.$inferSelect[] }>> {
  const ownership = await verifyPlantOwnership(plantId, userId)
  if (!ownership.ok) {
    return {
      success: false,
      error: ownership.error,
      message: ownership.error === 'PLANT_NOT_FOUND' ? 'Plant not found' : 'Access denied',
    }
  }

  const photos = await db
    .select()
    .from(plantPhotos)
    .where(eq(plantPhotos.plantId, plantId))
    .orderBy(plantPhotos.createdAt)

  return { success: true, data: { photos } }
}

// ─── countAiPhotos (used by AI service for quota) ────────────────────────────

export async function countAiPhotos(plantId: string): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(plantPhotos)
    .where(and(eq(plantPhotos.plantId, plantId), eq(plantPhotos.sourceType, 'ai')))
  return Number(row?.total ?? 0)
}

export { uploadQuota, aiQuota }
