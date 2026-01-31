/**
 * GrowLab Auth API Client
 * 
 * API client functions for authentication endpoints.
 */

import type {
  ApiResponse,
  AuthResponse,
  RefreshResponse,
  LogoutResponse,
  MeResponse,
  RegisterRequest,
  LoginRequest,
} from '@/types/auth'

const API_BASE = '/api/auth'

/**
 * Make an authenticated API request
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies
  })

  return response.json()
}

/**
 * Register a new user account
 */
export async function register(
  data: RegisterRequest
): Promise<ApiResponse<AuthResponse>> {
  return fetchApi<AuthResponse>('/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Login with email and password
 */
export async function login(
  data: LoginRequest
): Promise<ApiResponse<AuthResponse>> {
  return fetchApi<AuthResponse>('/login', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Refresh the access token
 */
export async function refreshToken(): Promise<ApiResponse<RefreshResponse>> {
  return fetchApi<RefreshResponse>('/refresh', {
    method: 'POST',
  })
}

/**
 * Logout and invalidate tokens
 */
export async function logout(): Promise<ApiResponse<LogoutResponse>> {
  return fetchApi<LogoutResponse>('/logout', {
    method: 'POST',
  })
}

/**
 * Get current authenticated user
 */
export async function getMe(
  accessToken: string
): Promise<ApiResponse<MeResponse>> {
  return fetchApi<MeResponse>('/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}
