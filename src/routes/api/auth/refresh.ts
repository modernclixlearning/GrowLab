/**
 * GrowLab Auth API - Refresh Endpoint
 */

import { createAPIFileRoute } from '@tanstack/start/api'
import { json } from '@tanstack/start'
import { refresh } from '@/server/api/auth/service'
import { getRefreshTokenCookie } from '@/server/lib/cookies'

/**
 * POST /api/auth/refresh
 * 
 * Refresh access token using refresh token cookie.
 * 
 * Request:
 *   - Cookies: { refreshToken: string }
 * 
 * Response:
 *   - 200: { accessToken }
 *   - 401: { error: { code, message } }
 */
export const Route = createAPIFileRoute('/api/auth/refresh')({
  POST: async ({ context }) => {
    try {
      // Get refresh token from cookie
      const refreshToken = getRefreshTokenCookie(context.event)

      if (!refreshToken) {
        return json(
          {
            success: false,
            error: {
              code: 'MISSING_TOKEN',
              message: 'Refresh token not found',
            },
          },
          { status: 401 }
        )
      }

      // Refresh tokens
      const result = await refresh(refreshToken)

      if (!result.success) {
        return json(
          { success: false, error: result.error },
          { status: 401 }
        )
      }

      return json({
        success: true,
        data: {
          accessToken: result.data.accessToken,
        },
      })
    } catch (error) {
      console.error('Refresh error:', error)
      return json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
          },
        },
        { status: 500 }
      )
    }
  },
})
