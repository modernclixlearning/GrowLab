/**
 * GrowLab - Frontend Types for Tents (F2)
 *
 * TypeScript types matching backend API responses for tent management.
 */

export interface Tent {
  id: string
  userId: string
  name: string
  /** Numeric values come back as strings from drizzle/pg — keep that wire shape. */
  lightTarget: string | null
  humidityTargetPct: string | null
  tempTargetC: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateTentRequest {
  name: string
  lightTarget?: string
  humidityTargetPct?: number
  tempTargetC?: number
  notes?: string
}

export interface UpdateTentRequest {
  name?: string
  lightTarget?: string | null
  humidityTargetPct?: number | null
  tempTargetC?: number | null
  notes?: string | null
}

export interface ListTentsParams {
  limit?: number
  offset?: number
}

export interface TentResponse {
  tent: Tent
}

export interface TentsListResponse {
  tents: Tent[]
  total: number
}

export interface DeleteTentResponse {
  message: string
}
