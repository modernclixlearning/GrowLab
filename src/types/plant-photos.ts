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

/** Payload for POST /api/ai/generate-image */
export interface GenerateImageInput {
  plantId:     string
  stage:       GrowthStage
  stagePreset?: boolean
  prompt?:     string
}

export interface PhotosListResponse {
  photos: PlantPhoto[]
}
