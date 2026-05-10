/**
 * GrowLab Plant Photos API Client (F4)
 *
 * All functions follow the same pattern as care-logs.ts:
 * - accessToken passed as first argument (from useAuth in the hook layer)
 * - credentials: 'include' for the httpOnly refresh cookie
 * - Returns the parsed JSON response; throws on non-2xx via ApiResponseError
 */

import type { ApiResponse } from '@/types/auth'
import { ApiResponseError } from '@/lib/api/errors'
import type {
  GetPresignedUrlInput,
  PresignedUrlResponse,
  SavePhotoInput,
  GenerateImageInput,
  PlantPhoto,
  PhotosListResponse,
} from '@/types/plant-photos'

async function fetchUploadsApi<T>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const response = await fetch(`/api/uploads${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
    credentials: 'include',
  })
  return response.json()
}

async function fetchAiApi<T>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const response = await fetch(`/api/ai${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
    credentials: 'include',
  })
  return response.json()
}

function assertSuccess<T>(result: ApiResponse<T>): T {
  if (!result.success) {
    throw new ApiResponseError(result.error)
  }
  return result.data as T
}

/** Step 1 of upload flow: obtain a presigned R2 PUT URL. */
export async function getPresignedUrl(
  accessToken: string,
  input: GetPresignedUrlInput,
): Promise<PresignedUrlResponse> {
  const result = await fetchUploadsApi<PresignedUrlResponse>(
    '/presigned',
    accessToken,
    { method: 'POST', body: JSON.stringify(input) },
  )
  return assertSuccess(result)
}

/** Step 2: PUT the file directly to R2 using the presigned URL. */
export async function putFileToR2(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  if (!res.ok) {
    throw new ApiResponseError({ code: 'R2_UPLOAD_ERROR', message: `R2 upload failed (${res.status})` })
  }
}

/** Step 3: Persist the photo record in the database. */
export async function savePhoto(
  accessToken: string,
  input: SavePhotoInput,
): Promise<{ photo: PlantPhoto }> {
  const result = await fetchUploadsApi<{ photo: PlantPhoto }>(
    '/photos',
    accessToken,
    { method: 'POST', body: JSON.stringify(input) },
  )
  return assertSuccess(result)
}

/** List all photos for a plant. */
export async function listPlantPhotos(
  accessToken: string,
  plantId: string,
): Promise<PhotosListResponse> {
  const result = await fetchUploadsApi<PhotosListResponse>(
    `/photos/${encodeURIComponent(plantId)}`,
    accessToken,
  )
  return assertSuccess(result)
}

/** Generate an AI plant image. */
export async function generateAiImage(
  accessToken: string,
  input: GenerateImageInput,
): Promise<{ photo: PlantPhoto }> {
  const result = await fetchAiApi<{ photo: PlantPhoto }>(
    '/generate-image',
    accessToken,
    { method: 'POST', body: JSON.stringify(input) },
  )
  return assertSuccess(result)
}
