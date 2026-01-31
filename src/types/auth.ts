/**
 * GrowLab - Frontend Types for Auth
 * 
 * TypeScript types matching backend API responses.
 */

/**
 * User entity (public data, excludes passwordHash)
 */
export interface User {
  id: string
  email: string
  name: string | null
  subscriptionTier: 'free' | 'premium'
  createdAt: string
  updatedAt: string
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
