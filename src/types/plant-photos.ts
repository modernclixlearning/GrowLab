/**
 * GrowLab Plant Photos Types (F4)
 *
 * Shared TypeScript interfaces for the F4 image pipeline — used by both
 * the API client layer and the component layer.
 */

import type { GrowthStage } from './plants'

export interface PlantPhoto {
  id:         string
  plantId:    string
  stage:      GrowthStage
  url:        string
  sourceType: 'upload' | 'ai'
  aiPrompt:   string | null
  aiProvider: string | null
  aiStyle:    StyleKey | null
  width:      number | null
  height:     number | null
  createdAt:  string
}

/** Response from POST /api/uploads/presigned */
export interface PresignedUrlResponse {
  uploadUrl: string
  publicUrl: string
  key:       string
  expiresIn: number
}

/** Payload for POST /api/uploads/presigned */
export interface GetPresignedUrlInput {
  plantId:     string
  stage:       GrowthStage
  contentType: string
  sizeBytes:   number
}

/** Payload for POST /api/uploads/photos */
export interface SavePhotoInput {
  plantId: string
  stage:   GrowthStage
  url:     string
  width?:  number
  height?: number
}

/** Visual style template keys for AI generation (mirror of server STYLE_KEYS). */
export type StyleKey = 'photorealistic' | 'illustration' | 'psychedelic' | 'minimal'

/** Payload for POST /api/ai/generate-image */
export interface GenerateImageInput {
  plantId:     string
  stage:       GrowthStage
  stagePreset?: boolean
  prompt?:     string
  style?:      StyleKey
}

/** Server-authoritative AI quota snapshot for a plant (REG-2). */
export interface AiQuota {
  used:      number
  limit:     number
  remaining: number
}

export interface PhotosListResponse {
  photos:  PlantPhoto[]
  aiQuota: AiQuota
}
