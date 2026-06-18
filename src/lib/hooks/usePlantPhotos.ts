/**
 * GrowLab Plant Photos Hooks (F4)
 *
 * TanStack Query hooks for the image pipeline.
 * Upload flow: presigned → PUT to R2 → savePhoto (3 sequential async ops).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/lib/stores/auth'
import {
  listPlantPhotos,
  getPresignedUrl,
  putFileToR2,
  savePhoto,
  generateAiImage,
} from '@/lib/api/plant-photos'
import { getApiErrorToastMessage } from '@/lib/api/errors'
import { convertToWebP } from '@/lib/utils/image'
import type { GrowthStage } from '@/types/plants'

// ─── Query key factory ────────────────────────────────────────────────────────

export const photoKeys = {
  all:  (plantId: string) => ['plant-photos', plantId] as const,
  list: (plantId: string) => ['plant-photos', plantId, 'list'] as const,
}

// ─── usePlantPhotos ───────────────────────────────────────────────────────────

export function usePlantPhotos(plantId: string) {
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: photoKeys.list(plantId),
    queryFn:  () => listPlantPhotos(accessToken!, plantId),
    enabled:  !!plantId && !!accessToken,
  })
}

// ─── useUploadPhoto ───────────────────────────────────────────────────────────

interface UploadPhotoVars {
  plantId: string
  stage:   GrowthStage
  file:    File
}

export function useUploadPhoto() {
  const queryClient = useQueryClient()
  const { accessToken } = useAuth()

  return useMutation({
    mutationFn: async ({ plantId, stage, file }: UploadPhotoVars) => {
      if (!accessToken) throw new Error('Not authenticated')

      const webpFile = await convertToWebP(file)

      // Step 1 — request presigned URL
      const { uploadUrl, publicUrl } = await getPresignedUrl(accessToken, {
        plantId,
        stage,
        contentType: webpFile.type,
        sizeBytes:   webpFile.size,
      })

      // Step 2 — PUT file directly to R2
      await putFileToR2(uploadUrl, webpFile)

      // Step 3 — persist record
      const { photo } = await savePhoto(accessToken, { plantId, stage, url: publicUrl })
      return photo
    },
    onSuccess: (photo) => {
      queryClient.invalidateQueries({ queryKey: photoKeys.all(photo.plantId) })
      // Also invalidate the plant so heroPhotoUrl refreshes on detail page
      queryClient.invalidateQueries({ queryKey: ['plant', photo.plantId] })
      toast.success('Photo uploaded')
    },
    onError: (err) => {
      toast.error(getApiErrorToastMessage(err, 'Upload failed'))
    },
  })
}

// ─── useGenerateAiImage ───────────────────────────────────────────────────────

interface GenerateAiVars {
  plantId:     string
  stage:       GrowthStage
  stagePreset?: boolean
  prompt?:     string
}

export function useGenerateAiImage() {
  const queryClient = useQueryClient()
  const { accessToken } = useAuth()

  return useMutation({
    mutationFn: (vars: GenerateAiVars) => {
      if (!accessToken) throw new Error('Not authenticated')
      return generateAiImage(accessToken, vars)
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: photoKeys.all(result.photo.plantId) })
      queryClient.invalidateQueries({ queryKey: ['plant', result.photo.plantId] })
      toast.success('AI image generated')
    },
    onError: (err) => {
      toast.error(getApiErrorToastMessage(err, 'AI generation failed'))
    },
  })
}
