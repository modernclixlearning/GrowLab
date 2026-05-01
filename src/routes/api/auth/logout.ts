/**
 * GrowLab Auth API - Logout Endpoint
 */

import { createAPIFileRoute } from '@tanstack/start/api'
import { logout } from '@/server/api/auth/service'
import { getRefreshTokenCookie, clearRefreshTokenCookie } from '@/server/lib/cookies'

/**
 * POST /api/auth/logout
 * 
 * Invalidate refresh token and clear cookies.
 * 
 * Request:
 *   - Cookies: { refreshToken: string }
 * 
 * Response:
 *   - 200: { message }
 */
export const Route = createAPIFileRoute('/api/auth/logout')({
  POST: async ({ context }) => {
    try {
      // Get refresh token from cookie
      const refreshToken = getRefreshTokenCookie(context.event)

      if (refreshToken) {
        // Invalidate token in database
        await logout(refreshToken)
      }

      // Clear refresh token cookie
      clearRefreshTokenCookie(context.event)

      return Response.json({
        success: true,
        data: {
          message: 'Logged out successfully',
        },
      })
    } catch (error) {
      console.error('Logout error:', error)
      // Still clear cookie even on error
      clearRefreshTokenCookie(context.event)

      return Response.json({
        success: true,
        data: {
          message: 'Logged out successfully',
        },
      })
    }
  },
})
