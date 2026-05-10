/**
 * GrowLab - Frontend Types for Auth
 * 
 * TypeScript types matching backend API responses.
 */

/**
 * Stage mode toggle — Basic (3 buckets) vs Expert (7 stages).
 * Storage is always the 7-stage Expert model (issue 003 / N11); this flag
 * is purely presentational.
 */
export type StageMode = 'basic' | 'expert'

/**
 * User unit preferences. Storage units are fixed (cm, C); UI converts.
 */
export interface UnitsPreference {
  temp: 'C' | 'F'
  length: 'cm' | 'in'
}

/**
 * Notification channel toggles.
 */
export interface NotificationPrefs {
  push: boolean
  email: boolean
  inApp: boolean
}

/**
 * User entity (public data, excludes passwordHash)
 */
export interface User {
  id: string
  email: string
  name: string | null
  subscriptionTier: 'free' | 'premium'
  // F2 additions — backed by `users` schema in the DB.
  stageMode: StageMode
  unitsPreference: UnitsPreference | null
  avatarUrl: string | null
  notificationPrefs: NotificationPrefs | null
  defaultTentId: string | null
  hasOnboarded: boolean
  createdAt: string
  updatedAt: string
}

/**
 * F2 — PATCH /api/auth/me payload. All fields optional; sending `null`
 * clears the value where allowed.
 */
export interface UpdateMeRequest {
  name?: string | null
  stageMode?: StageMode
  hasOnboarded?: boolean
  avatarUrl?: string | null
  defaultTentId?: string | null
  unitsPreference?: UnitsPreference
  notificationPrefs?: NotificationPrefs
}

/**
 * API success response wrapper
 */
export interface ApiSuccessResponse<T> {
  success: true
  data: T
}

/**
 * API error response wrapper
 */
export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    fields?: Record<string, string>
  }
}

/**
 * Combined API response type
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Auth API response types
 */
export interface AuthResponse {
  user: User
  accessToken: string
}

export interface RefreshResponse {
  accessToken: string
}

export interface LogoutResponse {
  message: string
}

export interface MeResponse {
  user: User
}

/**
 * Auth request types
 */
export interface RegisterRequest {
  email: string
  password: string
  name?: string
}

export interface LoginRequest {
  email: string
  password: string
}
