/**
 * GrowLab Upload Schemas (F4)
 *
 * Zod schemas for presigned-URL generation and photo save endpoints.
 */

import { z } from 'zod'
import { GROWTH_STAGES } from '@/server/db/schema'

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

/** POST /api/uploads/presigned */
export const presignedUrlSchema = z.object({
  plantId:     z.string().min(1),
  stage:       z.enum(GROWTH_STAGES),
  contentType: z
    .string()
    .refine(
      (v) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(v),
      { message: 'Unsupported image MIME type' },
    ),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(MAX_BYTES, { message: 'File exceeds 10 MB limit' }),
})

/** POST /api/uploads/photos */
export const createPhotoSchema = z.object({
  plantId:  z.string().min(1),
  stage:    z.enum(GROWTH_STAGES),
  url:      z.string().url(),
  width:    z.number().int().positive().optional(),
  height:   z.number().int().positive().optional(),
})

export type PresignedUrlInput = z.infer<typeof presignedUrlSchema>
export type CreatePhotoInput  = z.infer<typeof createPhotoSchema>
