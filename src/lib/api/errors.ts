import type { ApiErrorResponse } from '@/types/auth'

type ApiError = ApiErrorResponse['error']

export class ApiResponseError extends Error {
  code: string
  fields?: Record<string, string>

  constructor(error: ApiError) {
    super(error.message)
    this.name = 'ApiResponseError'
    this.code = error.code
    this.fields = error.fields
  }
}

export function getApiErrorToastMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
) {
  if (error instanceof ApiResponseError) {
    switch (error.code) {
      case 'MISSING_TOKEN':
      case 'INVALID_TOKEN':
        return 'Your session expired. Please sign in again.'
      case 'VALIDATION_ERROR':
        return error.message || 'Please check the form and try again.'
      case 'INTERNAL_ERROR':
        return 'Something went wrong. Please try again.'
      default:
        return error.message || fallback
    }
  }

  if (error instanceof Error) return error.message || fallback

  return fallback
}